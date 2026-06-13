// Dynamically load the Google Fonts used by the Shop Builder / storefront themes,
// so a merchant's chosen font actually renders (in the preview and the public page).

const loaded = new Set();

const FONT_QUERY = {
  Inter: 'Inter:wght@400;500;600;700;800;900',
  Roboto: 'Roboto:wght@400;500;700;900',
  Syne: 'Syne:wght@400;500;600;700;800',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700;800;900',
};

export function ensureGoogleFont(family) {
  if (typeof document === 'undefined') return;
  if (!family || loaded.has(family)) return;
  const spec = FONT_QUERY[family];
  if (!spec) return; // unknown / system font — nothing to load
  loaded.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(link);
}
