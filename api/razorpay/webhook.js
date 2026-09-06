const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'Webhook secret is not configured' });
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing webhook signature' });

  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(String(signature), 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Invalid webhook signature' });

    const event = req.body || {};
    const payment = event.payload?.payment?.entity;
    const rzpOrderId = payment?.order_id || event.payload?.order?.entity?.id;
    if (!rzpOrderId) return res.status(200).json({ received: true, ignored: true });

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Supabase server credentials are not configured' });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data: stored, error: lookupError } = await supabase.from('payments')
      .select('id,order_id,amount,status,razorpay_payment_id').eq('razorpay_order_id', rzpOrderId).maybeSingle();
    if (lookupError) return res.status(500).json({ error: 'Could not load payment record' });
    if (!stored) return res.status(200).json({ received: true, ignored: true });

    const isPaid = ['payment.captured', 'order.paid'].includes(event.event) || payment?.status === 'captured';
    const isFailed = event.event === 'payment.failed';
    if (!isPaid && !isFailed) return res.status(200).json({ received: true, ignored: true });

    // Ignore duplicate/late failure events after a payment has already been captured.
    if (stored.status === 'paid') return res.status(200).json({ received: true, idempotent: true });

    if (isPaid) {
      const expectedPaise = Math.round(Number(stored.amount) * 100);
      if (!Number.isSafeInteger(expectedPaise) || Number(payment?.amount) !== expectedPaise || payment?.currency !== 'INR') {
        return res.status(400).json({ error: 'Webhook payment amount or currency mismatch' });
      }
    }

    const now = new Date().toISOString();
    const { error: paymentUpdateError } = await supabase.from('payments').update({
      status: isPaid ? 'paid' : 'failed', razorpay_payment_id: payment?.id || stored.razorpay_payment_id || null,
      method: payment?.method || null, paid_at: isPaid ? now : null, updated_at: now
    }).eq('id', stored.id).neq('status', 'paid');
    if (paymentUpdateError) return res.status(500).json({ error: 'Could not update payment state' });

    const { error: orderError } = await supabase.from('orders').update({
      status: isPaid ? 'confirmed' : 'pending', updated_at: now
    }).eq('id', stored.order_id).in('status', ['pending','confirmed']);
    if (orderError) return res.status(500).json({ error: 'Could not reconcile order state' });

    return res.status(200).json({ received: true, reconciled: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
