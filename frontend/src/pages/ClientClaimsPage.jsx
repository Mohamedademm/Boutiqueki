import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../utils/axios';
import {
  MessageSquareWarning, CheckCircle2, Clock, AlertCircle,
  XCircle, Plus, Loader2, Send, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig = {
  open:        { label: 'Ouvert',       color: 'text-blue-700 bg-blue-50 border-blue-200',     icon: Clock },
  in_progress: { label: 'En traitement', color: 'text-amber-700 bg-amber-50 border-amber-200',  icon: AlertCircle },
  resolved:    { label: 'Resolu',        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  rejected:    { label: 'Rejete',        color: 'text-red-700 bg-red-50 border-red-200',         icon: XCircle },
};

const SkeletonClaimCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-slate-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-5 bg-slate-200 rounded w-48" />
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-20" />
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-32" />
      </div>
    </div>
  </div>
);

const ClaimCard = ({ claim, index }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[claim.status] || statusConfig.open;
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquareWarning className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{claim.subject}</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {claim.shopName && <span>{claim.shopName}</span>}
            {claim.shopName && <span>·</span>}
            <span>{new Date(claim.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Votre message</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-xl p-4">{claim.message}</p>
              </div>
              {claim.adminReply && (
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Reponse de l'equipe</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-emerald-50 rounded-xl p-4 border border-emerald-100">{claim.adminReply}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ClientClaimsPage = () => {
  const [searchParams] = useSearchParams();
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    orderId: searchParams.get('orderId') || '',
    shopId: searchParams.get('shopId') || '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('orderId')) setShowForm(true);
  }, [searchParams]);

  const loadClaims = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/claims/my');
      setClaims(res.data.data || []);
    } catch {
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadClaims(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await axios.post('/claims', formData);
      setSubmitSuccess(true);
      setFormData({ orderId: '', shopId: '', subject: '', message: '' });
      setShowForm(false);
      await loadClaims();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'open', label: 'Ouvertes' },
    { key: 'in_progress', label: 'En traitement' },
    { key: 'resolved', label: 'Resolues' },
  ];

  const filtered = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Mes Reclamations</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Signalez un probleme ou suivez vos demandes en cours</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl text-sm font-semibold hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg shadow-slate-900/20"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Annuler' : 'Nouvelle reclamation'}
        </button>
      </motion.div>

      {/* Success banner */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold text-sm">Reclamation envoyee ! Notre equipe vous repondra sous 48h.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New claim form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                </div>
                Nouvelle reclamation
              </h2>
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {formData.orderId && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Numero de commande</label>
                    <input
                      type="text"
                      value={`#${formData.orderId.slice(0, 8).toUpperCase()}`}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Sujet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Produit non recu, article endommage..."
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Message detaille <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Decrivez votre probleme en detail..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all text-sm bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 shadow-lg shadow-blue-500/20"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <><Send className="w-4 h-4" /> Envoyer</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      {!isLoading && claims.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Claims list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonClaimCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-16 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquareWarning className="w-10 h-10 text-amber-300" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {filter !== 'all' ? 'Aucune reclamation avec ce statut' : 'Aucune reclamation'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Tout va bien ? Si vous avez un probleme, n'hesitez pas a nous contacter.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((claim, i) => (
            <ClaimCard key={claim.id} claim={claim} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientClaimsPage;
