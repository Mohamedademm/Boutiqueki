import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import {
  Loader2, Search, MessageSquareWarning, ChevronLeft, ChevronRight,
  X, CheckCircle2, Clock, AlertTriangle, XCircle, Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['Tous', 'open', 'in_progress', 'resolved', 'rejected'];
const PAGE_SIZE = 15;

const statusConfig = {
  open:        { label: 'Ouverte',    color: 'text-amber-700 bg-amber-50',    icon: Clock },
  in_progress: { label: 'En cours',   color: 'text-blue-700 bg-blue-50',     icon: AlertTriangle },
  resolved:    { label: 'Résolue',    color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle2 },
  rejected:    { label: 'Rejetée',    color: 'text-red-700 bg-red-50',        icon: XCircle },
};

const Badge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const ClaimModal = ({ claim, onClose, onUpdate }) => {
  const [status, setStatus] = useState(claim?.status || 'open');
  const [adminReply, setAdminReply] = useState(claim?.adminReply || '');
  const [saving, setSaving] = useState(false);

  if (!claim) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/claims/${claim.id}`, { status, adminReply: adminReply || undefined });
      onUpdate();
      onClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{claim.subject}</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {claim.userName} · {claim.userEmail}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm text-slate-700 leading-relaxed">
          {claim.message}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          {claim.shopName && <span>Boutique: <strong>{claim.shopName}</strong></span>}
          {claim.orderId && <span>Commande: <strong>#{String(claim.orderId).slice(0, 8)}</strong></span>}
          <span>{new Date(claim.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Statut</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Ouverte</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolue</option>
              <option value="rejected">Rejetée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Réponse admin</label>
            <textarea
              value={adminReply}
              onChange={e => setAdminReply(e.target.value)}
              rows={3}
              placeholder="Répondre au client…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (statusFilter !== 'Tous') params.status = statusFilter;
      const { data } = await api.get('/claims', { params });
      setClaims(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const filtered = search
    ? claims.filter(c =>
        c.subject?.toLowerCase().includes(search.toLowerCase()) ||
        c.userName?.toLowerCase().includes(search.toLowerCase()) ||
        c.userEmail?.toLowerCase().includes(search.toLowerCase())
      )
    : claims;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Réclamations</h1>
          <p className="text-sm text-slate-500 mt-1">{total} réclamation{total !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par sujet, nom ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'Tous' ? 'Tous' : (statusConfig[s]?.label || s)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-700">Aucune réclamation</p>
          <p className="text-sm text-slate-500 mt-1">Les réclamations des clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Sujet</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Client</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Boutique</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Statut</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(claim => (
                  <tr
                    key={claim.id}
                    onClick={() => setSelected(claim)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 line-clamp-1">{claim.subject}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{claim.message}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{claim.userName}</p>
                      <p className="text-xs text-slate-500">{claim.userEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{claim.shopName || '—'}</td>
                    <td className="px-5 py-4"><Badge status={claim.status} /></td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(claim.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <ClaimModal
            claim={selected}
            onClose={() => setSelected(null)}
            onUpdate={fetchClaims}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminClaimsPage;
