-- Remove direct RPC exposure from trigger-only or superseded
-- SECURITY DEFINER functions. They remain available to their triggers
-- and are not part of the browser API.
revoke all on function public.create_secure_order(uuid,text,text) from public, anon, authenticated;
revoke all on function public.release_order_reservation(uuid) from public, anon, authenticated;
revoke all on function public.record_order_tracking_event() from public, anon, authenticated;
revoke all on function public.refresh_product_review_stats() from public, anon, authenticated;
revoke all on function public.sync_seller_order_status_to_order() from public, anon, authenticated;
