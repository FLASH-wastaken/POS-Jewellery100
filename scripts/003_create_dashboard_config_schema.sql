/*
  DASHBOARD CUSTOMIZATION SCHEMA
  
  Stores user-specific dashboard configurations
  - dashboard_config: Stores which tiles are enabled/disabled and their order
  - dashboard_metrics: Stores custom metrics that can be displayed
  
  Developers: Each user can have their own dashboard layout
*/

-- Create dashboard_config table to store user dashboard preferences
create table if not exists public.dashboard_config (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  tile_order text[] default array['revenue', 'products', 'customers', 'growth'],
  enabled_tiles jsonb default '{
    "revenue": true,
    "products": true,
    "customers": true,
    "growth": true,
    "alerts": true,
    "salesTrend": true,
    "recentSales": true,
    "categoryBreakdown": true,
    "revenueCategory": true,
    "quickActions": true
  }'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.dashboard_config enable row level security;

-- RLS Policies
create policy "Users can view own dashboard config"
  on public.dashboard_config for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own dashboard config"
  on public.dashboard_config for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own dashboard config"
  on public.dashboard_config for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Create indexes
create index if not exists idx_dashboard_config_user on public.dashboard_config(user_id);
