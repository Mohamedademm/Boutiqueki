import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import {
  ShoppingBag, Package, Clock, CheckCircle2, XCircle, TrendingUp,
  ChevronDown, ChevronUp, Store, MessageSquareWarning, Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const statusConfig = {
  pending:    { label: 'En attente',  color: 'text-amber-700 bg-amber-50 border-amber-200',   dot: 'bg-amber-400',   icon: Clock },
  processing: { label: 'En cours',    color: 'text-blue-700 bg-blue-50 border-blue-200',       dot: 'bg-blue-400',    icon: Package },
  shipped:    { label: 'Expediee',    color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-400',  icon: TrendingUp },
  delivered:  { label: 'Livree',      color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400', icon: CheckCircle2 },
  cancelled:  { label: 'Annulee',      color: 'text-red-700 bg-red-50 border-red-200',          dot: 'bg-red-400',     icon: XCircle },
};

const SkeletonOrderCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-5 bg-slate-200 rounded w-24" />
          <div className="h-5 bg-slate-100 rounded-full w-20" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-40" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-6 bg-slate-200 rounded w-20 ml-auto" />
        <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
      </div>
    </div>
  </div>
);

const OrderCard = ({ order, index }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const items = order.items?.filter(i => i.productName) || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-black text-slate-900">
              #{String(order.id).slice(0, 8).toUpperCase()}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3" />
              {order.shopName || 'Boutique'}
            </span>
            <span>·</span>
            <span>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-black text-xl text-slate-900">{Number(order.total).toFixed(2)} €</p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 ml-auto transition-colors"
          >
            {expanded ? 'Masquer' : 'Details'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable items + actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 py-4 space-y-3">
              {items.length > 0 ? items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">x{item.quantity}</p>
                    <p className="text-xs text-slate-500">{Number(item.price).toFixed(2)} €</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-2">Details des produits non disponibles</p>
              )}

              {order.customer?.address && (
                <div className="bg-slate-50 rounded-xl p-3 mt-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Adresse de livraison</p>
                  <p className="text-xs text-slate-500">
                    {order.customer.address}, {order.customer.postalCode} {order.customer.city}
                  </p>
                </div>
              )}
            </div>

            {order.status !== 'cancelled' && (
              <div className="border-t border-slate-100 px-5 py-3">
                <Link
                  to={`/client/claims?orderId=${order.id}&shopId=${order.shopId}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <MessageSquareWarning className="w-4 h-4" />
                  Signaler un probleme avec cette commande
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ClientOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/orders/my?page=${page}&limit=${LIMIT}`);
        setOrders(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch {
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [page]);

  const filters = [
    { key: 'all', label: 'Toutes', count: orders.length },
    { key: 'pending', label: 'En attente' },
    { key: 'processing', label: 'En cours' },
    { key: 'delivered', label: 'Livrees' },
    { key: 'cancelled', label: 'Annulees' },
  ];

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !searchQuery ||
      o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900">Mes Commandes</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isLoading ? 'Chargement...' : `${total} commande${total > 1 ? 's' : ''} au total`}
          </p>
        </div>
        {!isLoading && orders.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une commande..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </motion.div>

      {/* Filters */}
      {!isLoading && orders.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonOrderCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-100 p-16 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-blue-300" />
          </div>
          <p className="text-xl font-bold text-slate-800 mb-2">Aucune commande trouvee</p>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            {filter === 'all' ? "Vous n'avez pas encore passe de commande. Explorez nos boutiques !" : "Aucune commande avec ce statut."}
          </p>
          {filter === 'all' && (
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Decouvrir les boutiques
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-slate-500">Page {page} sur {Math.ceil(total / LIMIT)}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold disabled:opacity-40 hover:border-slate-300 transition-colors"
            >
              Precedent
            </button>
            <button
              disabled={page * LIMIT >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold disabled:opacity-40 hover:border-slate-300 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrdersPage;
