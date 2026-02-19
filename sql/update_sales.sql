-- Update sales table to include weight_kg and remove weight if it exists
ALTER TABLE sales RENAME COLUMN weight TO weight_kg;
-- If weight didn't exist, just add weight_kg
-- ALTER TABLE sales ADD COLUMN weight_kg DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Ensure weight_kg is NOT NULL
ALTER TABLE sales ALTER COLUMN weight_kg SET NOT NULL;
