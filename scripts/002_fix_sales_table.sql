-- Fix payment_status constraint to include "pending" for memos
-- The original constraint was too restrictive for memo transactions
ALTER TABLE public.sales DROP CONSTRAINT sales_payment_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_payment_status_check 
  CHECK (payment_status IN ('pending', 'completed', 'refunded', 'partial'));

-- Also fix payment_method constraint to allow "pending" for memos
ALTER TABLE public.sales DROP CONSTRAINT sales_payment_method_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_payment_method_check 
  CHECK (payment_method IN ('cash', 'card', 'upi', 'netbanking', 'cheque', 'bank_transfer', 'pending'));

-- Add memo-specific columns if not exists
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'invoice';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS memo_status text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS memo_due_date date;
