-- Atomically finalize a Razorpay payment and its order status.
-- The order row is locked before either payment/order state is changed,
-- preventing the expiry job from racing with successful payment confirmation.

create or replace function public.finalize_razorpay_payment(
  p_order_id uuid,
  p_razorpay_payment_id text,
  p_razorpay_signature text default null,
  p_amount numeric default null
)
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

  select * into v_payment
  from public.payments
  where order_id = p_order_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'Payment record not found';
  end if;

  if v_payment.status = 'paid' then
    return jsonb_build_object('verified', true, 'orderId', v_order.id, 'orderStatus', v_order.status, 'alreadyPaid', true);
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Order is no longer pending';
  end if;

  if p_amount is null or round(p_amount, 2) <> round(v_order.total, 2) then
    raise exception 'Payment amount mismatch';
  end if;

  update public.payments
  set razorpay_payment_id = p_razorpay_payment_id,
      razorpay_signature = p_razorpay_signature,
      status = 'paid',
      paid_at = v_now,
      updated_at = v_now
  where id = v_payment.id;

  update public.orders
  set status = 'confirmed', updated_at = v_now
  where id = v_order.id and status = 'pending';

  return jsonb_build_object('verified', true, 'orderId', v_order.id, 'orderStatus', 'confirmed', 'alreadyPaid', false);
end;
$$;

revoke all on function public.finalize_razorpay_payment(uuid,text,text,numeric) from public;
revoke all on function public.finalize_razorpay_payment(uuid,text,text,numeric) from anon;
grant execute on function public.finalize_razorpay_payment(uuid,text,text,numeric) to authenticated;
