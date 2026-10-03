-- Make COD confirmation atomic with order/payment locking and align stale-order expiry
-- with the reservation flags used by secure order creation.

create or replace function public.confirm_cod_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Order is no longer available for COD';
  end if;

  select * into v_payment
  from public.payments
  where order_id = v_order.id and user_id = v_uid
  for update;

  if found and v_payment.status = 'paid' then
    raise exception 'Order is already paid';
  end if;

  insert into public.payments(
    order_id,user_id,provider,razorpay_order_id,razorpay_payment_id,
    razorpay_signature,amount,status,method,paid_at,updated_at
  )
  values(
    v_order.id,v_uid,'cod',null,null,null,v_order.total,'pending','cod',null,v_now
  )
  on conflict (order_id) do update
  set user_id = excluded.user_id,
      provider = 'cod',
      razorpay_order_id = null,
      razorpay_payment_id = null,
      razorpay_signature = null,
      amount = excluded.amount,
      status = 'pending',
      method = 'cod',
      paid_at = null,
      updated_at = v_now;

  update public.orders
  set status = 'confirmed', updated_at = v_now
  where id = v_order.id and status = 'pending';

  return jsonb_build_object(
    'confirmed', true,
    'orderId', v_order.id,
    'orderNumber', v_order.order_number,
    'paymentStatus', 'pending',
    'paymentMethod', 'cod'
  );
end;
$$;

revoke all on function public.confirm_cod_order(uuid) from public;
revoke all on function public.confirm_cod_order(uuid) from anon;
grant execute on function public.confirm_cod_order(uuid) to authenticated;

create or replace function private.expire_stale_pending_orders(p_age_minutes integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_count integer := 0;
  v_item record;
  v_order public.orders%rowtype;
begin
  if p_age_minutes < 5 or p_age_minutes > 1440 then
    raise exception 'p_age_minutes must be between 5 and 1440';
  end if;

  loop
    select o.* into v_order
    from public.orders o
    where o.status = 'pending'
      and o.created_at < now() - make_interval(mins => p_age_minutes)
      and not exists (
        select 1 from public.payments p
        where p.order_id = o.id and p.status = 'paid'
      )
    order by o.created_at
    for update skip locked
    limit 1;

    exit when not found;

    if v_order.stock_reserved then
      for v_item in
        select oi.product_id, oi.quantity
        from public.order_items oi
        where oi.order_id = v_order.id
          and oi.product_id is not null
      loop
        update public.products
        set stock = coalesce(stock, 0) + v_item.quantity,
            updated_at = now()
        where id = v_item.product_id;
      end loop;
    end if;

    if v_order.coupon_reserved and v_order.coupon_id is not null then
      update public.coupons
      set used_count = greatest(0, used_count - 1)
      where id = v_order.coupon_id;
    end if;

    update public.orders
    set status = 'cancelled',
        stock_reserved = false,
        coupon_reserved = false,
        updated_at = now()
    where id = v_order.id
      and status = 'pending';

    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function private.expire_stale_pending_orders(integer) from public;
revoke all on function private.expire_stale_pending_orders(integer) from anon;
revoke all on function private.expire_stale_pending_orders(integer) from authenticated;
grant execute on function private.expire_stale_pending_orders(integer) to postgres;
