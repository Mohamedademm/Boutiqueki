import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Save, Palette, FileText, ToggleLeft, Euro, ShieldAlert, Check,
} from 'lucide-react';
import api from '../utils/axios';
import useAuthStore from '../store/useAuthStore';
import ImageUploader from '../components/ImageUploader';
import { useToast, ToastViewport } from '../components/Toast';

const TABS = [
  { id: 'branding', label: 'Apparence', icon: Palette },
  { id: 'content', label: 'Contenu', icon: FileText },
  { id: 'flags', label: 'Fonctionnalités', icon: ToggleLeft },
  { id: 'commerce', label: 'Commerce', icon: Euro },
];

const FONTS = ['Inter', 'Roboto', 'Syne', 'Plus Jakarta Sans', 'Playfair Display'];

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{children}</label>
);
const Input = (p) => (
  <input {...p} className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${p.className || ''}`} />
);

const Toggle = ({ checked, onChange, label, desc }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left">
    <div>
      <p className="font-semibold text-slate-900 dark:text-white text-sm">{label}</p>
      {desc && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>}
    </div>
    <span className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
      <motion.span layout className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow" animate={{ left: checked ? 22 : 2 }} />
    </span>
  </button>
);

const ColorField = ({ label, value, onChange }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
      <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-white dark:border-slate-700 shadow flex-shrink-0" style={{ backgroundColor: value }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
      <input value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-transparent font-mono text-sm text-slate-900 dark:text-white outline-none" />
    </div>
  </div>
);

const AdminSettingsPage = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('branding');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.get('/admin/settings').then(res => setForm(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  if (loading || !form) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const set = (section, key, val) => setForm(f => ({ ...f, [section]: { ...f[section], [key]: val } }));
  const setAnnounce = (key, val) => setForm(f => ({ ...f, content: { ...f.content, announcement: { ...f.content.announcement, [key]: val } } }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      showToast('Réglages enregistrés — appliqués sur tout le site.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Échec de la sauvegarde.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1"><ShieldAlert className="w-5 h-5 text-blue-400" /><h1 className="text-2xl font-black text-white">Réglages du site</h1></div>
            <p className="text-slate-400 text-sm">Contrôlez l'apparence, le contenu et les fonctionnalités de toute la plateforme.</p>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-lg shadow-blue-500/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-52 flex md:flex-col gap-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 h-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${tab === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{t.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-96">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="space-y-5">

              {tab === 'branding' && (
                <>
                  <div><Label>Nom du site</Label><Input value={form.branding.siteName} onChange={e => set('branding', 'siteName', e.target.value)} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorField label="Couleur primaire" value={form.branding.primaryColor} onChange={v => set('branding', 'primaryColor', v)} />
                    <ColorField label="Couleur secondaire" value={form.branding.secondaryColor} onChange={v => set('branding', 'secondaryColor', v)} />
                  </div>
                  <div><Label>Police</Label>
                    <select value={form.branding.font} onChange={e => set('branding', 'font', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Logo</Label><ImageUploader value={form.branding.logoUrl ? [form.branding.logoUrl] : []} onChange={a => set('branding', 'logoUrl', a[0] || '')} max={1} /></div>
                    <div><Label>Favicon</Label><ImageUploader value={form.branding.faviconUrl ? [form.branding.faviconUrl] : []} onChange={a => set('branding', 'faviconUrl', a[0] || '')} max={1} /></div>
                  </div>
                </>
              )}

              {tab === 'content' && (
                <>
                  <div><Label>Titre d'accueil (hero)</Label><Input value={form.content.heroTitle} onChange={e => set('content', 'heroTitle', e.target.value)} /></div>
                  <div><Label>Sous-titre d'accueil</Label>
                    <textarea value={form.content.heroSubtitle} onChange={e => set('content', 'heroSubtitle', e.target.value)} rows={3}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                    <Toggle checked={form.content.announcement.enabled} onChange={v => setAnnounce('enabled', v)} label="Bandeau d'annonce" desc="Affiché en haut de toutes les pages." />
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                      <div><Label>Texte de l'annonce</Label><Input value={form.content.announcement.text} onChange={e => setAnnounce('text', e.target.value)} placeholder="Ex: Soldes -20% ce week-end !" /></div>
                      <div><Label>Niveau</Label>
                        <select value={form.content.announcement.level} onChange={e => setAnnounce('level', e.target.value)}
                          className="px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white">
                          <option value="info">Info</option><option value="success">Succès</option><option value="warning">Alerte</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === 'flags' && (
                <div className="space-y-3">
                  <Toggle checked={form.flags.maintenance} onChange={v => set('flags', 'maintenance', v)} label="Mode maintenance" desc="Bloque le site pour tous sauf les administrateurs." />
                  <Toggle checked={form.flags.registration} onChange={v => set('flags', 'registration', v)} label="Inscriptions ouvertes" desc="Autoriser la création de nouveaux comptes." />
                  <Toggle checked={form.flags.googleLogin} onChange={v => set('flags', 'googleLogin', v)} label="Connexion Google" desc="Afficher le bouton « Continuer avec Google »." />
                  <Toggle checked={form.flags.payments} onChange={v => set('flags', 'payments', v)} label="Paiements" desc="Activer le paiement en ligne (Stripe)." />
                  <Toggle checked={form.flags.reviews} onChange={v => set('flags', 'reviews', v)} label="Avis produits" desc="Autoriser les clients à laisser des avis." />
                </div>
              )}

              {tab === 'commerce' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Commission plateforme (%)</Label><Input type="number" min="0" step="0.1" value={form.commerce.commissionPct} onChange={e => set('commerce', 'commissionPct', Number(e.target.value))} /></div>
                  <div><Label>Frais de livraison (€)</Label><Input type="number" min="0" step="0.5" value={form.commerce.shippingFee} onChange={e => set('commerce', 'shippingFee', Number(e.target.value))} /></div>
                  <div><Label>Livraison gratuite dès (€)</Label><Input type="number" min="0" step="1" value={form.commerce.freeShippingThreshold} onChange={e => set('commerce', 'freeShippingThreshold', Number(e.target.value))} /></div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ToastViewport toast={toast} />
    </div>
  );
};

export default AdminSettingsPage;
