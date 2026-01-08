-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'cashier' check (role in ('admin', 'manager', 'cashier')),
  phone text,
  is_active boolean default true,
  two_factor_enabled boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create products table
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  name text not null,
  description text,
  category text not null check (category in ('rings', 'necklaces', 'earrings', 'bracelets', 'pendants', 'bangles', 'chains', 'other')),
  metal_type text check (metal_type in ('gold', 'silver', 'platinum', 'diamond', 'other')),
  purity text,
  weight_grams numeric(10, 3),
  making_charges numeric(10, 2) default 0,
  stone_charges numeric(10, 2) default 0,
  price numeric(10, 2) not null,
  stock_quantity integer not null default 0,
  min_stock_level integer default 5,
  image_url text,
  hallmark_number text,
  certificate_url text,
  is_custom_order boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create customers table
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  customer_code text unique not null,
  full_name text not null,
  email text,
  phone text not null,
  address text,
  city text,
  state text,
  pincode text,
  date_of_birth date,
  anniversary_date date,
  loyalty_points integer default 0,
  total_purchases numeric(12, 2) default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create sales table
create table if not exists public.sales (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique not null,
  customer_id uuid references public.customers(id),
  sale_date timestamp with time zone default now(),
  subtotal numeric(12, 2) not null,
  discount_amount numeric(10, 2) default 0,
  discount_percentage numeric(5, 2) default 0,
  tax_amount numeric(10, 2) not null,
  total_amount numeric(12, 2) not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'upi', 'netbanking', 'other')),
  payment_status text not null default 'completed' check (payment_status in ('pending', 'completed', 'refunded', 'partial')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create sale_items table
create table if not exists public.sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  sku text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- Create inventory_logs table for tracking stock changes
create table if not exists public.inventory_logs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  change_type text not null check (change_type in ('added', 'sold', 'adjusted', 'returned')),
  quantity_change integer not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Create audit_logs table for security
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Create custom_orders table
create table if not exists public.custom_orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  customer_id uuid references public.customers(id),
  description text not null,
  design_image_url text,
  estimated_weight numeric(10, 3),
  estimated_price numeric(10, 2),
  advance_paid numeric(10, 2) default 0,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'ready', 'delivered', 'cancelled')),
  expected_delivery_date date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.custom_orders enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for products (all authenticated users can read, only admins/managers can modify)
create policy "Authenticated users can view products"
  on public.products for select
  to authenticated
  using (true);

create policy "Admins and managers can insert products"
  on public.products for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "Admins and managers can update products"
  on public.products for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for customers
create policy "Authenticated users can view customers"
  on public.customers for select
  to authenticated
  using (true);

create policy "Authenticated users can insert customers"
  on public.customers for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update customers"
  on public.customers for update
  to authenticated
  using (true);

-- RLS Policies for sales
create policy "Authenticated users can view sales"
  on public.sales for select
  to authenticated
  using (true);

create policy "Authenticated users can insert sales"
  on public.sales for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Admins and managers can update sales"
  on public.sales for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- RLS Policies for sale_items
create policy "Authenticated users can view sale items"
  on public.sale_items for select
  to authenticated
  using (true);

create policy "Authenticated users can insert sale items"
  on public.sale_items for insert
  to authenticated
  with check (true);

-- RLS Policies for inventory_logs
create policy "Authenticated users can view inventory logs"
  on public.inventory_logs for select
  to authenticated
  using (true);

create policy "Authenticated users can insert inventory logs"
  on public.inventory_logs for insert
  to authenticated
  with check (auth.uid() = created_by);

-- RLS Policies for audit_logs
create policy "Admins can view audit logs"
  on public.audit_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "System can insert audit logs"
  on public.audit_logs for insert
  to authenticated
  with check (true);

-- RLS Policies for custom_orders
create policy "Authenticated users can view custom orders"
  on public.custom_orders for select
  to authenticated
  using (true);

create policy "Authenticated users can insert custom orders"
  on public.custom_orders for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update custom orders"
  on public.custom_orders for update
  to authenticated
  using (true);

-- Create indexes for better performance
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_code on public.customers(customer_code);
create index if not exists idx_sales_invoice on public.sales(invoice_number);
create index if not exists idx_sales_customer on public.sales(customer_id);
create index if not exists idx_sales_date on public.sales(sale_date);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_inventory_logs_product on public.inventory_logs(product_id);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at);
