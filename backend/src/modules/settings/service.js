const { db } = require('../../utils');

// Canonical defaults — also the shape of the settings object.
const DEFAULTS = {
  branding: { siteName: 'BoutiqueKi', logoUrl: '', faviconUrl: '', primaryColor: '#2563EB', secondaryColor: '#06B6D4', font: 'Inter' },
  content: {
    heroTitle: 'Créez votre boutique en ligne',
    heroSubtitle: 'La plateforme tout-en-un pour lancer, gérer et faire évoluer votre commerce.',
    announcement: { text: '', enabled: false, level: 'info' },
  },
  flags: { maintenance: false, registration: true, googleLogin: true, payments: true, reviews: true },
  commerce: { commissionPct: 0, freeShippingThreshold: 50, shippingFee: 5 },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
// Deep-merge so newly added default keys always appear even on old stored rows.
function deepMerge(base, override) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(override || {})) {
    out[k] = isObj(base?.[k]) && isObj(override[k]) ? deepMerge(base[k], override[k]) : override[k];
  }
  return out;
}

let _cache = null;
let _cacheAt = 0;
const TTL_MS = 15000;

async function getSettings() {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache;
  const r = await db.query('SELECT data FROM platform_settings WHERE id = 1');
  _cache = deepMerge(DEFAULTS, r.rows[0]?.data || {});
  _cacheAt = Date.now();
  return _cache;
}

async function updateSettings(patch) {
  const current = await getSettings();
  const merged = deepMerge(current, patch || {});
  await db.query(
    `INSERT INTO platform_settings (id, data, updated_at) VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
    [JSON.stringify(merged)]
  );
  _cache = merged;
  _cacheAt = Date.now();
  return merged;
}

module.exports = { DEFAULTS, getSettings, updateSettings };
