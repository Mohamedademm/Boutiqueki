import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Loader2, TrendingUp, ShoppingBag, Euro, Trophy, Store } from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { useShopAnalytics } from '../hooks/useStats';

const PERIODS = [{ v: 7, l: '7 j' }, { v: 30, l: '30 j' }, { v: 90, l: '90 j' }];
const STATUS_COLORS = { pending: '#94a3b8', processing: '#f59e0b', shipped: '#3b82f6', delivered: '#10b981', cancelled: '#ef4444' };
const STATUS_LABELS = { pending: 'En attente', processing: 'En préparation', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };

const Kpi = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon className="w-5 h-5" /></div>
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
    <h2 className="font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
    {children}
  </div>
);

const AnalyticsPage = () => {
  const { data: shop, isLoading: shopLoading } = useShop();
  const [period, setPeriod] = useState(30);
  const { data, isLoading } = useShopAnalytics(shop?.id, period);

  if (shopLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!shop) return <Navigate to="/dashboard" />;

  const fmtEur = (n) => `${Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const series = (data?.series || []).map(d => ({ ...d, label: d.date.slice(5) }));
  const byStatus = (data?.byStatus || []).map(s => ({ name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || '#94a3b8' }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Performance</p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Analytics</h1>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${period === p.v ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400'}`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Kpi icon={Euro} label={`Chiffre d'affaires (${period}j)`} value={fmtEur(data?.revenue)} color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" />
            <Kpi icon={ShoppingBag} label="Commandes" value={data?.orders ?? 0} color="bg-blue-50 dark:bg-blue-500/10 text-blue-600" />
            <Kpi icon={TrendingUp} label="Panier moyen" value={fmtEur(data?.avgOrderValue)} color="bg-purple-50 dark:bg-purple-500/10 text-purple-600" />
          </div>

          <Card title="Chiffre d'affaires">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip formatter={(v) => fmtEur(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Meilleures ventes">
              {(!data?.bestSellers || data.bestSellers.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Trophy className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">Aucune vente sur la période</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.bestSellers} layout="vertical" margin={{ left: 20, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip formatter={(v, n) => n === 'units' ? `${v} u.` : fmtEur(v)} />
                    <Bar dataKey="units" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Répartition des commandes">
              {byStatus.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Store className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">Aucune commande</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name} (${e.value})`}>
                      {byStatus.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
