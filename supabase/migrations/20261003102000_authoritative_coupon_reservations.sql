-- Make coupon validation authoritative and reserve coupon usage atomically with order creation.
-- Also make customer cancellation honor stock/coupon reservation flags.

create or replace function public.create_order_secure(
  p_items jsonb,
  p_address_id uuid,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_item jsonb;
  v_product public.products%rowtype;
  v_address public.addresses%rowtype;
  v_order public.orders%rowtype;
  v_coupon public.coupons%rowtype;
  v_product_id uuid;
  v_qty integer;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_delivery numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_code text := upper(nullif(trim(coalesce(p_coupon_code,'')), ''));
  v_coupon_reserved boolean := false;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_address_id is null then raise exception 'Delivery address is required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;

  select * into v_address from public.addresses
  where id = p_address_id and user_id = v_user_id for share;
  if not found then raise exception 'Delivery address not found'; end if;

  if (select count(*) from jsonb_array_elements(p_items))
     <> (select count(distinct (x->>'product_id')::uuid) from jsonb_array_elements(p_items) x)
  then raise exception 'Duplicate products are not allowed'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_product_id := (v_item->>'product_id')::uuid;
      v_qty := (v_item->>'quantity')::integer;
    exception when others then raise exception 'Invalid cart item'; end;

    if v_qty is null or v_qty < 1 then raise exception 'Invalid product quantity'; end if;

    select * into v_product from public.products where id = v_product_id for update;
    if not found or v_product.is_active is not true then raise exception 'Product is no longer available'; end if;
    if v_product.stock < v_qty then raise exception 'Insufficient stock for %', v_product.name; end if;

    v_subtotal := v_subtotal + coalesce(v_product.price, 0) * v_qty;
  end loop;

  if v_code is not null then
    select * into v_coupon from public.coupons where code = v_code for update;

    if not found or v_coupon.is_active is not true then raise exception 'Invalid or inactive coupon code'; end if;
    if v_coupon.starts_at is not null and now() < v_coupon.starts_at then raise exception 'Coupon is not active yet'; end if;
    if v_coupon.expires_at is not null and now() > v_coupon.expires_at then raise exception 'Coupon has expired'; end if;
    if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then raise exception 'Coupon usage limit has been reached'; end if;
    if v_subtotal < coalesce(v_coupon.min_order, 0) then raise exception 'Minimum order value for coupon is %', v_coupon.min_order; end if;

    if v_coupon.discount_type = 'percent' then
      v_discount := v_subtotal * v_coupon.value / 100;
    elsif v_coupon.discount_type = 'flat' then
      v_discount := v_coupon.value;
    else
      raise exception 'Invalid coupon configuration';
    end if;

    if v_coupon.max_discount is not null then v_discount := least(v_discount, v_coupon.max_discount); end if;
    v_discount := greatest(least(v_discount, v_subtotal), 0);
    if v_discount <= 0 then raise exception 'Coupon does not provide a valid discount'; end if;

    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
    v_coupon_reserved := true;
  end if;

  if v_subtotal > 0 and v_subtotal < 999 then v_delivery := 60; end if;
  v_tax := round(greatest(v_subtotal - v_discount, 0) * 0.05);
  v_total := greatest(round(greatest(v_subtotal - v_discount, 0) + v_tax + v_delivery), 0);

  insert into public.orders(
    user_id,address_id,subtotal,discount,delivery_fee,tax,total,status,
    coupon_id,stock_reserved,coupon_reserved
  )
  values(
    v_user_id,p_address_id,v_subtotal,v_discount,v_delivery,v_tax,v_total,'pending',
    case when v_coupon_reserved then v_coupon.id else null end,true,v_coupon_reserved
  )
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = v_product_id for update;

    insert into public.order_items(
      order_id,product_id,seller_id,product_name,unit_price,quantity
    )
    values(
      v_order.id,v_product.id,v_product.seller_id,v_product.name,v_product.price,v_qty
    );

    update public.products set stock = stock - v_qty, updated_at = now()
    where id = v_product.id;
  end loop;

  return jsonb_build_object(
    'order', jsonb_build_object(
      'id',v_order.id,'order_number',v_order.order_number,'user_id',v_order.user_id,
      'address_id',v_order.address_id,'status',v_order.status,'subtotal',v_order.subtotal,
      'discount',v_order.discount,'delivery_fee',v_order.delivery_fee,'tax',v_order.tax,
      'total',v_order.total,'coupon_id',v_order.coupon_id,
      'created_at',v_order.created_at,'updated_at',v_order.updated_at
    ),
    'orderItems', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_id',oi.product_id,'seller_id',oi.seller_id,'product_name',oi.product_name,
        'unit_price',oi.unit_price,'quantity',oi.quantity,'line_total',oi.line_total
      )),'[]'::jsonb)
      from public.order_items oi where oi.order_id=v_order.id
    )
  );
end;
$function$;

create or replace function public.cancel_pending_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_item record;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_order from public.orders
  where id=p_order_id and user_id=v_user_id and status='pending' for update;
  if not found then raise exception 'Only pending orders can be cancelled'; end if;

  if v_order.stock_reserved then
    for v_item in select product_id, quantity from public.order_items
      where order_id=p_order_id and product_id is not null
    loop
      update public.products set stock=stock+v_item.quantity, updated_at=now()
      where id=v_item.product_id;
    end loop;
  end if;

  if v_order.coupon_reserved and v_order.coupon_id is not null then
    update public.coupons set used_count=greatest(used_count-1,0)
    where id=v_order.coupon_id;
  end if;

  update public.orders set status='cancelled',stock_reserved=false,coupon_reserved=false,updated_at=now()
  where id=p_order_id and status='pending';

  return jsonb_build_object('id',v_order.id,'order_number',v_order.order_number,'status','cancelled');
end;
$function$;

revoke execute on function public.create_order_secure(jsonb,uuid,text) from public, anon;
grant execute on function public.create_order_secure(jsonb,uuid,text) to authenticated;
revoke execute on function public.cancel_pending_order(uuid) from public, anon;
grant execute on function public.cancel_pending_order(uuid) to authenticated;
