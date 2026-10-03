-- Atomically process a trusted Razorpay webhook payment.
-- Service-role only: the webhook has already passed Razorpay HMAC verification.

create or replace function public.finalize_razorpay_webhook_payment(
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_method text,
  p_amount numeric,
  p_payment_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_now timestamptz := now();
begin
  if p_payment_status not in ('paid','failed') then
    raise exception 'Unsupported payment status';
  end if;

  select * into v_payment
  from public.payments
  where razorpay_order_id = p_razorpay_order_id
  for update;

  if not found then
    return jsonb_build_object('processed', false, 'reason', 'payment_not_found');
  end if;

  select * into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  if not found then
    raise exception 'Order not found for payment';
  end if;

  if p_payment_status = 'paid' then
    if p_amount is null or round(p_amount, 2) <> round(v_order.total, 2)
       or round(v_payment.amount, 2) <> round(v_order.total, 2) then
      raise exception 'Webhook payment amount mismatch';
    end if;

    update public.payments
    set status = 'paid',
        razorpay_payment_id = p_razorpay_payment_id,
        method = p_method,
        paid_at = coalesce(paid_at, v_now),
        updated_at = v_now
    where id = v_payment.id;

    if v_order.status = 'pending' then
      update public.orders
      set status = 'confirmed', updated_at = v_now
      where id = v_order.id and status = 'pending';
      v_order.status := 'confirmed';
    end if;
  else
    update public.payments
    set status = 'failed',
        razorpay_payment_id = coalesce(p_razorpay_payment_id, razorpay_payment_id),
        method = coalesce(p_method, method),
        updated_at = v_now
    where id = v_payment.id
      and status <> 'paid';
  end if;

  return jsonb_build_object('processed', true, 'orderId', v_order.id, 'orderStatus', v_order.status, 'paymentStatus', p_payment_status);
end;
$$;

revoke all on function public.finalize_razorpay_webhook_payment(text,text,text,numeric,text) from public;
revoke all on function public.finalize_razorpay_webhook_payment(text,text,text,numeric,text) from anon;
revoke all on function public.finalize_razorpay_webhook_payment(text,text,text,numeric,text) from authenticated;
grant execute on function public.finalize_razorpay_webhook_payment(text,text,text,numeric,text) to service_role;
