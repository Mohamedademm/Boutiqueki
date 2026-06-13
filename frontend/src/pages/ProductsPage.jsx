import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  Edit3,
  Filter,
  Loader2,
  Package,
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  ChevronRight,
  Sparkles,
  Tag,
  Layers,
  TrendingUp,
  X,
} from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { useDeleteProduct, useProducts } from '../hooks/useProducts';

/* ─── helpers ─────────────────────────────────────────────────── */
const statusConfig = {
  active:   { label: 'Actif',      bg: 'bg-emerald-50 dark:bg-emerald-950/40',   text: 'text-emerald-700 dark:text-emerald-400',  dot: 'bg-emerald-500' },
  draft:    { label: 'Brouillon',  bg: 'bg-amber-50 dark:bg-amber-950/40',       text: 'text-amber-700 dark:text-amber-400',      dot: 'bg-amber-500'   },
  archived: { label: 'Archivé',    bg: 'bg-slate-100 dark:bg-slate-800',          text: 'text-slate-500 dark:text-slate-400',      dot: 'bg-slate-400'   },
};

const formatPrice = (v) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 2 }).format(Number(v || 0));

const getStock = (p) =>
  (p.variants || []).reduce((s, v) => s + Number(v.stock_qty || 0), 0);

/* ─── Status badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ─── Product avatar ─────────────────────────────────────────── */
const ProductAvatar = ({ product, size = 'md' }) => {
  const image = product.images?.[0];
  const sz = size === 'lg' ? 'w-20 h-20 rounded-2xl text-2xl' : 'w-12 h-12 rounded-xl text-base';
  if (image) {
    return <img src={image} alt={product.name} className={`${sz} object-cover flex-shrink-0 border border-slate-100 dark:border-slate-800`} />;
  }
  const idx = product.name.charCodeAt(0) % 6;
  const palettes = [
    ['bg-indigo-50 dark:bg-indigo-950/40', 'text-indigo-600'],
    ['bg-purple-50 dark:bg-purple-950/40', 'text-purple-600'],
    ['bg-emerald-50 dark:bg-emerald-950/40', 'text-emerald-600'],
    ['bg-amber-50 dark:bg-amber-950/40', 'text-amber-600'],
    ['bg-sky-50 dark:bg-sky-950/40', 'text-sky-600'],
    ['bg-rose-50 dark:bg-rose-950/40', 'text-rose-600'],
  ];
  const [bg, text] = palettes[idx];
  return (
    <div className={`${sz} ${bg} ${text} flex items-center justify-center font-black flex-shrink-0`}>
      {product.name.charAt(0).toUpperCase()}
    </div>
  );
};

