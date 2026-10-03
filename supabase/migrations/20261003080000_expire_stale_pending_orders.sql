-- Expire abandoned pending orders and release their reserved stock.
-- A pending order is eligible after 30 minutes, unless its payment is already paid.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

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
begin
  if p_age_minutes < 5 or p_age_minutes > 1440 then
    raise exception 'p_age_minutes must be between 5 and 1440';
  end if;

  loop
    select o.id
      into v_order_id
    from public.orders o
    where o.status = 'pending'
      and o.created_at < now() - make_interval(mins => p_age_minutes)
      and not exists (
        select 1
        from public.payments p
        where p.order_id = o.id
          and p.status = 'paid'
      )
    order by o.created_at
    for update skip locked
    limit 1;

    exit when not found;

    for v_item in
      select oi.product_id, oi.quantity
      from public.order_items oi
      where oi.order_id = v_order_id
    loop
      update public.products
      set stock = coalesce(stock, 0) + v_item.quantity,
          updated_at = now()
      where id = v_item.product_id;
    end loop;

    update public.orders
    set status = 'cancelled',
        updated_at = now()
    where id = v_order_id
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

create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname = 'agrishop-expire-stale-orders';

select cron.schedule(
  'agrishop-expire-stale-orders',
  '*/5 * * * *',
  $$select private.expire_stale_pending_orders(30);$$
);
