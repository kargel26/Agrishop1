create or replace function public.sync_seller_order_status_to_order()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_order public.orders%rowtype;
begin
 select * into v_order from public.orders where id=new.order_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if new.status='cancelled' then
   if v_order.status<>'pending' then raise exception 'ONLY_PENDING_ORDERS_CAN_BE_CANCELLED'; end if;
   if v_order.stock_reserved then
     update public.products p set stock=p.stock+oi.quantity,updated_at=now()
     from public.order_items oi where oi.order_id=v_order.id and oi.product_id=p.id;
   end if;
   if v_order.coupon_reserved and v_order.coupon_id is not null then
     update public.coupons set used_count=greatest(0,used_count-1) where id=v_order.coupon_id;
   end if;
   update public.orders set stock_reserved=false,coupon_reserved=false,status='cancelled',updated_at=coalesce(new.updated_at,now()) where id=v_order.id;
 else
   update public.orders set status=new.status,updated_at=coalesce(new.updated_at,now()) where id=v_order.id;
 end if;
 return new;
end; $$;
revoke all on function public.sync_seller_order_status_to_order() from public,anon,authenticated;
grant execute on function public.sync_seller_order_status_to_order() to service_role;