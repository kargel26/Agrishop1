const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'Webhook secret is not configured' });
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing webhook signature' });

  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(String(signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Invalid webhook signature' });

  const event = req.body || {};
  const payment = event.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id || event.payload?.order?.entity?.id;
  if (!rzpOrderId) return res.status(200).json({ received: true, ignored: true });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return res.status(500).json({ error: 'Supabase server credentials are not configured' });
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const isPaid = ['payment.captured', 'order.paid'].includes(event.event) || payment?.status === 'captured';
  const isFailed = event.event === 'payment.failed';
  const paymentStatus = isPaid ? 'paid' : isFailed ? 'failed' : null;
  if (paymentStatus) {
    const update = { status: paymentStatus, razorpay_payment_id: payment?.id || null, method: payment?.method || null, updated_at: new Date().toISOString() };
    if (isPaid) update.paid_at = new Date().toISOString();
    const { data: p, error } = await supabase.from('payments').update(update).eq('razorpay_order_id', rzpOrderId).select('order_id').maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (p?.order_id) {
      await supabase.from('orders').update({ status: isPaid ? 'confirmed' : 'pending', updated_at: new Date().toISOString() }).eq('id', p.order_id);
    }
  }
  return res.status(200).json({ received: true });
};
