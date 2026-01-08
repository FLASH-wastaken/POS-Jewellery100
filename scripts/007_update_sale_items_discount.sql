-- Add discount_percentage column to sale_items table
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;

-- Update payment_method to allow more types
ALTER TABLE sales
DROP CONSTRAINT IF EXISTS sales_payment_method_check;

ALTER TABLE sales
ADD CONSTRAINT sales_payment_method_check 
CHECK (payment_method IN ('cash', 'cheque', 'card', 'bank_transfer', 'pending', 'multiple'));
