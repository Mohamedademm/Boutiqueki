import { useState, useEffect } from 'react';
import api from '../utils/axios';
import useAuthStore from '../store/useAuthStore';
import {
  User, Lock, Bell, Palette, Shield, Save, Loader2, Check,
  Eye, EyeOff, Moon, Sun, Store, ExternalLink, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useShop } from '../hooks/useShop';

const TABS = [
  { id: 'profile',    label: 'Profil',       icon: User },
  { id: 'security',   label: 'Sécurité',     icon: Lock },
  { id: 'boutique',   label: 'Ma boutique',  icon: Store },
];

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${props.className || ''}`}
  />
);

const Toast = ({ msg, type = 'success' }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg ${
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
    }`}
  >
    {type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <span className="w-4 h-4 flex-shrink-0">✕</span>}
    {msg}
  </motion.div>
);

const ProfileTab = () => {
  const { user, loadUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await api.put('/auth/profile', { name: name.trim(), email: email.trim() });
      await loadUser();
      showToast('Profil mis à jour avec succès.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informations personnelles</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Modifiez votre nom et votre adresse e-mail.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-500/20">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{user?.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.role === 'admin' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
            {user?.role === 'admin' ? '⚡ Administrateur' : '👤 Utilisateur'}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
        <Field label="Nom complet">
          <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" required />
        </Field>
        <Field label="Adresse e-mail">
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
        </Field>
      </div>

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

      <button type="submit" disabled={isSaving}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isSaving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
      </button>
    </form>
  );
};

const SecurityTab = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (next !== confirm) {
      showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }
    if (next.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: current, newPassword: next });
      showToast('Mot de passe modifié avec succès.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Mot de passe actuel incorrect.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const strength = next.length === 0 ? 0 : next.length < 6 ? 1 : next.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Faible', 'Moyen', 'Fort'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Changer le mot de passe</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Utilisez un mot de passe fort d'au moins 8 caractères.</p>
      </div>

      <div className="space-y-4">
        <Field label="Mot de passe actuel">
          <div className="relative">
            <Input type={showPasswords ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" className="pr-10" required />
            <button type="button" onClick={() => setShowPasswords(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Nouveau mot de passe">
          <Input type={showPasswords ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} placeholder="••••••••" required />
          {next.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
              </div>
              <p className={`text-xs font-semibold ${['', 'text-red-500', 'text-amber-500', 'text-emerald-500'][strength]}`}>{strengthLabel[strength]}</p>
            </div>
          )}
        </Field>

        <Field label="Confirmer le nouveau mot de passe">
          <Input type={showPasswords ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          {confirm && next && (
            <p className={`text-xs mt-1 font-semibold ${confirm === next ? 'text-emerald-500' : 'text-red-500'}`}>
              {confirm === next ? '✓ Les mots de passe correspondent' : '✕ Les mots de passe ne correspondent pas'}
            </p>
          )}
        </Field>
      </div>

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

      <button type="submit" disabled={isSaving || !current || !next || !confirm}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        {isSaving ? 'Modification...' : 'Modifier le mot de passe'}
      </button>
    </form>
  );
};

const BoutiqueTab = () => {
  const { data: shop, isLoading } = useShop();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  if (!shop) {
    return (
      <div className="text-center py-12">
        <Store className="w-14 h-14 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Vous n'avez pas encore de boutique</h3>
        <p className="text-sm text-slate-500 mb-6">Créez votre boutique pour commencer à vendre en ligne.</p>
        <Link to="/onboarding"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Store className="w-4 h-4" />
          Créer ma boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ma boutique</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Informations et liens rapides vers votre boutique.</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30">
            {shop.name?.[0] || '?'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xl">{shop.name}</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">boutiqueki.fr/s/{shop.slug}</p>
          </div>
        </div>
        {shop.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 bg-white/60 dark:bg-black/20 rounded-xl p-3">{shop.description}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Link to="/builder"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
            <Palette className="w-4 h-4" />
            Personnaliser la boutique
          </Link>
          <a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:border-blue-400 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Voir ma boutique
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Thème', value: typeof shop.theme === 'string' ? shop.theme : (shop.theme?.template || 'Personnalisé') },
          { label: 'Slug', value: `/${shop.slug}` },
          { label: 'Statut', value: shop.status || 'active' },
          { label: 'Créée le', value: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('fr-FR') : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold uppercase tracking-wide">{label}</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm font-mono">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { logout } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Compte</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gérez votre profil, sécurité et boutique.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="md:w-52 flex md:flex-col gap-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 h-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
          <div className="border-t border-slate-200 dark:border-slate-800 mt-1 pt-1">
            <button
              onClick={() => { if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) logout(); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full text-left"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Déconnexion
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-96">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'profile'  && <ProfileTab />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'boutique' && <BoutiqueTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
