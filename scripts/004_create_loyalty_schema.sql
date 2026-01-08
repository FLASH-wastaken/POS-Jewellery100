/*
  LOYALTY POINTS SCHEMA
  
  Extends customers table to support:
  - loyalty_points: Current points balance
  - loyalty_expiry: When points expire
  - loyalty_history: Track all points transactions
  - point_transfers: Transfer points between customers (e.g., inheritance)
*/

-- Create loyalty_history table
create table if not exists public.loyalty_history (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade,
  points_change integer not null,
  reason text not null check (reason in ('purchase', 'refund', 'bonus', 'expiry', 'transfer_sent', 'transfer_received', 'manual_adjustment')),
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Create point_transfers table for legacy/inheritance transfers
create table if not exists public.point_transfers (
  id uuid primary key default uuid_generate_v4(),
  from_customer_id uuid references public.customers(id) on delete cascade,
  to_customer_id uuid references public.customers(id) on delete cascade,
  points_transferred integer not null,
  reason text,
  approval_status text default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Create loyalty_tiers table for tiered loyalty programs
create table if not exists public.loyalty_tiers (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade,
  tier_name text not null check (tier_name in ('bronze', 'silver', 'gold', 'platinum')),
  tier_start_date timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.loyalty_history enable row level security;
alter table public.point_transfers enable row level security;
alter table public.loyalty_tiers enable row level security;

-- RLS Policies
create policy "Authenticated users can view loyalty history"
  on public.loyalty_history for select
  to authenticated
  using (true);

create policy "System can insert loyalty history"
  on public.loyalty_history for insert
  to authenticated
  with check (true);

create policy "Authenticated users can view point transfers"
  on public.point_transfers for select
  to authenticated
  using (true);

create policy "Admins and managers can approve transfers"
  on public.point_transfers for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Create indexes
create index if not exists idx_loyalty_history_customer on public.loyalty_history(customer_id);
create index if not exists idx_loyalty_history_created on public.loyalty_history(created_at);
create index if not exists idx_point_transfers_from on public.point_transfers(from_customer_id);
create index if not exists idx_point_transfers_to on public.point_transfers(to_customer_id);
create index if not exists idx_loyalty_tiers_customer on public.loyalty_tiers(customer_id);
