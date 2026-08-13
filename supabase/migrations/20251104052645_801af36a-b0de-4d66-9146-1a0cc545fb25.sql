-- Add sector column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sector text;

-- Add an index for better performance on sector filtering
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);