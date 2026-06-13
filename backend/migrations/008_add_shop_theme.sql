-- Add theme customization storage to shops (used by the Shop Builder & public storefront)
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{"template":"Minimal","primaryColor":"#1E3A5F","secondaryColor":"#2563EB","font":"Inter","layout":"grid-3"}'::jsonb;
