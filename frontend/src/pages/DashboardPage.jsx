import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Package,
  Plus,
  Store,
  Warehouse,
  TrendingUp,
  ShoppingBag,
  Zap,
  Star,
  ChevronRight,
  Activity,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { useProducts } from '../hooks/useProducts';
import { useStockAlerts } from '../hooks/useStock';
import { useShopStats } from '../hooks/useStats';
import useAuthStore from '../store/useAuthStore';

/* ─── Animated counter ─────────────────────────────────────────── */
const useCountUp = (target, duration = 1400) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

/* ─── Sparkline mini-chart ─────────────────────────────────────── */
const Sparkline = ({ data, color = '#6366f1' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.12" />
    </svg>
  );
};

/* ─── Stat card with 3D hover + counter ───────────────────────── */
const StatCard = ({ title, value, icon: Icon, gradient, sparkData, trend, prefix = '', suffix = '' }) => {
  const count = useCountUp(typeof value === 'number' ? value : 0);
  const [hovered, setHovered] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 12;
    const y = -(e.clientX - rect.left - rect.width / 2) / 12;
    setRotate({ x, y });
  };
  const handleMouseLeave = () => { setRotate({ x: 0, y: 0 }); setHovered(false); };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(600px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${hovered ? 1.03 : 1})`,
        transition: 'transform 0.15s ease',
      }}
      className="relative overflow-hidden rounded-2xl p-6 cursor-default"
    >
      {/* Glass background */}
      <div className={`absolute inset-0 ${gradient} opacity-90`} />
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />

      {/* Decorative orb */}
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -right-2 -bottom-4 w-20 h-20 rounded-full bg-white/5 blur-lg" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          {sparkData && <Sparkline data={sparkData} color="rgba(255,255,255,0.8)" />}
        </div>

        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-white tabular-nums">
            {prefix}{typeof value === 'number' ? count : value}{suffix}
          </span>
          {trend && (
            <span className="mb-1 text-xs font-bold text-white/80 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />{trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Activity bar chart ─────────────────────────────────────── */
const ActivityBar = ({ day, val, maxVal }) => {
  const [h, setH] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setH(val), 100);
    return () => clearTimeout(t);
  }, [val]);
  const pct = maxVal > 0 ? (h / maxVal) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <div className="relative w-7 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" style={{ height: 80 }}>
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000 ease-out bg-gradient-to-t from-indigo-600 to-purple-500"
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-400 uppercase">{day}</span>
    </div>
  );
};

/* ─── 3D Floating shop illustration ─────────────────────────── */
const ShopIllustration = () => (
  <div className="relative w-48 h-48 mx-auto">
    <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
      <div className="absolute inset-2 rounded-full border-2 border-dashed border-indigo-200/60" />
    </div>
    <div className="absolute inset-0 animate-[spin_14s_linear_infinite_reverse]">
      <div className="absolute inset-6 rounded-full border-2 border-dashed border-purple-200/40" />
    </div>
    {/* Central icon with 3D float */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl animate-[bounce_4s_ease-in-out_infinite]"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 25px 50px -12px rgba(99,102,241,0.4)' }}
      >
        <Store className="w-12 h-12 text-white drop-shadow-lg" />
      </div>
    </div>
    {/* Orbiting dots */}
    {[0, 120, 240].map((deg, i) => (
      <div key={i} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)`, animation: `spin ${6 + i}s linear infinite` }}>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg" />
      </div>
    ))}
  </div>
);

