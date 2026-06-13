import { useMemo, useState, useRef, useEffect } from 'react';
import {
  AlertTriangle, History, Loader2, PackageCheck, Plus, RefreshCw,
  ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Search,
  TrendingDown, Package, Warehouse, CheckCircle2, ChevronRight,
  ArrowDown, ArrowUp,
} from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { useCreateStockMovement, useStock, useStockAlerts, useStockHistory } from '../hooks/useStock';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Animated counter ──────────────────────────────────────── */
const AnimatedNumber = ({ value }) => {
  const ref = useRef(null);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = displayed;
    const duration = 600;
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + (value - from) * eased));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span ref={ref}>{displayed.toLocaleString('fr-FR')}</span>;
};

/* ─── Stock level mini bar ───────────────────────────────────── */
const StockBar = ({ qty, threshold }) => {
  const max = Math.max(qty, threshold) * 1.5 || 10;
  const pct = Math.min((qty / max) * 100, 100);
  const isLow = qty <= threshold;
  const isCritical = qty <= threshold * 0.5;
  const color = isCritical
    ? 'bg-red-500'
    : isLow
    ? 'bg-amber-400'
    : 'bg-emerald-500';

  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
};

/* ─── Movement type pill button ─────────────────────────────── */
const TypeButton = ({ value, current, onChange, label, icon: Icon, colors }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all duration-200 ${
      current === value
        ? `${colors.active} scale-[1.02] shadow-md`
        : `border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-500 bg-transparent hover:border-slate-300 dark:hover:border-slate-600`
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

/* ─── History item ───────────────────────────────────────────── */
const HistoryItem = ({ item, index }) => {
  const config = {
    in:         { icon: ArrowDown,       label: 'Entrée',      color: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',  dot: 'bg-emerald-500', qtyColor: 'text-emerald-600 dark:text-emerald-400', prefix: '+' },
    out:        { icon: ArrowUp,         label: 'Sortie',      color: 'text-red-500',     bg: 'bg-red-500/10 dark:bg-red-500/10',           dot: 'bg-red-500',     qtyColor: 'text-red-600 dark:text-red-400',         prefix: '-' },
    adjustment: { icon: SlidersHorizontal, label: 'Ajustement', color: 'text-blue-500',    bg: 'bg-blue-500/10 dark:bg-blue-500/10',         dot: 'bg-blue-500',    qtyColor: 'text-blue-600 dark:text-blue-400',       prefix: '=' },
  };
  const c = config[item.type] ?? config.adjustment;
  const { icon: Icon } = c;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
    >
      <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-3.5 h-3.5 ${c.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.variant_name || 'Variante supprimée'}</p>
          </div>
          <span className={`text-sm font-black flex-shrink-0 ${c.qtyColor}`}>
            {c.prefix}{item.quantity}
          </span>
        </div>
        {item.reason && (
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1">
            {item.reason}
          </p>
        )}
        <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-600">
          {new Date(item.created_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
          {item.created_by_name ? ` · ${item.created_by_name}` : ''}
        </p>
      </div>
    </motion.div>
  );
};

/* ─── Main component ─────────────────────────────────────────── */
const StockPage = () => {
  const { data: shop, isLoading: isShopLoading } = useShop();
  const { data: stockRows = [], isLoading: isStockLoading } = useStock(shop?.id);
  const { data: alerts = [] } = useStockAlerts(shop?.id);
  const createMovement = useCreateStockMovement(shop?.id);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [movement, setMovement] = useState({ variant_id: '', type: 'in', quantity: 1, reason: '' });
  const [error, setError] = useState(null);
  const [successFlash, setSuccessFlash] = useState(false);
  const [search, setSearch] = useState('');

  const { data: history = [], isLoading: isHistoryLoading } = useStockHistory(shop?.id, selectedProductId);

  const selectedVariant = useMemo(
    () => stockRows.find(r => r.variant_id === movement.variant_id),
    [movement.variant_id, stockRows]
  );

  const totalStock = stockRows.reduce((sum, r) => sum + Number(r.stock_qty || 0), 0);
  const criticalCount = stockRows.filter(r => Number(r.stock_qty) <= Number(r.alert_threshold) * 0.5).length;
  const isLoading = isShopLoading || isStockLoading;

  const filteredRows = useMemo(() => {
    if (!search.trim()) return stockRows;
    const q = search.toLowerCase();
    return stockRows.filter(r =>
      r.product_name?.toLowerCase().includes(q) ||
      r.variant_name?.toLowerCase().includes(q) ||
      r.variant_sku?.toLowerCase().includes(q)
    );
  }, [stockRows, search]);

  const submitMovement = async (e) => {
    e.preventDefault();
    setError(null);
    if (!movement.variant_id) { setError('Sélectionnez une variante.'); return; }
    try {
      await createMovement.mutateAsync({
        variant_id: movement.variant_id,
        type: movement.type,
        quantity: Number(movement.quantity),
        reason: movement.reason.trim() || null,
      });
      setSelectedProductId(selectedVariant?.product_id || selectedProductId);
      setMovement(c => ({ ...c, quantity: 1, reason: '' }));
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer le mouvement de stock.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto mt-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F172A] p-10 text-center">
        <PackageCheck className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Boutique requise</h1>
        <p className="mt-2 text-sm text-slate-500">Le stock sera disponible après création de votre boutique.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Inventaire</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Stock</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Suivez les variantes, les seuils d'alerte et les mouvements.</p>
        </div>

        {/* KPI Cards */}
        <div className="flex gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 min-w-[110px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <Warehouse className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              <AnimatedNumber value={totalStock} />
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">pièces en stock</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className={`border rounded-2xl px-5 py-3.5 min-w-[110px] ${
              alerts.length > 0
                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${alerts.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${alerts.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                Alertes
              </p>
            </div>
            <p className={`text-2xl font-black ${alerts.length > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
              <AnimatedNumber value={alerts.length} />
            </p>
            <p className={`text-[10px] mt-0.5 ${alerts.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>stock bas</p>
          </motion.div>

          {criticalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-2xl px-5 py-3.5 min-w-[110px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">Critique</p>
              </div>
              <p className="text-2xl font-black text-red-800 dark:text-red-300">
                <AnimatedNumber value={criticalCount} />
              </p>
              <p className="text-[10px] text-red-500 mt-0.5">très bas</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success flash ── */}
      <AnimatePresence>
        {successFlash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Mouvement enregistré avec succès !
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">

        {/* ── Stock table ── */}
        <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Vue stock</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cliquez sur une ligne pour consulter son historique.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher produit, SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all w-full sm:w-52"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <tr>
                  {['Produit', 'Variante', 'SKU', 'Stock', 'Seuil', 'Niveau', 'Statut'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRows.map((row, i) => {
                  const qty = Number(row.stock_qty);
                  const threshold = Number(row.alert_threshold);
                  const isLow = qty <= threshold;
                  const isCritical = qty <= threshold * 0.5;
                  const isSelected = movement.variant_id === row.variant_id;

                  return (
                    <motion.tr
                      key={row.variant_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        setSelectedProductId(row.product_id);
                        setMovement(c => ({ ...c, variant_id: row.variant_id }));
                      }}
                      className={`cursor-pointer transition-all duration-150 group ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-500/8'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {isSelected && <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                          <span className={`font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                            {row.product_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{row.variant_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {row.variant_sku || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-lg font-black ${
                          isCritical ? 'text-red-600 dark:text-red-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {qty}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{threshold}</td>
                      <td className="px-5 py-3.5 w-24">
                        <StockBar qty={qty} threshold={threshold} />
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 block">
                          {threshold > 0 ? `${Math.round((qty / (threshold * 2)) * 100)}%` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3" /> Critique
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="w-3 h-3" /> Stock bas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> OK
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center">
                      <Package className="mx-auto w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {search ? 'Aucun résultat pour cette recherche' : 'Aucune variante en stock.'}
                      </p>
                      {!search && (
                        <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Ajoutez des produits avec variantes pour commencer.</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Right column ── */}
        <aside className="space-y-5">

          {/* Movement form */}
          <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Mouvement de stock</h2>
            </div>

            {/* Selected variant preview */}
            <AnimatePresence>
              {selectedVariant && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3">
                    <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mb-0.5">Variante sélectionnée</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-200">{selectedVariant.product_name} · {selectedVariant.variant_name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Stock actuel : <strong>{selectedVariant.stock_qty}</strong> · Seuil : {selectedVariant.alert_threshold}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submitMovement} className="space-y-4">
              {/* Variante select */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Variante</label>
                <select
                  value={movement.variant_id}
                  onChange={e => {
                    const v = stockRows.find(r => r.variant_id === e.target.value);
                    setMovement(c => ({ ...c, variant_id: e.target.value }));
                    setSelectedProductId(v?.product_id || null);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Sélectionner une variante...</option>
                  {stockRows.map(r => (
                    <option key={r.variant_id} value={r.variant_id}>
                      {r.product_name} — {r.variant_name} (stock: {r.stock_qty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type toggle */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type de mouvement</label>
                <div className="flex gap-2">
                  <TypeButton
                    value="in"
                    current={movement.type}
                    onChange={t => setMovement(c => ({ ...c, type: t }))}
                    label="Entrée"
                    icon={ArrowDownCircle}
                    colors={{ active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' }}
                  />
                  <TypeButton
                    value="out"
                    current={movement.type}
                    onChange={t => setMovement(c => ({ ...c, type: t }))}
                    label="Sortie"
                    icon={ArrowUpCircle}
                    colors={{ active: 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' }}
                  />
                  <TypeButton
                    value="adjustment"
                    current={movement.type}
                    onChange={t => setMovement(c => ({ ...c, type: t }))}
                    label="Ajustement"
                    icon={SlidersHorizontal}
                    colors={{ active: 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' }}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {movement.type === 'adjustment' ? 'Nouvelle quantité' : 'Quantité'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={movement.quantity}
                  onChange={e => setMovement(c => ({ ...c, quantity: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Raison <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  rows={2}
                  value={movement.reason}
                  onChange={e => setMovement(c => ({ ...c, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                  placeholder="Réception fournisseur, casse, inventaire..."
                />
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={createMovement.isPending}
                className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  movement.type === 'in'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20'
                    : movement.type === 'out'
                    ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                }`}
              >
                {createMovement.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {movement.type === 'in'
                      ? <ArrowDownCircle className="w-4 h-4" />
                      : movement.type === 'out'
                      ? <ArrowUpCircle className="w-4 h-4" />
                      : <SlidersHorizontal className="w-4 h-4" />
                    }
                    {movement.type === 'in' ? 'Enregistrer l\'entrée' : movement.type === 'out' ? 'Enregistrer la sortie' : 'Appliquer l\'ajustement'}
                  </>
                )}
              </motion.button>
            </form>
          </section>

          {/* History panel */}
          <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Historique</h2>
                {selectedVariant && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 truncate max-w-[200px]">
                    {selectedVariant.product_name} · {selectedVariant.variant_name}
                  </p>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {!selectedProductId && (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <History className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sélectionnez une variante</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">pour voir son historique de mouvements</p>
                </div>
              )}

              {selectedProductId && isHistoryLoading && (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Chargement...</span>
                </div>
              )}

              {selectedProductId && !isHistoryLoading && history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <Package className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucun mouvement</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Cette variante n'a pas encore d'historique.</p>
                </div>
              )}

              <AnimatePresence>
                {selectedProductId && !isHistoryLoading &&
                  history.map((item, i) => (
                    <HistoryItem key={item.id} item={item} index={i} />
                  ))
                }
              </AnimatePresence>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default StockPage;
