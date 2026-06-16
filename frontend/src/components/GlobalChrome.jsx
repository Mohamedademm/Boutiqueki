import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, AlertTriangle, Info, Wrench } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import useAuthStore from '../store/useAuthStore';

const LEVELS = {
  info: { bg: 'bg-blue-600', icon: Info },
  success: { bg: 'bg-emerald-600', icon: Megaphone },
  warning: { bg: 'bg-amber-500', icon: AlertTriangle },
};

/** Global announcement banner (top of every page) driven by admin content settings. */
export const AnnouncementBanner = () => {
  const { settings } = useSettings();
  const a = settings?.content?.announcement;
  if (!a?.enabled || !a?.text) return null;
  const { bg, icon: Icon } = LEVELS[a.level] || LEVELS.info;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
        className={`${bg} text-white text-sm font-medium`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center">
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span>{a.text}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Full-screen maintenance gate. Shows for everyone EXCEPT admins, and never on auth pages
 * (so admins can still log in to turn it off).
 */
export const MaintenanceGate = ({ children }) => {
  const { settings, loading } = useSettings();
  const { user } = useAuthStore();
  const location = useLocation();

  const onAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => location.pathname.startsWith(p));
  const blocked = !loading && settings?.flags?.maintenance && user?.role !== 'admin' && !onAuthPage;

  if (!blocked) return children;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-center px-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-6">
        <Wrench className="w-9 h-9 text-amber-400" />
      </motion.div>
      <h1 className="text-3xl font-black text-white mb-3">{settings.branding?.siteName || 'Site'} est en maintenance</h1>
      <p className="text-slate-400 max-w-md">Nous effectuons une mise à jour. Le site sera de retour très bientôt — merci de votre patience.</p>
    </div>
  );
};
