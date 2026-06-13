import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
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

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Vérifiez vos emails</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d'être envoyé.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500">
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Mot de passe oublié ?</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Entrez votre email pour recevoir un lien de réinitialisation.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Envoyer le lien'}
              </button>
            </form>

            <Link to="/login" className="mt-8 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600">
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
