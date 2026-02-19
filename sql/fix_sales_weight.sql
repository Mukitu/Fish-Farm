-- Fix for Sales table weight_kg column
-- 1. Rename column if it exists as 'weight'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'weight') THEN
        ALTER TABLE sales RENAME COLUMN weight TO weight_kg;
    END IF;
END $$;

-- 2. Add column if it doesn't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);

-- 3. Set NOT NULL constraint and default value
UPDATE sales SET weight_kg = 0 WHERE weight_kg IS NULL;
ALTER TABLE sales ALTER COLUMN weight_kg SET NOT NULL;
ALTER TABLE sales ALTER COLUMN weight_kg SET DEFAULT 0;
