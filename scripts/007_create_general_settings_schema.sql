/*
  GENERAL SETTINGS SCHEMA
  
  Stores business general settings:
  - general_settings: Shop info, logo, security settings
*/

create table if not exists public.general_settings (
  id uuid primary key default uuid_generate_v4(),
  shop_logo_url text,
  app_url text,
  shop_name text not null,
  shop_phone text,
  shop_address text,
  stock_threshold_quantity integer default 0,
  force_security_pin boolean default false,
  allow_negative_quantity boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.general_settings enable row level security;

-- RLS Policies
create policy "Authenticated users can view general settings"
  on public.general_settings for select
  to authenticated
  using (true);

create policy "Admins can update general settings"
  on public.general_settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index if not exists idx_general_settings_shop on public.general_settings(shop_name);
