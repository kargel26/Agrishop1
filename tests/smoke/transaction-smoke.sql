-- Agrishop transaction smoke-test checklist
-- SAFE BY DESIGN: this file is a test plan/query set. Do NOT execute mutation blocks
-- against production without an isolated test user/product and a transaction rollback.

-- 1) Baseline inventory/coupon/payment state
select id, name, price, stock from public.products where is_active = true order by id;
select code, discount_type, value, min_order, max_discount, usage_limit, used_count
from public.coupons where is_active = true order by code;
select count(*) as pending_orders from public.orders where status = 'pending';

-- 2) Invalid coupon (requires authenticated test user + owned address + cart)
-- Expected: create_secure_order raises 'Invalid coupon code' and creates no order.
-- select public.create_secure_order('<TEST_ADDRESS_UUID>', 'INVALID-SMOKE-COUPON', '<UUID>');

-- 3) Insufficient stock (requires isolated test product/cart)
-- Expected: create_secure_order raises 'Insufficient stock...' and product stock is unchanged.
-- select public.create_secure_order('<TEST_ADDRESS_UUID>', null, '<UUID>');

-- 4) COD path
-- Expected: secure order is pending; /api/orders/cod creates exactly one COD payment and
-- confirms the order. Repeating the request must not create a second payment.

-- 5) Razorpay Test Mode path
-- Expected: /api/razorpay/create-order uses orders.total as authoritative amount;
-- Razorpay test payment is captured; /api/razorpay/verify-payment marks payment paid and
-- order confirmed. Repeating verification is idempotent.

-- 6) Post-test invariants
select o.id, o.status, o.total, o.stock_reserved, o.coupon_reserved,
       p.status as payment_status, p.method, p.amount
from public.orders o
left join public.payments p on p.order_id = o.id
where o.created_at > now() - interval '1 hour'
order by o.created_at desc;
