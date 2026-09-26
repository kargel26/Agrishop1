-- AgriShop Razorpay payment storage
-- Run this in the ACTIVE AgriShop Supabase project's SQL editor.
-- This script is additive: existing columns are preserved.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(12,2) not null,
  status text not null default 'created',
  method text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments add column if not exists user_id uuid;
alter table public.payments add column if not exists provider text default 'razorpay';
alter table public.payments add column if not exists razorpay_order_id text;
alter table public.payments add column if not exists razorpay_payment_id text;
alter table public.payments add column if not exists razorpay_signature text;
alter table public.payments add column if not exists amount numeric(12,2);
alter table public.payments add column if not exists status text default 'created';
alter table public.payments add column if not exists method text;
alter table public.payments add column if not exists paid_at timestamptz;
alter table public.payments add column if not exists created_at timestamptz default now();
alter table public.payments add column if not exists updated_at timestamptz default now();

create unique index if not exists payments_order_id_unique on public.payments(order_id);
create index if not exists payments_razorpay_order_id_idx on public.payments(razorpay_order_id);
create index if not exists payments_user_id_idx on public.payments(user_id);

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "payments_update_own" on public.payments;
create policy "payments_update_own" on public.payments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
