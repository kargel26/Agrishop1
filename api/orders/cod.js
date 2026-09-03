const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Supabase server configuration is missing' });
    }

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Invalid session' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const { data: order, error: orderError } = await supabase
      .from('orders').select('id,order_number,total,status,user_id')
      .eq('id', orderId).eq('user_id', user.id).maybeSingle();
    if (orderError) return res.status(500).json({ error: 'Could not load order' });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order is not available for COD' });

    const { data: existing, error: existingError } = await supabase
      .from('payments').select('id,status,method').eq('order_id', order.id).eq('user_id', user.id).maybeSingle();
    if (existingError) return res.status(500).json({ error: 'Could not load payment state' });
    if (existing?.status === 'paid') return res.status(409).json({ error: 'This order is already paid' });

    const { error: paymentError } = await supabase.from('payments').upsert({
      order_id: order.id,
      user_id: user.id,
      provider: 'cod',
      razorpay_order_id: null,
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount: Number(order.total),
      status: 'pending',
      method: 'cod',
      paid_at: null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'order_id' });
    if (paymentError) return res.status(500).json({ error: 'Could not save COD payment' });

    const { error: orderUpdateError } = await supabase.from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', order.id).eq('user_id', user.id).eq('status', 'pending');
    if (orderUpdateError) return res.status(500).json({ error: 'Could not confirm COD order' });

    return res.status(200).json({ confirmed: true, orderId: order.id, orderNumber: order.order_number, paymentStatus: 'pending', paymentMethod: 'cod' });
  } catch (error) {
    console.error('COD order error:', error);
    return res.status(500).json({ error: 'Could not place COD order' });
  }
};
