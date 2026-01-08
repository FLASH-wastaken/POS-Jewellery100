/*
  CRM SCHEMA FOR CAMPAIGNS, COMMUNICATIONS, AND REMINDERS
  
  This script creates tables for:
  - campaigns: Marketing campaigns targeting customers
  - communications: Track all customer communications (email, WhatsApp, SMS)
  - campaign_recipients: Track which customers were sent each campaign
  - memo_reminders: Automatic reminders for memo holders before due dates
  
  Developers: These tables work together to provide complete CRM functionality
*/

-- Create campaigns table for managing marketing campaigns
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  campaign_type text not null check (campaign_type in ('email', 'whatsapp', 'sms', 'multi')),
  subject text,
  message_template text not null,
  target_audience text check (target_audience in ('all', 'loyalty_members', 'recent_purchasers', 'inactive', 'custom')),
  scheduled_date timestamp with time zone,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'completed', 'paused')),
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create communications table to track all customer outreach
create table if not exists public.communications (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade,
  campaign_id uuid references public.campaigns(id),
  communication_type text not null check (communication_type in ('email', 'whatsapp', 'sms', 'manual')),
  subject text,
  message text not null,
  recipient_address text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_date timestamp with time zone,
  response_status text check (response_status in ('opened', 'clicked', 'replied', 'no_response')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create campaign_recipients table to track delivery
create table if not exists public.campaign_recipients (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  sent boolean default false,
  sent_date timestamp with time zone,
  delivery_status text check (delivery_status in ('pending', 'sent', 'delivered', 'failed')),
  created_at timestamp with time zone default now()
);

-- Create memo_reminders table for automatic follow-ups
create table if not exists public.memo_reminders (
  id uuid primary key default uuid_generate_v4(),
  memo_id uuid references public.sales(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  reminder_days integer not null check (reminder_days in (1, 2, 3)),
  reminder_type text not null check (reminder_type in ('whatsapp', 'email', 'sms')),
  reminder_date timestamp with time zone,
  is_sent boolean default false,
  sent_date timestamp with time zone,
  status text default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.campaigns enable row level security;
alter table public.communications enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.memo_reminders enable row level security;

-- RLS Policies for campaigns
create policy "Authenticated users can view campaigns"
  on public.campaigns for select
  to authenticated
  using (true);

create policy "Admins and managers can create campaigns"
  on public.campaigns for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "Admins and managers can update campaigns"
  on public.campaigns for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- RLS Policies for communications
create policy "Authenticated users can view communications"
  on public.communications for select
  to authenticated
  using (true);

create policy "Authenticated users can insert communications"
  on public.communications for insert
  to authenticated
  with check (auth.uid() = created_by);

-- RLS Policies for campaign_recipients
create policy "Authenticated users can view campaign recipients"
  on public.campaign_recipients for select
  to authenticated
  using (true);

-- RLS Policies for memo_reminders
create policy "Authenticated users can view memo reminders"
  on public.memo_reminders for select
  to authenticated
  using (true);

-- Create indexes for performance
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_created on public.campaigns(created_at);
create index if not exists idx_communications_customer on public.communications(customer_id);
create index if not exists idx_communications_campaign on public.communications(campaign_id);
create index if not exists idx_communications_type on public.communications(communication_type);
create index if not exists idx_campaign_recipients_campaign on public.campaign_recipients(campaign_id);
create index if not exists idx_memo_reminders_memo on public.memo_reminders(memo_id);
create index if not exists idx_memo_reminders_sent on public.memo_reminders(is_sent);
