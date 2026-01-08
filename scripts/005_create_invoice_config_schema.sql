/*
  INVOICE CUSTOMIZATION SCHEMA
  
  Stores business branding and invoice customization:
  - invoice_config: Company logo, signature, fonts, header/footer
  - invoice_templates: Custom invoice templates per business
*/

create table if not exists public.invoice_config (
  id uuid primary key default uuid_generate_v4(),
  company_name text,
  company_logo_url text,
  company_signature_url text,
  company_phone text,
  company_email text,
  company_address text,
  invoice_font text default 'Arial' check (invoice_font in ('Arial', 'Times New Roman', 'Courier', 'Calibri', 'Georgia')),
  header_text text,
  footer_text text,
  show_qr_code boolean default true,
  thank_you_message text default 'Thank you for your business!',
  terms_conditions text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(company_name)
);

-- Enable RLS
alter table public.invoice_config enable row level security;

-- RLS Policies
create policy "Authenticated users can view invoice config"
  on public.invoice_config for select
  to authenticated
  using (true);

create policy "Admins can update invoice config"
  on public.invoice_config for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index if not exists idx_invoice_config_company on public.invoice_config(company_name);
