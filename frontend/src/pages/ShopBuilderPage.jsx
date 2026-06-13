import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, Save, LayoutTemplate, Palette, Type, Image as ImageIcon,
  CheckCircle2, Loader2, Monitor, Smartphone, Tablet, ExternalLink,
  ShoppingCart, RotateCcw, Eye, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import axios from '../utils/axios';
import { ensureGoogleFont } from '../utils/fonts';
import ImageUploader from '../components/ImageUploader';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Color presets ────────────────────────────────────────── */
const COLOR_PRESETS = [
  '#1E3A5F','#2563EB','#7C3AED','#DB2777','#EA580C',
  '#16A34A','#0F766E','#CA8A04','#1D4ED8','#0F172A',
];

/* ─── Template data ────────────────────────────────────────── */
const TEMPLATES = [
  { id: 'Minimal',  label: 'Minimal',  desc: 'Épuré et élégant',    headerBg: '#ffffff', heroBg: '#f8fafc',  accent: '#1E3A5F' },
  { id: 'Bold',     label: 'Bold',     desc: 'Impact & modernité',  headerBg: 'primary', heroBg: 'primary',  accent: '#ffffff' },
  { id: 'Artisan',  label: 'Artisan',  desc: 'Chaleur & authenticité', headerBg: '#fdf6ee', heroBg: '#fdf6ee', accent: '#78350f' },
  { id: 'Luxe',     label: 'Luxe',     desc: 'Premium & raffiné',   headerBg: '#0f172a', heroBg: '#0f172a',  accent: '#f59e0b' },
  { id: 'Tech',     label: 'Tech',     desc: 'Futuriste & précis',  headerBg: '#0f172a', heroBg: '#1e293b',  accent: '#38bdf8' },
  { id: 'Playful',  label: 'Playful',  desc: 'Coloré & dynamique',  headerBg: 'secondary', heroBg: 'secondary', accent: '#ffffff' },
];

const FONTS = [
  { id: 'Inter',              label: 'Inter',              sample: 'Moderne & lisible' },
  { id: 'Roboto',             label: 'Roboto',             sample: 'Classique & propre' },
  { id: 'Syne',               label: 'Syne',               sample: 'Éditorial & unique' },
  { id: 'Plus Jakarta Sans',  label: 'Plus Jakarta Sans',  sample: 'Contemporain & élégant' },
  { id: 'Playfair Display',   label: 'Playfair Display',   sample: 'Luxueux & sérieux' },
];

const LAYOUTS = [
  { id: 'grid-2', label: '2 col.',   cols: 2 },
  { id: 'grid-3', label: '3 col.',   cols: 3 },
  { id: 'grid-4', label: '4 col.',   cols: 4 },
  { id: 'list',   label: 'Liste',    cols: 1 },
];

