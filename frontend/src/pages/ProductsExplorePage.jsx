import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

const ProductsExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const LIMIT = 20;

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  useEffect(() => {
    api.get('/public/categories').then(res => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ page, limit: LIMIT, sort });
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        const res = await api.get(`/public/products?${params}`);
        setProducts(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [search, category, sort, minPrice, maxPrice, page]);

  const activeFilters = [category, minPrice, maxPrice].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Categories</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          <button
            onClick={() => updateParam('category', '')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !category ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Toutes
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => updateParam('category', cat)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                category === cat ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Prix</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="self-center text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Clear filters */}
      {activeFilters > 0 && (
        <button
          onClick={() => {
            const p = new URLSearchParams();
            if (search) p.set('search', search);
            p.set('page', '1');
            setSearchParams(p);
          }}
          className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          {search ? `Resultats pour "${search}"` : category ? category : 'Tous les produits'}
        </h1>
        <p className="text-slate-500">
          {isLoading ? 'Chargement...' : `${total} produit${total !== 1 ? 's' : ''} trouve${total !== 1 ? 's' : ''}`}
        </p>
      </motion.div>

      {/* Search + sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            defaultValue={search}
            onKeyDown={(e) => { if (e.key === 'Enter') updateParam('search', e.target.value); }}
            placeholder="Rechercher un produit..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Plus recents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix decroissant</option>
          <option value="name">Nom (A→Z)</option>
        </select>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
            filtersOpen || activeFilters > 0
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full"
            >
              {category}
              <button onClick={() => updateParam('category', '')} className="hover:text-slate-300"><X className="w-3 h-3" /></button>
            </motion.span>
          )}
          {minPrice && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full"
            >
              Min: {minPrice} €
              <button onClick={() => updateParam('minPrice', '')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
            </motion.span>
          )}
          {maxPrice && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full"
            >
              Max: {maxPrice} €
              <button onClick={() => updateParam('maxPrice', '')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
            </motion.span>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-100 p-5">
            <FilterPanel />
          </div>
        </aside>

        {/* Mobile filter panel */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg text-slate-900">Filtres</h2>
                <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-5 bg-slate-200 rounded w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
              <ShoppingBag className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <p className="font-bold text-slate-700 mb-2">Aucun produit trouve</p>
              <p className="text-sm text-slate-500">Essayez avec d'autres filtres ou termes de recherche.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    shopSlug={product.shopSlug}
                    shopName={product.shopName}
                    shopLogo={product.shopLogo}
                    showShopBadge
                    delay={i * 0.03}
                  />
                ))}
              </div>

              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-between pt-8">
                  <p className="text-sm text-slate-500">{total} produit{total > 1 ? 's' : ''}</p>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => updateParam('page', String(page - 1))}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold disabled:opacity-40 hover:border-slate-300 transition-colors"
                    >
                      Precedent
                    </button>
                    <button
                      disabled={page * LIMIT >= total}
                      onClick={() => updateParam('page', String(page + 1))}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold disabled:opacity-40 hover:border-slate-300 transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsExplorePage;
