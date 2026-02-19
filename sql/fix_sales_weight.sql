-- Robust fix for Sales table weight_kg column
DO $$ 
BEGIN
    -- 1. If 'weight' exists but 'weight_kg' does NOT, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'weight') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'weight_kg') THEN
        ALTER TABLE sales RENAME COLUMN weight TO weight_kg;
    
    -- 2. If both exist, move data from weight to weight_kg and drop weight
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'weight') 
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'weight_kg') THEN
        UPDATE sales SET weight_kg = weight WHERE weight_kg IS NULL OR weight_kg = 0;
        ALTER TABLE sales DROP COLUMN weight;
    END IF;
END $$;

-- 3. Ensure weight_kg exists (if neither existed before)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2) DEFAULT 0;

-- 4. Final constraints
UPDATE sales SET weight_kg = 0 WHERE weight_kg IS NULL;
ALTER TABLE sales ALTER COLUMN weight_kg SET NOT NULL;
ALTER TABLE sales ALTER COLUMN weight_kg SET DEFAULT 0;
