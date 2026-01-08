-- Add notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- sale_receipt, low_stock_alert, payment_reminder, etc
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  reference_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Add index for querying
CREATE INDEX IF NOT EXISTS idx_notification_logs_phone ON notification_logs(phone);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin can view all notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "System can insert notification logs"
  ON notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE notification_logs IS 'Stores all SMS/WhatsApp notifications sent';
