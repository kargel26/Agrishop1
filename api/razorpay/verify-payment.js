const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Invalid session' });

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: 'Incomplete payment details' });

    const { data: payment, error: paymentError } = await supabase.from('payments')
      .select('id,order_id,user_id,amount,razorpay_order_id,status').eq('order_id', orderId).eq('user_id', user.id).single();
    if (paymentError || !payment) return res.status(404).json({ error: 'Payment record not found' });
    if (payment.razorpay_order_id !== razorpay_order_id) return res.status(400).json({ error: 'Payment order mismatch' });

    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(razorpay_signature, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ error: 'Payment signature verification failed' });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(500).json({ error: 'Razorpay server configuration is missing' });
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedAmount = Math.round(Number(payment.amount) * 100);
    if (rzpPayment.order_id !== razorpay_order_id) return res.status(400).json({ error: 'Razorpay payment/order mismatch' });
    if (Number(rzpPayment.amount) !== expectedAmount) return res.status(400).json({ error: 'Payment amount mismatch' });
    if (!['authorized', 'captured'].includes(rzpPayment.status)) return res.status(400).json({ error: `Payment is not successful (status: ${rzpPayment.status})` });

    const { error: updateError } = await supabase.from('payments').update({
      razorpay_payment_id, razorpay_signature, status: 'paid', method: rzpPayment.method || null,
      paid_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).eq('id', payment.id).eq('user_id', user.id);
    if (updateError) return res.status(500).json({ error: 'Could not update payment' });
    const { error: orderUpdateError } = await supabase.from('orders').update({ status: 'confirmed', updated_at: new Date().toISOString() }).eq('id', orderId).eq('user_id', user.id);
    if (orderUpdateError) return res.status(500).json({ error: 'Payment verified but order update failed' });
    return res.status(200).json({ verified: true, orderId, paymentStatus: rzpPayment.status, method: rzpPayment.method || null });
  } catch (error) {
    console.error('Razorpay verify-payment error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
};
