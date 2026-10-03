-- Lock down direct client-side order/payment writes.
drop policy if exists "orders_customer_insert_own" on public.orders;
drop policy if exists "orders_customer_update_own_pending" on public.orders;
drop policy if exists "order_items_insert_related" on public.order_items;
drop policy if exists "payments_customer_insert_own" on public.payments;

-- Customer orders are created only through create_order_secure().
-- Customer cancellation is handled only through cancel_pending_order().
-- Payment rows are created/updated by trusted server-side payment flows.

-- Fix seller tracking authorization. The previous predicate compared the
-- same column to itself, which did not constrain the target order.
drop policy if exists "order_tracking_seller_insert" on public.order_tracking_events;
drop policy if exists "order_tracking_seller_update" on public.order_tracking_events;

create policy "order_tracking_seller_insert"
on public.order_tracking_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.order_items oi
    where oi.order_id = order_tracking_events.order_id
      and oi.seller_id = public.seller_id_for_user()
  )
);

create policy "order_tracking_seller_update"
on public.order_tracking_events
for update
to authenticated
using (
  exists (
    select 1
    from public.order_items oi
    where oi.order_id = order_tracking_events.order_id
      and oi.seller_id = public.seller_id_for_user()
  )
)
with check (
  exists (
    select 1
    from public.order_items oi
    where oi.order_id = order_tracking_events.order_id
      and oi.seller_id = public.seller_id_for_user()
  )
);
