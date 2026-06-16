-- Platform-wide settings: a single editable row controlling site branding, content & feature flags.
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT platform_settings_singleton CHECK (id = 1)
);

-- Seed the single row with sensible defaults.
INSERT INTO platform_settings (id, data) VALUES (1, '{
  "branding": {
    "siteName": "BoutiqueKi",
    "logoUrl": "",
    "faviconUrl": "",
    "primaryColor": "#2563EB",
    "secondaryColor": "#06B6D4",
    "font": "Inter"
  },
  "content": {
    "heroTitle": "Créez votre boutique en ligne",
    "heroSubtitle": "La plateforme tout-en-un pour lancer, gérer et faire évoluer votre commerce.",
    "announcement": { "text": "", "enabled": false, "level": "info" }
  },
  "flags": {
    "maintenance": false,
    "registration": true,
    "googleLogin": true,
    "payments": true,
    "reviews": true
  },
  "commerce": {
    "commissionPct": 0,
    "freeShippingThreshold": 50,
    "shippingFee": 5
  }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
