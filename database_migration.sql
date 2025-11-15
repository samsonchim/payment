-- Add collection columns to transactions table
-- Run this in your Supabase SQL editor

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS isCollected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS collectedBy text,
ADD COLUMN IF NOT EXISTS collectedAt timestamp with time zone;

-- Create an index for better performance on collection queries
CREATE INDEX IF NOT EXISTS idx_transactions_collection ON transactions(isCollected);

-- Optional: Update existing records to have isCollected = false if NULL
UPDATE transactions 
SET isCollected = false 
WHERE isCollected IS NULL;

-- Create manual_records table for admin-inserted records
CREATE TABLE IF NOT EXISTS manual_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  reg_number text NOT NULL,
  product text NOT NULL,
  price numeric NOT NULL,
  time timestamp with time zone DEFAULT now(),
  is_collected boolean DEFAULT false,
  collected_by text,
  collected_at timestamp with time zone
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manual_records_reg_number ON manual_records(reg_number);
CREATE INDEX IF NOT EXISTS idx_manual_records_collection ON manual_records(is_collected);
CREATE INDEX IF NOT EXISTS idx_manual_records_time ON manual_records(time);

-- Create balance_payments table for balance payments
CREATE TABLE IF NOT EXISTS balance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_reg_number text NOT NULL,
  item_name text NOT NULL,
  amount numeric NOT NULL,
  receipt_text text,
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Add optional receipt column to records table so general payments can store receipts
ALTER TABLE records
ADD COLUMN IF NOT EXISTS receipt_text text;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_balance_payments_reg_number ON balance_payments(student_reg_number);
CREATE INDEX IF NOT EXISTS idx_balance_payments_verified ON balance_payments(verified);

-- Verify the new table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'balance_payments' 
ORDER BY ordinal_position;