/* ─── No-shop empty state ────────────────────────────────────── */
const EmptyState = ({ userName, onNavigate }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
    <div className="max-w-lg w-full text-center">
      <ShopIllustration />
      <div className="mt-8 space-y-3">
        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full px-4 py-1.5 text-sm font-semibold">
          <Sparkles className="w-4 h-4" />
          Bienvenue sur BoutiqueKi
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Bonjour, {userName || 'Admin'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
          Votre compte est prêt. Créez votre boutique en ligne en quelques clics et commencez à vendre !
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="mt-8 group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-indigo-500/30 transition-all duration-200 hover:scale-105 hover:shadow-indigo-500/50"
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
        Créer ma boutique
        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1 duration-200" />
      </button>

      {/* Feature bullets */}
      <div className="mt-10 grid grid-cols-3 gap-4 text-left">
        {[
          { icon: Package, label: 'Catalogue Produits', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
          { icon: Warehouse, label: 'Gestion des Stocks', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
          { icon: ShoppingBag, label: 'Suivi Commandes', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Main Dashboard ─────────────────────────────────────────── */
// Fallback day labels used only until real order stats load.
const weekDays = [
  { day: 'Lun' }, { day: 'Mar' }, { day: 'Mer' },
  { day: 'Jeu' }, { day: 'Ven' }, { day: 'Sam' }, { day: 'Dim' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: shop, isLoading: isShopLoading } = useShop();
  const { data: products = [], isLoading: isProductsLoading } = useProducts(shop?.id);
  const { data: alerts = [], isLoading: isAlertsLoading } = useStockAlerts(shop?.id);
  const { data: stats } = useShopStats(shop?.id);

  const isLoading = isShopLoading || isProductsLoading || isAlertsLoading;

  // Real weekly orders activity (falls back to empty bars before data loads)
  const dayFr = { Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu', Fri: 'Ven', Sat: 'Sam', Sun: 'Dim' };
  const ordersByDay = stats?.ordersByDay?.length
    ? stats.ordersByDay.map(d => ({ day: dayFr[d.day] || d.day, val: d.count }))
    : weekDays.map(d => ({ day: d.day, val: 0 }));
  const weekOrdersTotal = ordersByDay.reduce((s, d) => s + d.val, 0);
  const maxOrdersBar = Math.max(1, ...ordersByDay.map(d => d.val));

  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalStock = products.reduce((sum, p) =>
    sum + (p.variants || []).reduce((s, v) => s + Number(v.stock_qty || 0), 0), 0);

  const completionPct = products.length > 0
    ? Math.min(100, Math.round((activeProducts / products.length) * 100))
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return <EmptyState userName={user?.name} onNavigate={() => navigate('/onboarding')} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%)' }}>

        {/* Decorative background blobs */}
        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full opacity-10 blur-2xl"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-indigo-200 text-xs font-semibold mb-4">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Boutique en ligne
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-indigo-200 text-base max-w-md">
              Votre boutique <span className="text-white font-bold">{shop.name}</span> est active. Voici un aperçu de votre activité aujourd'hui.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/dashboard/products/new"
              className="group inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-white/30 hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
              Nouveau produit
            </Link>
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all duration-200"
            >
              Personnaliser
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-200 mb-1.5">
            <span>Catalogue actif</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full transition-all duration-1000"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Produits Total"
          value={products.length}
          icon={Package}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
          sparkData={[2, 4, 3, 6, 5, 8, products.length || 8]}
          trend="+12%"
        />
        <StatCard
          title="Produits Actifs"
          value={activeProducts}
          icon={Zap}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          sparkData={[1, 3, 2, 5, 4, 6, activeProducts || 6]}
          trend="+8%"
        />
        <StatCard
          title="Pièces en Stock"
          value={totalStock}
          icon={Warehouse}
          gradient="bg-gradient-to-br from-violet-600 to-purple-800"
          sparkData={[80, 120, 95, 150, 130, 170, totalStock || 150]}
          trend="+5%"
        />
        <StatCard
          title="Alertes Stock"
          value={alerts.length}
          icon={AlertTriangle}
          gradient={alerts.length > 0 ? "bg-gradient-to-br from-amber-500 to-orange-700" : "bg-gradient-to-br from-slate-600 to-slate-800"}
          sparkData={[0, 1, 0, 2, 1, 0, alerts.length]}
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

        {/* Left — Recent products */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Derniers Produits
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Les ajouts récents à votre catalogue</p>
              </div>
              <Link to="/dashboard/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {products.slice(0, 6).map((product, idx) => (
                <Link
                  key={product.id}
                  to={`/dashboard/products/${product.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  {/* Product avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-base shadow-sm"
                    style={{
                      background: `hsl(${(idx * 47) % 360} 70% 94%)`,
                      color: `hsl(${(idx * 47) % 360} 60% 40%)`,
                    }}>
                    {product.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{product.sku || 'Aucun SKU'}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      product.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : product.status === 'draft'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {product.status === 'active' ? 'Actif' : product.status === 'draft' ? 'Brouillon' : product.status}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600 font-black text-lg group-hover:text-indigo-500 transition-colors">
                      {product.price ? `${Number(product.price).toFixed(0)} DT` : '—'}
                    </span>
                  </div>
                </Link>
              ))}

              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                    <Package className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Aucun produit</p>
                    <p className="text-sm text-slate-500 mt-1">Commencez par ajouter votre premier produit.</p>
                  </div>
                  <Link
                    to="/dashboard/products/new"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un produit
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Activity chart */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Activité de la semaine
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Commandes reçues ces 7 derniers jours</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{weekOrdersTotal}</p>
                <p className="text-xs text-slate-500 font-semibold">commande{weekOrdersTotal > 1 ? 's' : ''} cette semaine</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              {ordersByDay.map(({ day, val }, idx) => (
                <ActivityBar key={`${day}-${idx}`} day={day} val={val} maxVal={maxOrdersBar} />
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Shop info card */}
          <section className="rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 text-white relative"
              style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black mb-1">{shop.name}</h3>
                <p className="text-indigo-200 text-sm font-mono">/{shop.slug}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-0 rounded-b-2xl">
              <a
                href={`/s/${shop.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Voir ma boutique</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
              </a>
            </div>
          </section>

          {/* Stock alerts */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${alerts.length > 0 ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'}`}>
                <AlertTriangle className={`w-5 h-5 ${alerts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Alertes Stock</h2>
                <p className="text-xs text-slate-500">Variantes sous le seuil d'alerte</p>
              </div>
              {alerts.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {alerts.slice(0, 6).map((alert) => {
                const pct = alert.alert_threshold > 0
                  ? Math.round((alert.stock_qty / alert.alert_threshold) * 100)
                  : 0;
                return (
                  <div key={alert.variant_id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{alert.product_name}</p>
                        <p className="text-xs text-slate-500">{alert.variant_name}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
                        {alert.stock_qty}/{alert.alert_threshold}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {alerts.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-2">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Tout est en ordre !</p>
                  <p className="text-xs text-slate-400">Aucune alerte de stock pour le moment.</p>
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Link to="/dashboard/stock" className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors">
                  Gérer le stock <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ajouter Produit', icon: Plus, href: '/dashboard/products/new', color: 'from-indigo-500 to-indigo-700' },
                { label: 'Voir Stock', icon: Warehouse, href: '/dashboard/stock', color: 'from-purple-500 to-purple-700' },
                { label: 'Commandes', icon: ShoppingBag, href: '/dashboard/orders', color: 'from-emerald-500 to-teal-700' },
                { label: 'Personnaliser', icon: TrendingUp, href: '/builder', color: 'from-amber-500 to-orange-600' },
              ].map(({ label, icon: Icon, href, color }) => (
                <Link
                  key={label}
                  to={href}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-4 text-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200`}
                >
                  <Icon className="w-6 h-6 mb-2 drop-shadow" />
                  <p className="text-xs font-bold leading-tight">{label}</p>
                  <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full blur-lg" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
