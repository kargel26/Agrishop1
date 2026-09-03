const Razorpay = require('razorpay');
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
      .from('orders')
      .select('id,order_number,total,status,user_id')
      .eq('id', orderId)
      .maybeSingle();
    if (orderError) {
      console.error('Order lookup error:', orderError);
      return res.status(500).json({ error: 'Could not load order' });
    }
    if (!order || order.user_id !== user.id) return res.status(404).json({ error: 'Order not found' });
    if (!['pending','confirmed'].includes(order.status)) return res.status(400).json({ error: 'Order is not payable' });

    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from('payments')
      .select('status,razorpay_order_id,razorpay_payment_id,amount')
      .eq('order_id', order.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingPaymentError) return res.status(500).json({ error: 'Could not load payment state' });
    if (existingPayment?.status === 'paid') {
      return res.status(409).json({ error: 'This order has already been paid', paid: true, razorpay_payment_id: existingPayment.razorpay_payment_id });
    }

    if (order.status === 'confirmed') {
      const { error: normalizeError } = await supabase
        .from('orders')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('user_id', user.id);
      if (normalizeError) return res.status(500).json({ error: 'Could not reset unpaid order' });
    }

    const amount = Math.round(Number(order.total) * 100);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid order amount' });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay server configuration is missing' });
    }

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const rzpOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: order.order_number,
      notes: { supabase_order_id: order.id, user_id: user.id }
    });

    const { error: paymentError } = await supabase.from('payments').upsert({
      order_id: order.id,
      user_id: user.id,
      provider: 'razorpay',
      razorpay_order_id: rzpOrder.id,
      amount: Number(order.total),
      status: 'created',
      razorpay_payment_id: null,
      razorpay_signature: null,
      method: null,
      paid_at: null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'order_id' });
    if (paymentError) return res.status(500).json({ error: 'Could not initialize payment' });

    return res.status(200).json({ id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    return res.status(500).json({ error: 'Payment initialization failed' });
  }
};
