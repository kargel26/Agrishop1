-- Prevent direct admin mutation of payment status.
-- Manual refunds are allowed only through an authenticated, admin-only RPC.

create or replace function public.admin_update_payment_status(
  p_payment_id uuid,
  p_status public.payment_status
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_uid uuid := (select auth.uid());
  v_now timestamptz := now();
begin
  if v_uid is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_status <> 'refunded' then
    raise exception 'Only paid payments can be manually refunded';
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;

  select * into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  if v_payment.status = 'refunded' then
    return jsonb_build_object(
      'payment_id',v_payment.id,'payment_status','refunded',
      'order_id',v_order.id,'order_status',v_order.status,'changed',false
    );
  end if;

  if v_payment.status <> 'paid' then
    raise exception 'Only paid payments can be refunded';
  end if;

  update public.payments
  set status='refunded',updated_at=v_now
  where id=v_payment.id and status='paid';

  update public.orders
  set status='refunded',updated_at=v_now
  where id=v_order.id and status <> 'refunded';

  return jsonb_build_object(
    'payment_id',v_payment.id,'payment_status','refunded',
    'order_id',v_order.id,'order_status','refunded','changed',true
  );
end;
$function$;

revoke all on function public.admin_update_payment_status(uuid,public.payment_status) from public,anon;
grant execute on function public.admin_update_payment_status(uuid,public.payment_status) to authenticated;

drop policy if exists payments_admin_update on public.payments;
