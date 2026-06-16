import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/axios';
import { ensureGoogleFont } from '../utils/fonts';

const DEFAULTS = {
  branding: { siteName: 'BoutiqueKi', logoUrl: '', faviconUrl: '', primaryColor: '#2563EB', secondaryColor: '#06B6D4', font: 'Inter' },
  content: { heroTitle: '', heroSubtitle: '', announcement: { text: '', enabled: false, level: 'info' } },
  flags: { maintenance: false, registration: true, googleLogin: true, payments: true, reviews: true },
  commerce: { freeShippingThreshold: 50, shippingFee: 5 },
};

const SettingsContext = createContext({ settings: DEFAULTS, flags: DEFAULTS.flags, loading: true });

// Darken a hex color by a factor (for hover states).
const shade = (hex, amt = -0.12) => {
  try {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + Math.round(255 * amt)));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amt)));
    const b = Math.max(0, Math.min(255, (n & 0xff) + Math.round(255 * amt)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch { return hex; }
};

const applyBranding = (b) => {
  if (typeof document === 'undefined' || !b) return;
  const root = document.documentElement.style;
  if (b.primaryColor) { root.setProperty('--bk-primary', b.primaryColor); root.setProperty('--bk-primary-hover', shade(b.primaryColor)); }
  if (b.secondaryColor) root.setProperty('--bk-secondary', b.secondaryColor);
  if (b.font) { root.setProperty('--bk-font', `'${b.font}', system-ui, sans-serif`); ensureGoogleFont(b.font); }
  if (b.siteName) document.title = b.siteName;
  if (b.faviconUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = b.faviconUrl;
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/public/settings')
      .then((res) => {
        if (!alive) return;
        const s = { ...DEFAULTS, ...res.data.data };
        setSettings(s);
        applyBranding(s.branding);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, flags: settings.flags || DEFAULTS.flags, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
