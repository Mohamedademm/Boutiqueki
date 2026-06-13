import { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import {
  Loader2, Users, Store, ShoppingBag, Euro, ShieldAlert,
  TrendingUp, TrendingDown, ArrowUpRight, Building2, Clock,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { Navigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const revenueData = [
  { day: 'Lun', value: 420 }, { day: 'Mar', value: 680 }, { day: 'Mer', value: 540 },
  { day: 'Jeu', value: 890 }, { day: 'Ven', value: 760 }, { day: 'Sam', value: 1120 },
  { day: 'Dim', value: 980 },
];

const registrationsData = [
  { month: 'Jan', users: 12 }, { month: 'Fév', users: 19 }, { month: 'Mar', users: 31 },
  { month: 'Avr', users: 28 }, { month: 'Mai', users: 44 }, { month: 'Jun', users: 52 },
];

const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || value == null) return;
    let frame;
    const start = performance.now();
    const duration = 1200;
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Number((eased * value).toFixed(decimals)));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value, decimals]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, prefix, suffix, decimals, color, trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4"
  >
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend != null && (
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          trend >= 0
            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'
        }`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 dark:text-white">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">
        {payload[0].value.toLocaleString('fr-FR')}
        {payload[0].dataKey === 'value' ? ' €' : ''}
      </p>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    axios.get('/admin/analytics')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 border border-blue-900/40">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShieldAlert className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-black text-white">Administration Globale</h1>
            </div>
            <p className="text-slate-400 text-sm">Supervision complète de la plateforme BoutiqueKi</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard/admin/users"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-semibold rounded-xl hover:bg-blue-600/30 transition-colors"
            >
              <Users className="w-4 h-4" />
              Utilisateurs
            </Link>
            <Link
              to="/dashboard/admin/shops"
              className="flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Boutiques
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard delay={0}    icon={Users}       label="Utilisateurs inscrits"  value={data?.totalUsers}      color="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"     trend={12} />
        <StatCard delay={0.08} icon={Store}       label="Boutiques actives"       value={data?.totalShops}      color="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" trend={8} />
        <StatCard delay={0.16} icon={ShoppingBag} label="Total commandes"         value={data?.totalOrders}     color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" trend={23} />
        <StatCard delay={0.24} icon={Euro}        label="Revenus plateforme"      value={data?.platformRevenue} suffix=" €" decimals={2} color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" trend={15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenus — 7 derniers jours</h3>
              <p className="text-xs text-slate-500 mt-0.5">Commission plateforme collectée</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> +15%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Inscriptions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Nouveaux utilisateurs par mois</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={registrationsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="users" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent shops */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Dernières boutiques créées</h2>
            <p className="text-xs text-slate-500 mt-0.5">Boutiques récemment enregistrées</p>
          </div>
          <Link
            to="/dashboard/admin/shops"
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
          >
            Voir tout <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                {['Boutique', 'URL', 'Propriétaire', 'Créée le'].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data?.recentShops?.map((shop) => (
                <tr key={shop._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {shop.name?.[0] || '?'}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{shop.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">/{shop.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{shop.ownerId?.name}</p>
                    <p className="text-xs text-slate-500">{shop.ownerId?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(shop.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
