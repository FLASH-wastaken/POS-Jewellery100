/*
  LABEL PRINTER CONFIGURATION SCHEMA
  
  Stores printer configurations for labels:
  - printer_config: Brand, model, port, driver info
  - printer_drivers: Uploaded driver files for each printer
*/

create table if not exists public.printer_config (
  id uuid primary key default uuid_generate_v4(),
  printer_name text not null,
  printer_brand text not null check (printer_brand in ('Zebra', 'HP', 'Epson', 'Brother', 'Dymo', 'Custom')),
  printer_model text,
  printer_port text,
  connection_type text not null default 'USB' check (connection_type in ('USB', 'Network', 'Serial', 'Bluetooth')),
  ip_address text,
  driver_path text,
  is_active boolean default true,
  test_status text check (test_status in ('connected', 'disconnected', 'error')),
  label_width_mm numeric(6, 2),
  label_height_mm numeric(6, 2),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.printer_drivers (
  id uuid primary key default uuid_generate_v4(),
  printer_id uuid references public.printer_config(id) on delete cascade,
  driver_name text not null,
  driver_url text not null,
  driver_version text,
  os_type text check (os_type in ('Windows', 'macOS', 'Linux')),
  uploaded_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.printer_config enable row level security;
alter table public.printer_drivers enable row level security;

-- RLS Policies
create policy "Authenticated users can view printer config"
  on public.printer_config for select
  to authenticated
  using (true);

create policy "Admins can manage printer config"
  on public.printer_config for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create indexes
create index if not exists idx_printer_config_brand on public.printer_config(printer_brand);
create index if not exists idx_printer_config_active on public.printer_config(is_active);
create index if not exists idx_printer_drivers_printer on public.printer_drivers(printer_id);
