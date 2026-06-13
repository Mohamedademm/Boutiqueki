import { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  Loader2, Search, Store, ExternalLink, Trash2, Ban, CheckCircle2,
  ChevronLeft, ChevronRight, Package, ShoppingBag, TrendingUp,
  X, Globe, User, Calendar,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const PAGE_SIZE = 15;

const sid = s => s?._id || s?.id || '';

const StatusBadge = ({ status }) => {
  const map = {
    active:    { label: '✓ Active',    cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    suspended: { label: '⏸ Suspendue', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    deleted:   { label: '✕ Supprimée', cls: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
  };
  const { label, cls } = map[status] ?? map.active;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
};

const ShopDetailPanel = ({ shop, onClose, onAction }) => {
  if (!shop) return null;
  const status = shop.status || 'active';
  const owner = typeof shop.ownerId === 'object' ? shop.ownerId : null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="h-full max-h-[calc(100vh-32px)] w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg">
              {shop.name?.[0] || '?'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{shop.name}</h3>
              <p className="text-xs text-slate-500 font-mono">/{shop.slug}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-3">
          {[
            { icon: Package,     label: 'Produits',  value: shop.productsCount ?? '—' },
            { icon: ShoppingBag, label: 'Commandes', value: shop.ordersCount ?? '—' },
            { icon: TrendingUp,  label: 'Revenus',   value: shop.revenue ? `${Number(shop.revenue).toLocaleString('fr-FR')} €` : '—' },
            { icon: Calendar,    label: 'Créée le',  value: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('fr-FR') : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500">{label}</p>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{value}</p>
            </div>
          ))}
        </div>

        {owner && (
          <div className="px-5 pb-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Propriétaire</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{owner.name || '—'}</p>
              <p className="text-xs text-slate-500">{owner.email || '—'}</p>
            </div>
          </div>
        )}

        <div className="px-5 pb-5">
          <p className="text-xs text-slate-500 mb-2">Statut actuel</p>
          <StatusBadge status={status} />
        </div>

        <div className="px-5 pb-5 flex-1 flex items-end">
          <div className="w-full flex flex-col gap-2">
            <a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Globe className="w-4 h-4" />
              Voir la boutique publique
            </a>
            <button
              onClick={() => onAction(sid(shop), 'status', status === 'suspended' ? 'active' : 'suspended')}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                status === 'suspended'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100'
              }`}
            >
              {status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              {status === 'suspended' ? 'Réactiver la boutique' : 'Suspendre la boutique'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminShopsPage = () => {
  const { user } = useAuthStore();
  const [shops, setShops] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const [selectedShop, setSelectedShop] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter !== 'Tous') params.set('status', statusFilter);

    api.get(`/admin/shops?${params}`)
      .then(res => {
        const d = res.data?.data;
        setShops(d?.shops || (Array.isArray(d) ? d : []) || []);
        setTotal(d?.total || res.data?.total || 0);
      })
      .catch(err => {
        console.error(err);
        setError('Impossible de charger les boutiques.');
      })
      .finally(() => setIsLoading(false));
  }, [page, statusFilter, debouncedSearch]);

  const handleAction = async (shopId, field, value) => {
    try {
      await api.put(`/admin/shops/${shopId}/status`, { status: value });
      const update = s => sid(s) === shopId ? { ...s, status: value } : s;
      setShops(prev => prev.map(update));
      if (selectedShop && sid(selectedShop) === shopId) setSelectedShop(prev => ({ ...prev, status: value }));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (shopId) => {
    try {
      await api.delete(`/admin/shops/${shopId}`);
      setShops(prev => prev.filter(s => sid(s) !== shopId));
      if (selectedShop && sid(selectedShop) === shopId) setSelectedShop(null);
    } catch (err) { console.error(err); }
  };

  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statuses = ['Tous', 'active', 'suspended'];

  return (
    <>
      <AnimatePresence>
        {selectedShop && (
          <ShopDetailPanel shop={selectedShop} onClose={() => setSelectedShop(null)} onAction={handleAction} />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer cette boutique ?"
        message={`${confirmDelete?.name || 'Cette boutique'} et toutes ses données seront définitivement effacées.`}
        confirmLabel="Supprimer"
        onConfirm={() => handleDelete(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Administration</p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Boutiques</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total.toLocaleString('fr-FR')} boutiques sur la plateforme</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, slug ou propriétaire..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {statuses.map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === s ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400'}`}>
                {s === 'Tous' ? 'Toutes' : s === 'active' ? '✓ Actives' : '⏸ Suspendues'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : shops.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Store className="w-12 h-12 mb-3 opacity-50" />
              <p className="font-medium text-slate-600 dark:text-slate-400">Aucune boutique trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                    {['Boutique', 'URL', 'Propriétaire', 'Produits', 'Statut', 'Créée le', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {shops.map((shop, i) => {
                    const id = sid(shop);
                    const status = shop.status || 'active';
                    const owner = typeof shop.ownerId === 'object' ? shop.ownerId : null;
                    return (
                      <motion.tr key={id || i}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedShop(shop)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                              {shop.name?.[0] || '?'}
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">{shop.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">/{shop.slug}</span>
                        </td>
                        <td className="px-5 py-4">
                          {owner ? (
                            <>
                              <p className="font-medium text-slate-900 dark:text-white text-sm">{owner.name || '—'}</p>
                              <p className="text-xs text-slate-500">{owner.email || '—'}</p>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <Package className="w-3.5 h-3.5" />
                            <span className="font-medium">{shop.productsCount ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={status} /></td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Voir">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button onClick={() => handleAction(id, 'status', status === 'suspended' ? 'active' : 'suspended')}
                              title={status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                              className={`p-1.5 rounded-lg transition-colors ${status === 'suspended' ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600'}`}>
                              {status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setConfirmDelete({ id, name: shop.name })} title="Supprimer"
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && shops.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {page} sur {totalPages} · {total} résultats</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminShopsPage;
