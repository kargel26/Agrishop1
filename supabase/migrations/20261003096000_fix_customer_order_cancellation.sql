create or replace function public.cancel_pending_order(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
 v_user_id uuid := (select auth.uid());
 v_order public.orders%rowtype;
 v_item record;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 select * into v_order from public.orders
 where id=p_order_id and user_id=v_user_id and status='pending'
 for update;
 if not found then raise exception 'Only pending orders can be cancelled'; end if;
 for v_item in select product_id, quantity from public.order_items where order_id=p_order_id and product_id is not null loop
   update public.products set stock=stock+v_item.quantity, updated_at=now() where id=v_item.product_id;
 end loop;
 update public.orders
 set status='cancelled',stock_reserved=false,coupon_reserved=false,updated_at=now()
 where id=p_order_id and status='pending';
 return jsonb_build_object('id',v_order.id,'order_number',v_order.order_number,'status','cancelled');
end;
$$;
revoke execute on function public.cancel_pending_order(uuid) from public;
revoke execute on function public.cancel_pending_order(uuid) from anon;
grant execute on function public.cancel_pending_order(uuid) to authenticated;