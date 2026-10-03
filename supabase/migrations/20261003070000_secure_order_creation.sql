create or replace function public.create_order_secure(p_items jsonb,p_address_id uuid,p_coupon_code text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
 v_user_id uuid := (select auth.uid()); v_item jsonb; v_product public.products%rowtype; v_address public.addresses%rowtype; v_order public.orders%rowtype;
 v_product_id uuid; v_qty integer; v_subtotal numeric:=0; v_discount numeric:=0; v_delivery numeric:=0; v_tax numeric:=0; v_total numeric:=0;
 v_code text:=upper(nullif(trim(coalesce(p_coupon_code,'')),''));
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 if p_address_id is null then raise exception 'Delivery address is required'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
 select * into v_address from public.addresses where id=p_address_id and user_id=v_user_id for share;
 if not found then raise exception 'Delivery address not found'; end if;
 if (select count(*) from jsonb_array_elements(p_items))<>(select count(distinct (x->>'product_id')::uuid) from jsonb_array_elements(p_items) x) then raise exception 'Duplicate products are not allowed'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  begin v_product_id:=(v_item->>'product_id')::uuid; v_qty:=(v_item->>'quantity')::integer; exception when others then raise exception 'Invalid cart item'; end;
  if v_qty is null or v_qty<1 then raise exception 'Invalid product quantity'; end if;
  select * into v_product from public.products where id=v_product_id for update;
  if not found or v_product.is_active is not true then raise exception 'Product is no longer available'; end if;
  if v_product.stock<v_qty then raise exception 'Insufficient stock for %',v_product.name; end if;
  v_subtotal:=v_subtotal+coalesce(v_product.price,0)*v_qty;
 end loop;
 if v_code='AGRI10' and v_subtotal>=500 then v_discount:=least(v_subtotal*0.10,200); elsif v_code='FARM50' and v_subtotal>=300 then v_discount:=50; end if;
 if v_subtotal>0 and v_subtotal<999 then v_delivery:=60; end if;
 v_tax:=round(greatest(v_subtotal-v_discount,0)*0.05); v_total:=greatest(round(greatest(v_subtotal-v_discount,0)+v_tax+v_delivery),0);
 insert into public.orders(user_id,address_id,subtotal,discount,delivery_fee,tax,total,status) values(v_user_id,p_address_id,v_subtotal,v_discount,v_delivery,v_tax,v_total,'pending') returning * into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_product_id:=(v_item->>'product_id')::uuid; v_qty:=(v_item->>'quantity')::integer;
  select * into v_product from public.products where id=v_product_id for update;
  insert into public.order_items(order_id,product_id,seller_id,product_name,unit_price,quantity,line_total) values(v_order.id,v_product.id,v_product.seller_id,v_product.name,v_product.price,v_qty,coalesce(v_product.price,0)*v_qty);
  update public.products set stock=stock-v_qty where id=v_product.id;
 end loop;
 return jsonb_build_object('order',jsonb_build_object('id',v_order.id,'order_number',v_order.order_number,'user_id',v_order.user_id,'address_id',v_order.address_id,'status',v_order.status,'subtotal',v_order.subtotal,'discount',v_order.discount,'delivery_fee',v_order.delivery_fee,'tax',v_order.tax,'total',v_order.total,'created_at',v_order.created_at,'updated_at',v_order.updated_at),'orderItems',(select coalesce(jsonb_agg(jsonb_build_object('product_id',oi.product_id,'seller_id',oi.seller_id,'product_name',oi.product_name,'unit_price',oi.unit_price,'quantity',oi.quantity,'line_total',oi.line_total)),'[]'::jsonb) from public.order_items oi where oi.order_id=v_order.id));
end;
$$;
revoke execute on function public.create_order_secure(jsonb,uuid,text) from public;
revoke execute on function public.create_order_secure(jsonb,uuid,text) from anon;
grant execute on function public.create_order_secure(jsonb,uuid,text) to authenticated;