/* ─── Card view ─────────────────────────────────────────────── */
const ProductCard = ({ product, onEdit, onArchive, isArchiving }) => {
  const stock = getStock(product);
  const cfg = statusConfig[product.status] || statusConfig.draft;
  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className={`h-1 w-full ${product.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : product.status === 'draft' ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-slate-200 dark:bg-slate-700'}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <ProductAvatar product={product} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm leading-tight">
              {product.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{product.sku || 'Aucun SKU'}</p>
            {product.category_name && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-full">
                <Tag className="w-2.5 h-2.5" />{product.category_name}
              </span>
            )}
          </div>
          <StatusBadge status={product.status} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Prix</p>
            <p className="font-black text-slate-900 dark:text-white text-sm">{formatPrice(product.price)}</p>
          </div>
          <div className={`rounded-xl p-3 ${stock <= 5 && stock > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : stock === 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Stock</p>
            <p className={`font-black text-sm ${stock === 0 ? 'text-red-600 dark:text-red-400' : stock <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {stock} <span className="text-xs font-normal text-slate-400">({product.variants?.length || 0} var.)</span>
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-auto flex items-center gap-2">
          <button
            onClick={() => onEdit(product.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-xs font-bold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Modifier
          </button>
          <button
            onClick={() => onArchive(product.id)}
            disabled={isArchiving || product.status === 'archived'}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Archiver"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Table row ─────────────────────────────────────────────── */
const ProductRow = ({ product, onEdit, onArchive, isArchiving }) => {
  const stock = getStock(product);
  return (
    <tr className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <ProductAvatar product={product} size="md" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {product.sku && <span className="font-mono">{product.sku}</span>}
              {product.sku && product.category_name && ' · '}
              {product.category_name && <span>{product.category_name}</span>}
              {!product.sku && !product.category_name && 'Aucun détail'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><StatusBadge status={product.status} /></td>
      <td className="px-6 py-4">
        <span className={`font-bold text-sm ${stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
          {stock}
        </span>
        <span className="text-xs text-slate-400 ml-1">({product.variants?.length || 0} var.)</span>
      </td>
      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatPrice(product.price)}</td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Modifier
          </button>
          <button
            onClick={() => onArchive(product.id)}
            disabled={isArchiving || product.status === 'archived'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Archive className="w-3.5 h-3.5" /> Archiver
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ─── Main page ─────────────────────────────────────────────── */
const ProductsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const { data: shop, isLoading: isShopLoading } = useShop();
  const filters = useMemo(() => ({ search, status }), [search, status]);
  const { data: rawProducts = [], isLoading, isError, error } = useProducts(shop?.id, filters);
  const archiveProduct = useDeleteProduct(shop?.id);

  // Support both paginated {data, meta} and plain array responses
  const products = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

  const isBusy = isShopLoading || isLoading;
  const activeCount = products.filter(p => p.status === 'active').length;
  const draftCount  = products.filter(p => p.status === 'draft').length;

  const handleEdit    = (id) => navigate(`/dashboard/products/${id}`);
  const handleArchive = (id) => archiveProduct.mutateAsync(id);

  /* ── No shop ── */
  if (!isShopLoading && !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Package className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Aucune boutique</h1>
        <p className="text-slate-500 mb-6">Créez d'abord votre boutique pour gérer vos produits.</p>
        <button
          onClick={() => navigate('/onboarding')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Créer une boutique
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── Page header ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 60%, #7c3aed 100%)' }}>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-10 bg-white blur-2xl" />
        <div className="absolute right-8 bottom-0 w-32 h-32 rounded-full opacity-10 bg-indigo-300 blur-xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-indigo-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Catalogue
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-1">Produits</h1>
            <p className="text-indigo-200 text-sm">
              {shop?.name} — {products.length} produit{products.length !== 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/products/new')}
            className="group inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all duration-200 shrink-0"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            Nouveau produit
          </button>
        </div>

        {/* Summary pills */}
        <div className="relative z-10 mt-4 flex flex-wrap gap-3">
          {[
            { label: 'Actifs',     count: activeCount, icon: TrendingUp, color: 'bg-emerald-500/20 text-emerald-200' },
            { label: 'Brouillons', count: draftCount,  icon: Layers,     color: 'bg-amber-500/20 text-amber-200' },
            { label: 'Total',      count: products.length, icon: Package, color: 'bg-white/10 text-white' },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className={`inline-flex items-center gap-2 ${color} rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm`}>
              <Icon className="w-3.5 h-3.5" />
              {count} {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Status filter */}
            <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-800">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-transparent outline-none cursor-pointer"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="draft">Brouillons</option>
                <option value="archived">Archivés</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700'}`}
                title="Vue liste"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700'}`}
                title="Vue grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="mt-0.5 w-5 h-5 flex-shrink-0" />
          <span>{error?.response?.data?.message || 'Impossible de charger les produits.'}</span>
        </div>
      )}

      {/* ── Loading ── */}
      {isBusy && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Chargement des produits…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isBusy && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce"
            style={{ animationDuration: '3s' }}>
            <Package className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            {search || status ? 'Aucun résultat' : 'Aucun produit encore'}
          </h3>
          <p className="text-slate-500 max-w-sm mb-6">
            {search || status
              ? 'Essayez de modifier vos filtres de recherche.'
              : `Ajoutez votre premier produit pour démarrer le catalogue de ${shop?.name}.`}
          </p>
          {!search && !status && (
            <button
              onClick={() => navigate('/dashboard/products/new')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" /> Ajouter un produit
            </button>
          )}
        </div>
      )}

      {/* ── Grid view ── */}
      {!isBusy && products.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onArchive={handleArchive}
              isArchiving={archiveProduct.isPending}
            />
          ))}
        </div>
      )}

      {/* ── List view ── */}
      {!isBusy && products.length > 0 && viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {products.map(product => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    isArchiving={archiveProduct.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {/* Table footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400">{products.length} produit{products.length !== 1 ? 's' : ''} affiché{products.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => navigate('/dashboard/products/new')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