/* ─── Mini template preview ────────────────────────────────── */
const TemplateMiniPreview = ({ tpl, primaryColor, secondaryColor }) => {
  const headerBg  = tpl.headerBg  === 'primary'   ? primaryColor
                  : tpl.headerBg  === 'secondary'  ? secondaryColor
                  : tpl.headerBg;
  const heroBg    = tpl.heroBg    === 'primary'    ? primaryColor + '22'
                  : tpl.heroBg    === 'secondary'  ? secondaryColor + '22'
                  : tpl.heroBg;
  const accentColor = tpl.id === 'Bold' || tpl.id === 'Playful' ? '#fff' : tpl.accent;

  return (
    <div className="w-full h-16 rounded-lg overflow-hidden border border-white/10" style={{ backgroundColor: heroBg }}>
      {/* header strip */}
      <div className="h-4 px-2 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
        <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: accentColor + '99' }} />
        <div className="flex gap-1">
          {[1,2,3].map(i => <div key={i} className="w-3 h-1 rounded-full" style={{ backgroundColor: accentColor + '60' }} />)}
        </div>
      </div>
      {/* body */}
      <div className="p-1.5">
        <div className="h-1.5 w-2/3 rounded-full mb-1.5" style={{ backgroundColor: tpl.accent + '40' }} />
        <div className="grid grid-cols-3 gap-1">
          {[1,2,3].map(i => (
            <div key={i} className="rounded" style={{ height: 20, backgroundColor: tpl.accent + '18' }}>
              <div className="w-full h-1 rounded-b mt-auto" style={{ backgroundColor: primaryColor + '30' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Layout mini icon ─────────────────────────────────────── */
const LayoutIcon = ({ cols }) => (
  <div className={`grid gap-0.5 w-8 h-6 ${cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
    {Array.from({ length: cols === 1 ? 2 : cols }).map((_, i) => (
      <div key={i} className="bg-current rounded-sm opacity-60" />
    ))}
  </div>
);

/* ─── Color swatch ─────────────────────────────────────────── */
const ColorSwatch = ({ color, selected, onClick }) => (
  <button
    onClick={() => onClick(color)}
    className={`w-7 h-7 rounded-lg transition-all ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110'}`}
    style={{ backgroundColor: color }}
    title={color}
  />
);

/* ─── Section title ────────────────────────────────────────── */
const SectionTitle = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 mb-3">{children}</p>
);

/* ─── Toast notification ───────────────────────────────────── */
const Toast = ({ message, type = 'success', onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 16, scale: 0.95 }}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold border ${
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <RotateCcw className="w-4 h-4 flex-shrink-0" />}
    {message}
  </motion.div>
);

/* ─── Live Preview ─────────────────────────────────────────── */
const LivePreview = ({ shop, previewMode }) => {
  const { theme, name, description } = shop;
  const tpl = TEMPLATES.find(t => t.id === theme.template) || TEMPLATES[0];
  const primaryColor   = theme.primaryColor   || '#1E3A5F';
  const secondaryColor = theme.secondaryColor || '#2563EB';

  const headerBg = tpl.headerBg === 'primary' ? primaryColor : tpl.headerBg === 'secondary' ? secondaryColor : tpl.headerBg;
  const heroBg   = tpl.heroBg   === 'primary' ? `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}08)` : tpl.heroBg === 'secondary' ? `linear-gradient(135deg, ${secondaryColor}22, ${secondaryColor}08)` : tpl.heroBg;
  const heroTextColor = ['Luxe','Tech'].includes(theme.template) ? '#f8fafc' : ['Bold'].includes(theme.template) ? '#fff' : primaryColor;
  const btnBg = secondaryColor;

  const gridClass = theme.layout === 'grid-2' ? 'grid-cols-2' : theme.layout === 'grid-4' ? 'grid-cols-4' : theme.layout === 'list' ? 'grid-cols-1' : 'grid-cols-3';

  return (
    <div className="w-full h-full flex flex-col overflow-auto" style={{ fontFamily: theme.font || 'Inter' }}>
      {/* Header */}
      <header className="flex-shrink-0 py-4 px-6 flex justify-between items-center shadow-sm" style={{ backgroundColor: headerBg }}>
        <div
          className="text-xl font-black"
          style={{ color: ['Bold','Tech','Luxe'].includes(theme.template) ? '#ffffff' : primaryColor }}
        >
          {name}
        </div>
        <nav className="hidden md:flex gap-5 text-sm font-medium" style={{ color: ['Bold','Tech','Luxe'].includes(theme.template) ? 'rgba(255,255,255,0.75)' : '#475569' }}>
          <span className="hover:opacity-100 cursor-pointer">Accueil</span>
          <span className="hover:opacity-100 cursor-pointer">Catalogue</span>
          <span className="hover:opacity-100 cursor-pointer">À propos</span>
        </nav>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white" style={{ backgroundColor: btnBg }}>
          <ShoppingCart className="w-3.5 h-3.5" />
          Panier
        </button>
      </header>

      {/* Hero */}
      <div className="flex-shrink-0 py-16 px-8 text-center relative overflow-hidden" style={{ background: heroBg }}>
        {['Tech','Luxe'].includes(theme.template) && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        )}
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ backgroundColor: secondaryColor + '20', color: secondaryColor }}>
            Nouvelle collection
          </span>
          <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight" style={{ color: heroTextColor }}>
            Découvrez notre collection
          </h1>
          <p className="text-base max-w-xl mx-auto mb-6 opacity-70" style={{ color: heroTextColor }}>
            {description || "Des produits d'exception conçus avec passion et expertise."}
          </p>
          <button className="px-7 py-3 rounded-full font-bold text-white text-sm shadow-lg transition hover:scale-105" style={{ backgroundColor: btnBg }}>
            Voir les produits
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 p-6 bg-white">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">Nouveautés</h2>
          <button className="text-xs font-semibold" style={{ color: primaryColor }}>Voir tout →</button>
        </div>
        <div className={`grid gap-4 ${gridClass}`}>
          {[1,2,3,4,5,6].slice(0, theme.layout === 'grid-2' ? 4 : theme.layout === 'grid-4' ? 4 : theme.layout === 'list' ? 4 : 6).map(i => (
            <div
              key={i}
              className={`group cursor-pointer ${theme.layout === 'list' ? 'flex gap-4 items-center p-3 rounded-xl hover:bg-slate-50 border border-slate-100' : ''}`}
            >
              <div
                className={`rounded-2xl overflow-hidden relative flex-shrink-0 ${
                  theme.layout === 'list' ? 'w-20 h-20' : 'aspect-square mb-3'
                }`}
                style={{ backgroundColor: primaryColor + '10' }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-20">📦</div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: secondaryColor + '40' }}
                />
              </div>
              <div className={theme.layout === 'list' ? 'flex-1' : ''}>
                <h3 className="font-semibold text-slate-800 text-sm">Produit Exemple {i}</h3>
                <p className="text-slate-400 text-xs mb-1">Catégorie</p>
                <div className="flex items-center justify-between">
                  <span className="font-black" style={{ color: primaryColor }}>29,99 €</span>
                  {theme.layout !== 'list' && (
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: secondaryColor }}>
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Main page ────────────────────────────────────────────── */
const ShopBuilderPage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [toast, setToast] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const savedRef = useRef(null);

  const [shop, setShop] = useState({
    name: 'Ma Boutique',
    description: '',
    theme: { template: 'Minimal', primaryColor: '#1E3A5F', secondaryColor: '#2563EB', font: 'Inter', layout: 'grid-3' },
    logo: '',
    banner: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchShop = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/shops/me');
      if (res.data?.data) {
        const d = res.data.data;
        setShop(c => ({
          ...c, ...d,
          theme: d.theme || c.theme,
          logo: d.logo_url || c.logo,
          banner: d.banner_url || c.banner,
        }));
        savedRef.current = JSON.stringify(d.theme || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  // Load the selected Google Font so the preview renders with it
  useEffect(() => { ensureGoogleFont(shop.theme?.font); }, [shop.theme?.font]);

  // Warn before leaving with unpublished changes (refresh / tab close)
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.put(`/shops/${shop.id}`, {
        name: shop.name,
        description: shop.description,
        theme: shop.theme,
        logo_url: shop.logo,
        banner_url: shop.banner,
      });
      setIsDirty(false);
      showToast('Boutique publiée avec succès !');
    } catch (err) {
      showToast('Échec de la sauvegarde.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('Vous avez des modifications non publiées. Quitter sans publier ?')) return;
    navigate('/dashboard');
  };

  const updateTheme = (key, value) => {
    setShop(c => ({ ...c, theme: { ...c.theme, [key]: value } }));
    setIsDirty(true);
  };

  const updateField = (key, value) => {
    setShop(c => ({ ...c, [key]: value }));
    setIsDirty(true);
  };

  const TABS = [
    { id: 'theme',      icon: LayoutTemplate, label: 'Thème'   },
    { id: 'colors',     icon: Palette,        label: 'Couleurs' },
    { id: 'typography', icon: Type,           label: 'Typo'    },
    { id: 'branding',   icon: ImageIcon,      label: 'Marque'  },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0A0F1E]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Chargement de votre boutique…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-100 dark:bg-[#0A0F1E]">

      {/* ── LEFT PANEL ── */}
      <div className="w-[380px] flex-shrink-0 bg-white dark:bg-[#0A0F1E] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-20 shadow-xl dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)]">

        {/* Header */}
        <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="font-black text-sm text-slate-800 dark:text-white leading-tight truncate">Éditeur Visuel</h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 truncate">{shop.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Modifications non publiées" />
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60 transition-all"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Publier
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-3 pt-3 pb-0 gap-1 flex-shrink-0 border-b border-slate-100 dark:border-slate-800/60">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center pb-3 pt-2 rounded-t-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-200 gap-1 ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="p-5 space-y-7"
            >

              {/* ─ THEME ─ */}
              {activeTab === 'theme' && (
                <>
                  <div>
                    <SectionTitle>Template</SectionTitle>
                    <div className="grid grid-cols-2 gap-2.5">
                      {TEMPLATES.map(tpl => (
                        <motion.button
                          key={tpl.id}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => updateTheme('template', tpl.id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                            shop.theme.template === tpl.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/8 shadow-md shadow-blue-500/15'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/30'
                          }`}
                        >
                          <TemplateMiniPreview
                            tpl={tpl}
                            primaryColor={shop.theme.primaryColor}
                            secondaryColor={shop.theme.secondaryColor}
                          />
                          <div className="mt-2 flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{tpl.label}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{tpl.desc}</p>
                            </div>
                            {shop.theme.template === tpl.id && (
                              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Mise en page produits</SectionTitle>
                    <div className="grid grid-cols-4 gap-2">
                      {LAYOUTS.map(l => (
                        <button
                          key={l.id}
                          onClick={() => updateTheme('layout', l.id)}
                          className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${
                            shop.theme.layout === l.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <LayoutIcon cols={l.cols} />
                          <span className="text-[9px] font-bold uppercase tracking-wide">{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ─ COLORS ─ */}
              {activeTab === 'colors' && (
                <>
                  {[
                    { key: 'primaryColor',   label: 'Couleur Primaire',    desc: 'Titres, liens, header' },
                    { key: 'secondaryColor', label: 'Couleur Secondaire',  desc: 'Boutons CTA, badges, accents' },
                  ].map(({ key, label, desc }) => (
                    <div key={key}>
                      <SectionTitle>{label}</SectionTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">{desc}</p>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {COLOR_PRESETS.map(c => (
                          <ColorSwatch
                            key={c}
                            color={c}
                            selected={shop.theme[key] === c}
                            onClick={v => updateTheme(key, v)}
                          />
                        ))}
                      </div>

                      {/* Custom picker */}
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-md" style={{ backgroundColor: shop.theme[key] }}>
                          <input
                            type="color"
                            value={shop.theme[key]}
                            onChange={e => updateTheme(key, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={shop.theme[key]}
                            onChange={e => updateTheme(key, e.target.value)}
                            className="w-full bg-transparent font-mono text-sm text-slate-900 dark:text-white outline-none"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Cliquez sur le carré pour ouvrir le sélecteur</p>
                        </div>
                      </div>

                      {/* Preview pill */}
                      <div className="mt-3 flex gap-2">
                        <button className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md" style={{ backgroundColor: shop.theme[key] }}>
                          Bouton exemple
                        </button>
                        <span className="px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: shop.theme[key] + '20', color: shop.theme[key] }}>
                          Badge
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ─ TYPOGRAPHY ─ */}
              {activeTab === 'typography' && (
                <div>
                  <SectionTitle>Police de caractères</SectionTitle>
                  <div className="space-y-2.5">
                    {FONTS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => updateTheme('font', f.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          shop.theme.font === f.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/8 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/30'
                        }`}
                        style={{ fontFamily: f.id }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">Aa</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{f.label}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{f.sample}</p>
                          </div>
                          {shop.theme.font === f.id && (
                            <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ─ BRANDING ─ */}
              {activeTab === 'branding' && (
                <>
                  <div>
                    <SectionTitle>Nom de la boutique</SectionTitle>
                    <input
                      type="text"
                      value={shop.name}
                      onChange={e => updateField('name', e.target.value)}
                      placeholder="Ma Boutique"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <SectionTitle>Description</SectionTitle>
                    <textarea
                      rows={3}
                      value={shop.description}
                      onChange={e => updateField('description', e.target.value)}
                      placeholder="Découvrez notre collection unique…"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none transition-all"
                    />
                  </div>
                  <div>
                    <SectionTitle>Logo</SectionTitle>
                    <ImageUploader
                      value={shop.logo ? [shop.logo] : []}
                      onChange={arr => updateField('logo', arr[0] || '')}
                      max={1}
                    />
                  </div>
                  <div>
                    <SectionTitle>Bannière</SectionTitle>
                    <ImageUploader
                      value={shop.banner ? [shop.banner] : []}
                      onChange={arr => updateField('banner', arr[0] || '')}
                      max={1}
                    />
                  </div>

                  {/* Preview slug */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">URL publique</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-blue-600 dark:text-blue-400 font-mono truncate flex-1">
                        boutiqueki.com/s/{shop.slug || 'ma-boutique'}
                      </code>
                      {shop.slug && (
                        <a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT PANEL: Preview ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#080E1C]">

        {/* Preview toolbar */}
        <div className="h-16 px-6 flex items-center justify-between bg-white/60 dark:bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Aperçu en direct</span>
            {isDirty && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                Non publié
              </span>
            )}
          </div>

          {/* Device switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
            {[
              { id: 'desktop', icon: Monitor,    label: 'Bureau'  },
              { id: 'tablet',  icon: Tablet,     label: 'Tablette' },
              { id: 'mobile',  icon: Smartphone, label: 'Mobile'  },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setPreviewMode(id)}
                title={label}
                className={`p-2 rounded-lg transition-all ${
                  previewMode === id
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white'
                    : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto p-6 lg:p-10 flex items-start justify-center">
          {/* Checkerboard bg */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
            style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
          />

          <motion.div
            layout
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={`relative bg-white shadow-2xl dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden ${
              previewMode === 'mobile'
                ? 'w-[390px] rounded-[3rem] border-[10px] border-slate-800 dark:border-slate-700'
                : previewMode === 'tablet'
                ? 'w-[768px] rounded-3xl border-[8px] border-slate-800 dark:border-slate-700'
                : 'w-full rounded-2xl border border-slate-200 dark:border-slate-700'
            }`}
            style={{
              height: previewMode === 'mobile' ? 760 : previewMode === 'tablet' ? 900 : 'auto',
              minHeight: previewMode === 'desktop' ? 600 : undefined,
            }}
          >
            {/* Device notch for mobile */}
            {previewMode === 'mobile' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-32 h-7 bg-slate-800 rounded-b-2xl flex items-center justify-center">
                <div className="w-14 h-1.5 bg-slate-700 rounded-full" />
              </div>
            )}

            <div className={`w-full h-full overflow-auto ${previewMode === 'mobile' ? 'pt-7' : ''}`}>
              <LivePreview shop={shop} previewMode={previewMode} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Toast ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ShopBuilderPage;
