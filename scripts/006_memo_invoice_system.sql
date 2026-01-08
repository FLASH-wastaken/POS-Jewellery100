-- Add memo and invoice tracking tables

-- Extend sales table to support memos
ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'invoice';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS memo_status TEXT DEFAULT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS memo_due_date DATE DEFAULT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS converted_from_memo_id UUID DEFAULT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS parent_sale_id UUID DEFAULT NULL;

-- Add check constraint for document type
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_document_type_check;
ALTER TABLE sales ADD CONSTRAINT sales_document_type_check 
  CHECK (document_type IN ('invoice', 'memo', 'return', 'exchange'));

-- Add check constraint for memo status
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_memo_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_memo_status_check 
  CHECK (memo_status IN ('pending', 'confirmed', 'partially_returned', 'fully_returned', 'expired', NULL));

-- Create transaction history table for tracking all movements
CREATE TABLE IF NOT EXISTS transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'memo_created', 'memo_to_invoice', 'return', 'exchange'
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  related_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  quantity INTEGER,
  amount NUMERIC(10, 2),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Store additional details like item condition, reason for return, etc.
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_document_type ON sales(document_type);
CREATE INDEX IF NOT EXISTS idx_sales_memo_status ON sales(memo_status);
CREATE INDEX IF NOT EXISTS idx_sales_converted_from ON sales(converted_from_memo_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_sale ON transaction_history(sale_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_product ON transaction_history(product_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_customer ON transaction_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_type ON transaction_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_history_created ON transaction_history(created_at);

-- Enable RLS on transaction_history
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_history
CREATE POLICY "Authenticated users can view transaction history"
  ON transaction_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transaction history"
  ON transaction_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to auto-log transaction history
CREATE OR REPLACE FUNCTION log_sale_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log memo creation
  IF NEW.document_type = 'memo' AND TG_OP = 'INSERT' THEN
    INSERT INTO transaction_history (
      transaction_type, sale_id, customer_id, amount, notes, created_by
    ) VALUES (
      'memo_created', NEW.id, NEW.customer_id, NEW.total_amount, 
      'Memo created: ' || NEW.invoice_number, NEW.created_by
    );
  END IF;

  -- Log memo to invoice conversion
  IF NEW.document_type = 'invoice' AND NEW.converted_from_memo_id IS NOT NULL AND TG_OP = 'UPDATE' THEN
    INSERT INTO transaction_history (
      transaction_type, sale_id, related_sale_id, customer_id, amount, notes, created_by
    ) VALUES (
      'memo_to_invoice', NEW.id, NEW.converted_from_memo_id, NEW.customer_id, 
      NEW.total_amount, 'Memo converted to invoice', NEW.created_by
    );
  END IF;

  -- Log returns
  IF NEW.document_type = 'return' AND TG_OP = 'INSERT' THEN
    INSERT INTO transaction_history (
      transaction_type, sale_id, related_sale_id, customer_id, amount, notes, created_by
    ) VALUES (
      'return', NEW.id, NEW.parent_sale_id, NEW.customer_id, NEW.total_amount,
      'Items returned', NEW.created_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-logging
DROP TRIGGER IF EXISTS trigger_log_sale_transaction ON sales;
CREATE TRIGGER trigger_log_sale_transaction
  AFTER INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION log_sale_transaction();

-- Create view for memo tracking dashboard
CREATE OR REPLACE VIEW memo_tracking AS
SELECT 
  s.id,
  s.invoice_number,
  s.customer_id,
  c.full_name as customer_name,
  c.phone as customer_phone,
  s.document_type,
  s.memo_status,
  s.sale_date,
  s.memo_due_date,
  s.total_amount,
  s.created_by,
  p.full_name as created_by_name,
  CASE 
    WHEN s.memo_due_date < CURRENT_DATE THEN 'Overdue'
    WHEN s.memo_due_date - CURRENT_DATE <= 3 THEN 'Due Soon'
    ELSE 'Active'
  END as urgency_status,
  (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN profiles p ON s.created_by = p.id
WHERE s.document_type = 'memo' AND s.memo_status != 'confirmed';

COMMENT ON TABLE transaction_history IS 'Complete audit trail of all sales transactions, memos, returns, and exchanges';
COMMENT ON VIEW memo_tracking IS 'Dashboard view for tracking pending memos and their due dates';
