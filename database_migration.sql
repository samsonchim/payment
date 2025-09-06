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

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
