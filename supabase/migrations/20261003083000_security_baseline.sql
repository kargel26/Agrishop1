-- Security hardening for internal payment webhook state.
-- This table is service-role only and must never be exposed through the Data API.

alter table public.payment_webhook_events enable row level security;

drop policy if exists "payment_webhook_events_service_role_only" on public.payment_webhook_events;

create policy "payment_webhook_events_service_role_only"
on public.payment_webhook_events
as restrictive
for all
to service_role
using (true)
with check (true);

revoke all on public.payment_webhook_events from anon, authenticated, public;
grant all on public.payment_webhook_events to service_role;

-- Defense in depth for future privileged functions created in the public schema.
-- Individual application RPCs must explicitly grant only the roles that need them.
alter default privileges in schema public
  revoke execute on functions from public;
alter default privileges in schema public
  revoke execute on functions from anon;
alter default privileges in schema public
  revoke execute on functions from authenticated;
