create or replace function public.admin_update_order_status(p_order_id uuid,p_status public.order_status)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_order public.orders%rowtype;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if v_order.status=p_status then return jsonb_build_object('order_id',v_order.id,'status',v_order.status,'changed',false); end if;
 if p_status='cancelled' then
   if v_order.status<>'pending' then raise exception 'ONLY_PENDING_ORDERS_CAN_BE_CANCELLED'; end if;
   if v_order.stock_reserved then
     update public.products p set stock=p.stock+oi.quantity,updated_at=now()
     from public.order_items oi where oi.order_id=v_order.id and oi.product_id=p.id;
   end if;
   update public.orders set stock_reserved=false,coupon_reserved=false,status='cancelled',updated_at=now() where id=v_order.id;
 else
   update public.orders set status=p_status,updated_at=now() where id=v_order.id;
 end if;
 return jsonb_build_object('order_id',v_order.id,'status',p_status,'changed',true);
end; $$;
revoke all on function public.admin_update_order_status(uuid,public.order_status) from public,anon,authenticated;
grant execute on function public.admin_update_order_status(uuid,public.order_status) to authenticated;