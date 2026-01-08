-- Add additional columns to products table for more detailed jewelry information
alter table public.products
add column if not exists number_of_diamonds integer default 0,
add column if not exists total_diamond_carat numeric(10, 3),
add column if not exists diamond_type text check (diamond_type in ('natural', 'lab', 'none')),
add column if not exists metal_category text check (metal_category in ('gold', 'silver', 'platinum', 'mixed')),
add column if not exists metal_color text,
add column if not exists gold_karat text,
add column if not exists custom_text text,
add column if not exists barcode text unique,
add column if not exists item_notes text,
add column if not exists supplier_id uuid;

-- Create indexes for better search performance
create index if not exists idx_products_barcode on public.products(barcode) where barcode is not null;
create index if not exists idx_products_metal_category on public.products(metal_category);
create index if not exists idx_products_diamond_type on public.products(diamond_type);

-- Add comment for documentation
comment on column public.products.number_of_diamonds is 'Total number of diamonds in the jewelry piece';
comment on column public.products.total_diamond_carat is 'Total carat weight of all diamonds';
comment on column public.products.metal_category is 'Primary metal category: gold, silver, platinum, or mixed';
