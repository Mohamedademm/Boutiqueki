import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/axios';
import {
  Loader2, Package, Search, Clock, CheckCircle2, Truck,
  XCircle, ShoppingBag, TrendingUp, Euro, Filter,
  ChevronDown, Eye, Store,
} from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast, ToastViewport } from '../components/Toast';

const STATUS_CONFIG = {
  pending:    { label: 'En attente',     dot: 'bg-slate-400',  badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', icon: Clock },
  processing: { label: 'En préparation', dot: 'bg-amber-400',  badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: Package },
  shipped:    { label: 'Expédiée',       dot: 'bg-blue-400',   badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: Truck },
  delivered:  { label: 'Livrée',         dot: 'bg-emerald-400',badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
  cancelled:  { label: 'Annulée',        dot: 'bg-red-400',    badge: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const KpiCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-4.5 h-4.5" />
    </div>
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
  </motion.div>
);

const OrdersPage = () => {
  const { data: shop, isLoading: isShopLoading } = useShop();
  const shopId = shop?.id;

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { showToast, toast } = useToast();

  const fetchOrders = useCallback(() => {
    if (!shopId) return;
    setIsLoading(true);
    setError(null);
    api.get(`/shops/${shopId}/orders`)
      .then(res => setOrders(res.data?.data || res.data || []))
      .catch(err => {
        console.error(err);
        setError("Impossible de charger les commandes.");
      })
      .finally(() => setIsLoading(false));
  }, [shopId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await api.put(`/shops/${shopId}/orders/${orderId}/status`, { status: newStatus });
      const updated = res.data?.data || {};
      setOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId) ? { ...o, status: updated.status || newStatus } : o));
      showToast(`Commande mise à jour : ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) {
      console.error(err);
      showToast('Échec de la mise à jour de la commande.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const id = o.id || o._id || '';
      const firstName = o.customerInfo?.firstName || o.customer?.firstName || '';
      const lastName = o.customerInfo?.lastName || o.customer?.lastName || '';
      const email = o.customerInfo?.email || o.customer?.email || '';
      const matchSearch = !search || [id, `${firstName} ${lastName}`, email].some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (Number(o.total) || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  if (isShopLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto mt-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F172A] p-10 text-center">
        <Store className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Boutique requise</h1>
        <p className="mt-2 text-sm text-slate-500">Créez votre boutique pour accéder aux commandes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Ventes</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Commandes</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gérez et suivez toutes les commandes de votre boutique.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard delay={0}    icon={ShoppingBag}  label="Total commandes"  value={orders.length}  color="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <KpiCard delay={0.06} icon={Clock}        label="En attente"       value={pendingCount}   color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <KpiCard delay={0.12} icon={CheckCircle2} label="Livrées"          value={deliveredCount} color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <KpiCard delay={0.18} icon={Euro}         label="Chiffre d'affaires" value={`${totalRevenue.toFixed(2)} €`} color="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={fetchOrders}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors flex-shrink-0">
              Réessayer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par ID, nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['all', 'Toutes'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === val
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="w-14 h-14 mb-4 opacity-30" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">
              {orders.length === 0 ? 'Aucune commande pour le moment' : 'Aucune commande correspond à votre recherche'}
            </p>
            <p className="text-sm mt-1">{orders.length === 0 ? 'Les commandes apparaîtront ici après les premiers achats.' : 'Essayez de modifier vos filtres.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                  {['Commande', 'Date', 'Client', 'Total', 'Paiement', 'Statut', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((order, i) => {
                  const oid = order.id || order._id || '';
                  const firstName = order.customerInfo?.firstName || order.customer?.firstName || '—';
                  const lastName = order.customerInfo?.lastName || order.customer?.lastName || '';
                  const email = order.customerInfo?.email || order.customer?.email || '';
                  const method = order.paymentInfo?.method || order.payment?.method || '';
                  const total = Number(order.total) || 0;

                  return (
                    <motion.tr
                      key={oid}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          #{oid.substring(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{firstName} {lastName}</p>
                        <p className="text-xs text-slate-500">{email}</p>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900 dark:text-white">{total.toFixed(2)} €</td>
                      <td className="px-5 py-4">
                        {method === 'stripe' ? (
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">Stripe</span>
                        ) : method ? (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">Livraison</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-4">
                        {updatingId === oid ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <div className="relative">
                            <select
                              value={order.status || 'pending'}
                              onChange={e => handleStatusChange(oid, e.target.value)}
                              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                            >
                              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                <option key={val} value={val}>{cfg.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastViewport toast={toast} />
    </div>
  );
};

export default OrdersPage;
