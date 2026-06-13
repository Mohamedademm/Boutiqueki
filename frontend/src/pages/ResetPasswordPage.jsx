import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/axios';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#080E1C] p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Store className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-black text-lg text-slate-900 dark:text-white">BoutiqueKi</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Mot de passe réinitialisé</h1>
            <p className="text-slate-500 dark:text-slate-400">Redirection vers la connexion…</p>
          </div>
        ) : !token ? (
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Lien invalide</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Ce lien de réinitialisation est incomplet ou expiré.</p>
            <Link to="/forgot-password" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500">
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Nouveau mot de passe</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Choisissez un nouveau mot de passe pour votre compte.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {[{ v: password, set: setPassword, ph: 'Nouveau mot de passe' }, { v: confirm, set: setConfirm, ph: 'Confirmer le mot de passe' }].map((f, i) => (
                <div key={i} className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password" required value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              ))}
              <button
                type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Réinitialiser'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
