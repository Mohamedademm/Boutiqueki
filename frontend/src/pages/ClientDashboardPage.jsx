import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import axios from '../utils/axios';
import {
  ShoppingBag, MessageSquareWarning, Package, TrendingUp,
  ArrowRight, Store, Clock, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig = {
  pending:    { label: 'En attente',   color: 'text-amber-600 bg-amber-50',  icon: Clock },
  processing: { label: 'En cours',     color: 'text-blue-600 bg-blue-50',    icon: Package },
  shipped:    { label: 'Expédiée',     color: 'text-purple-600 bg-purple-50', icon: TrendingUp },
  delivered:  { label: 'Livrée',       color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  cancelled:  { label: 'Annulée',      color: 'text-red-600 bg-red-50',      icon: XCircle },
};

const StatCard = ({ icon: Icon, label, value, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient}`}
  >
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
    <div className="relative z-10">
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-white/70 text-sm font-medium">{label}</p>
    </div>
  </motion.div>
);

const ClientDashboardPage = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, claimsRes] = await Promise.all([
          axios.get('/orders/my?limit=3'),
          axios.get('/claims/my'),
        ]);
        setOrders(ordersRes.data.data || []);
        setClaims(claimsRes.data.data || []);
      } catch {
        // silently fail - empty state shown
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const openClaims = claims.filter(c => c.status === 'open' || c.status === 'in_progress').length;

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d2b1a 100%)' }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-emerald-300 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Espace client
          </div>
          <h1 className="text-3xl font-black mb-2">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-white/60 max-w-md">
            Suivez vos commandes, gérez vos réclamations et explorez toutes nos boutiques.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-all"
          >
            <Store className="w-4 h-4" />
            Explorer les boutiques
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Commandes" value={orders.length} gradient="bg-gradient-to-br from-blue-600 to-indigo-700" delay={0} />
        <StatCard icon={Package} label="En cours" value={orders.filter(o => o.status === 'processing' || o.status === 'shipped').length} gradient="bg-gradient-to-br from-emerald-500 to-teal-700" delay={0.08} />
        <StatCard icon={CheckCircle2} label="Livrées" value={orders.filter(o => o.status === 'delivered').length} gradient="bg-gradient-to-br from-violet-600 to-purple-700" delay={0.16} />
        <StatCard icon={MessageSquareWarning} label="Réclamations" value={openClaims} gradient={openClaims > 0 ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-slate-600 to-slate-700"} delay={0.24} />
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Dernières commandes</h2>
          <Link to="/client/orders" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="font-semibold text-slate-700 mb-2">Aucune commande pour l'instant</p>
            <p className="text-sm text-slate-500 mb-6">Explorez nos boutiques et passez votre première commande.</p>
            <Link to="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
              Decouvrir les boutiques
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{order.shopName} · {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-slate-900">{Number(order.total).toFixed(2)} €</p>
                    <Link to="/client/orders" className="text-xs text-emerald-600 font-semibold hover:underline">Détails</Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/client/claims"
            className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <MessageSquareWarning className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Faire une réclamation</p>
              <p className="text-sm text-slate-500">Signaler un problème avec une commande</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 ml-auto transition-colors" />
          </Link>

          <Link
            to="/explore"
            className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Explorer les boutiques</p>
              <p className="text-sm text-slate-500">Découvrir de nouveaux produits</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 ml-auto transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
