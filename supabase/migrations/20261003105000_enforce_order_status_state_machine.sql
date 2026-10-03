-- Enforce a single forward-only fulfillment state machine at the database boundary.
-- Payment confirmation, COD confirmation, and refunds remain dedicated RPC flows.

create or replace function public.sync_seller_order_status_to_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_order public.orders%rowtype;
begin
  if not exists (
    select 1 from public.order_items oi
    where oi.order_id = new.order_id
      and oi.seller_id = new.seller_id
  ) then
    raise exception 'SELLER_NOT_AUTHORIZED_FOR_ORDER';
  end if;

  select * into v_order
  from public.orders
  where id = new.order_id
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  if new.status = 'cancelled' then
    if v_order.status <> 'pending' then
      raise exception 'ONLY_PENDING_ORDERS_CAN_BE_CANCELLED';
    end if;

    if v_order.stock_reserved then
      update public.products p
      set stock = p.stock + oi.quantity, updated_at = now()
      from public.order_items oi
      where oi.order_id = v_order.id and oi.product_id = p.id;
    end if;

    if v_order.coupon_reserved and v_order.coupon_id is not null then
      update public.coupons
      set used_count = greatest(0, used_count - 1)
      where id = v_order.coupon_id;
    end if;

    update public.orders
    set stock_reserved = false, coupon_reserved = false,
        status = 'cancelled', updated_at = coalesce(new.updated_at, now())
    where id = v_order.id;
    return new;
  end if;

  if v_order.status = 'pending' then
    raise exception 'ORDER_MUST_BE_CONFIRMED_BEFORE_FULFILLMENT';
  elsif v_order.status = 'confirmed' and new.status <> 'processing' then
    raise exception 'INVALID_ORDER_TRANSITION';
  elsif v_order.status = 'processing' and new.status <> 'shipped' then
    raise exception 'INVALID_ORDER_TRANSITION';
  elsif v_order.status = 'shipped' and new.status <> 'delivered' then
    raise exception 'INVALID_ORDER_TRANSITION';
  elsif v_order.status in ('delivered','cancelled','refunded') then
    raise exception 'ORDER_STATUS_IS_TERMINAL';
  elsif new.status not in ('processing','shipped','delivered') then
    raise exception 'INVALID_ORDER_TRANSITION';
  end if;

  update public.orders
  set status = new.status, updated_at = coalesce(new.updated_at, now())
  where id = v_order.id;

  return new;
end;
$function$;

create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  if v_order.status = p_status then
    return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'changed', false);
  end if;

  if p_status = 'cancelled' then
    if v_order.status <> 'pending' then
      raise exception 'ONLY_PENDING_ORDERS_CAN_BE_CANCELLED';
    end if;

    if v_order.stock_reserved then
      update public.products p
      set stock = p.stock + oi.quantity, updated_at = now()
      from public.order_items oi
      where oi.order_id = v_order.id and oi.product_id = p.id;
    end if;

    if v_order.coupon_reserved and v_order.coupon_id is not null then
      update public.coupons
      set used_count = greatest(0, used_count - 1)
      where id = v_order.coupon_id;
    end if;

    update public.orders
    set stock_reserved = false, coupon_reserved = false,
        status = 'cancelled', updated_at = now()
    where id = v_order.id;
  elsif v_order.status = 'confirmed' and p_status = 'processing' then
    update public.orders set status='processing', updated_at=now() where id=v_order.id;
  elsif v_order.status = 'processing' and p_status = 'shipped' then
    update public.orders set status='shipped', updated_at=now() where id=v_order.id;
  elsif v_order.status = 'shipped' and p_status = 'delivered' then
    update public.orders set status='delivered', updated_at=now() where id=v_order.id;
  else
    raise exception 'INVALID_ORDER_TRANSITION';
  end if;

  return jsonb_build_object('order_id', v_order.id, 'status', p_status, 'changed', true);
end;
$function$;

revoke execute on function public.admin_update_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.admin_update_order_status(uuid, public.order_status) to authenticated;
revoke execute on function public.sync_seller_order_status_to_order() from public, anon, authenticated;

comment on function public.admin_update_order_status(uuid, public.order_status)
is 'Admin fulfillment state machine; payment confirmation and refunds use dedicated RPCs.';

comment on function public.sync_seller_order_status_to_order()
is 'Seller fulfillment state machine with seller ownership verification.';
