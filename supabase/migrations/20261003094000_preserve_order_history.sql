-- Prevent hard deletion of historical orders and order items through the browser Data API.
-- Order history should be retained; cancellations use controlled status transitions.
drop policy if exists "orders_admin_delete" on public.orders;
drop policy if exists "order_items_admin_delete" on public.order_items;
