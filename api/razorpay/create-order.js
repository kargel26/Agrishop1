const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    // Preserve the caller's Supabase JWT for all database queries so RLS
    // evaluates auth.uid() as the signed-in customer, not as anon.
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Invalid session' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,order_number,total,status,user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();
    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });
    if (!['pending','confirmed'].includes(order.status)) return res.status(400).json({ error: 'Order is not payable' });

    const amount = Math.round(Number(order.total) * 100);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid order amount' });

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const rzpOrder = await razorpay.orders.create({ amount, currency: 'INR', receipt: order.order_number, notes: { supabase_order_id: order.id, user_id: user.id } });

    const { error: paymentError } = await supabase.from('payments').upsert({
      order_id: order.id,
      user_id: user.id,
      provider: 'razorpay',
      razorpay_order_id: rzpOrder.id,
      amount: Number(order.total),
      status: 'created'
    }, { onConflict: 'order_id' });
    if (paymentError) return res.status(500).json({ error: 'Could not initialize payment' });

    return res.status(200).json({ id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    return res.status(500).json({ error: 'Payment initialization failed' });
  }
};
