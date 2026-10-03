const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function rawBody(req) {
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return Buffer.from(req.body);
  return Buffer.from(JSON.stringify(req.body || {}));
}

function safeEqualHex(expected, received) {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(received), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'Webhook secret is not configured' });

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing webhook signature' });

  const raw = rawBody(req);
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  if (!safeEqualHex(expected, signature)) return res.status(401).json({ error: 'Invalid webhook signature' });

  const event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
    ? JSON.parse(raw.toString('utf8'))
    : (req.body || {});
  const payment = event.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id || event.payload?.order?.entity?.id;
  const eventId = req.headers['x-razorpay-event-id'] || event.id || null;

  if (!rzpOrderId) return res.status(200).json({ received: true, ignored: true });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return res.status(500).json({ error: 'Supabase server credentials are not configured' });

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const isPaid = ['payment.captured', 'order.paid'].includes(event.event) || payment?.status === 'captured';
  const isFailed = event.event === 'payment.failed';
  const paymentStatus = isPaid ? 'paid' : isFailed ? 'failed' : null;
  if (!paymentStatus) return res.status(200).json({ received: true, ignored: true });

  // Ignore duplicate webhook deliveries when an event identifier is available.
  if (eventId) {
    const { data: existing, error: lookupError } = await supabase
      .from('payment_webhook_events')
      .select('event_id')
      .eq('event_id', String(eventId))
      .maybeSingle();
    if (lookupError && lookupError.code !== '42P01') return res.status(500).json({ error: lookupError.message });
    if (existing) return res.status(200).json({ received: true, duplicate: true });
  }

  const { data: paymentRow, error: paymentLookupError } = await supabase
    .from('payments')
    .select('id,order_id,status')
    .eq('razorpay_order_id', rzpOrderId)
    .maybeSingle();
  if (paymentLookupError) return res.status(500).json({ error: paymentLookupError.message });
  if (!paymentRow) return res.status(200).json({ received: true, ignored: true });

  const amount = payment?.amount == null ? null : Number(payment.amount) / 100;
  const { data: finalized, error: finalizeError } = await supabase.rpc('finalize_razorpay_webhook_payment', {
    p_razorpay_order_id: rzpOrderId,
    p_razorpay_payment_id: payment?.id || null,
    p_method: payment?.method || null,
    p_amount: amount,
    p_payment_status: paymentStatus
  });
  if (finalizeError) return res.status(500).json({ error: finalizeError.message });
  if (!finalized?.processed) return res.status(200).json({ received: true, ignored: true });

  if (eventId) {
    const { error: eventError } = await supabase.from('payment_webhook_events').insert({
      event_id: String(eventId),
      event_type: event.event || null,
      razorpay_order_id: rzpOrderId,
      received_at: new Date().toISOString()
    });
    if (eventError && eventError.code !== '23505') return res.status(500).json({ error: eventError.message });
  }

  return res.status(200).json({ received: true });
};
