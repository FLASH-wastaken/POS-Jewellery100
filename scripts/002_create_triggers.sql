-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'cashier')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to create profile on auth user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to relevant tables
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_products_updated_at before update on public.products
  for each row execute function public.update_updated_at_column();

create trigger update_customers_updated_at before update on public.customers
  for each row execute function public.update_updated_at_column();

create trigger update_sales_updated_at before update on public.sales
  for each row execute function public.update_updated_at_column();

create trigger update_custom_orders_updated_at before update on public.custom_orders
  for each row execute function public.update_updated_at_column();

-- Function to log inventory changes
create or replace function public.log_inventory_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.stock_quantity <> new.stock_quantity then
    insert into public.inventory_logs (
      product_id,
      change_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      created_by
    ) values (
      new.id,
      case
        when new.stock_quantity > old.stock_quantity then 'added'
        when new.stock_quantity < old.stock_quantity then 'adjusted'
        else 'adjusted'
      end,
      new.stock_quantity - old.stock_quantity,
      old.stock_quantity,
      new.stock_quantity,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

-- Trigger for inventory logging
create trigger log_product_inventory_change
  after update on public.products
  for each row
  when (old.stock_quantity is distinct from new.stock_quantity)
  execute function public.log_inventory_change();
