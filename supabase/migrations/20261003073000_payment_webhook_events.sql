create table if not exists public.payment_webhook_events (
  event_id text primary key,
  event_type text,
  razorpay_order_id text,
  received_at timestamptz not null default now()
);
revoke all on public.payment_webhook_events from anon, authenticated;
grant all on public.payment_webhook_events to service_role;