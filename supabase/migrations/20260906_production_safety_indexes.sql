-- AgriMart production safety: RPC privilege tightening + FK indexes.
-- Applied to Supabase project ggrypjuwwmiisgtgpozj on 2026-09-06.

begin;

-- Client roles do not need to invoke the schema-management event trigger.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- These helpers are used by authenticated RLS policies, so authenticated EXECUTE
-- is retained. Anonymous storefront clients do not need to invoke them directly.
revoke execute on function public.current_profile_role() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.seller_id_for_user() from anon;
revoke execute on function public.seller_can_view_order(uuid) from anon;

-- Foreign-key indexes recommended by the Supabase advisor.
create index if not exists cart_items_product_id_idx on public.cart_items(product_id);
create index if not exists contact_messages_user_id_idx on public.contact_messages(user_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists order_tracking_events_updated_by_idx on public.order_tracking_events(updated_by);
create index if not exists orders_address_id_idx on public.orders(address_id);
create index if not exists orders_coupon_id_idx on public.orders(coupon_id);
create index if not exists returns_order_id_idx on public.returns(order_id);
create index if not exists returns_user_id_idx on public.returns(user_id);
create index if not exists reviews_order_id_idx on public.reviews(order_id);
create index if not exists seller_applications_reviewed_by_idx on public.seller_applications(reviewed_by);
create index if not exists seller_applications_user_id_idx on public.seller_applications(user_id);
create index if not exists seller_order_status_seller_id_idx on public.seller_order_status(seller_id);
create index if not exists wishlists_product_id_idx on public.wishlists(product_id);

commit;
