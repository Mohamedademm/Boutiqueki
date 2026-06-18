import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Search, Store, ChevronRight, MapPin, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { ensureGoogleFont } from '../utils/fonts';
import { setSEO, setJsonLd } from '../utils/seo';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const SkeletonProductCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
    <div className="aspect-square bg-slate-200" />
    <div className="p-4 space-y-2">
      <div className="h-3 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
      <div className="h-5 bg-slate-200 rounded w-1/4 mt-2" />
    </div>
  </div>
);

const PublicShopPage = () => {
  const { slug } = useParams();
  const [shopData, setShopData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const fetchShop = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/public/shops/${slug}`);
        setShopData(res.data.data);
      } catch {
        setError("Boutique introuvable ou indisponible.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, [slug]);

  useEffect(() => {
    ensureGoogleFont(shopData?.shop?.theme?.font);
    if (shopData?.shop) {
      const s = shopData.shop;
      setSEO({
        title: `${s.name} — Boutique en ligne`,
        description: s.description || `Decouvrez les produits de ${s.name} sur BoutiqueKi.`,
        image: s.logo_url || s.banner_url,
      });
      setJsonLd('shop', {
        '@context': 'https://schema.org/',
        '@type': 'Store',
        name: s.name,
        description: s.description || undefined,
        image: s.logo_url || s.banner_url || undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      });
    }
    return () => setJsonLd('shop', null);
  }, [shopData]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        {/* Skeleton hero */}
        <div className="animate-pulse py-4 flex items-center gap-2 mb-4">
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-4" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
        <div className="h-48 md:h-64 bg-slate-200 rounded-3xl mb-8" />
        <div className="flex items-end gap-5 mb-10 -mt-12 relative z-10 px-2">
          <div className="w-24 h-24 rounded-2xl bg-slate-300 border-4 border-white" />
          <div className="space-y-2 pb-1">
            <div className="h-7 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-10">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonProductCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !shopData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Oops !</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">{error}</p>
        <Link to="/explore" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
          Retour a l'exploration
        </Link>
      </div>
    );
  }

  const { shop, products = [] } = shopData;
  const theme = {
    template: 'Minimal',
    primaryColor: '#1E3A5F',
    secondaryColor: '#2563EB',
    font: 'Inter',
    layout: 'grid-3',
    ...(shop.theme || {}),
  };

  const displayed = products
    .filter(p => !search || (p.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  return (
    <div style={{ fontFamily: theme.font || 'Inter' }}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/explore" className="hover:text-slate-800 transition-colors">Explorer</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link to="/boutiques" className="hover:text-slate-800 transition-colors">Boutiques</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-800 dark:text-slate-100 font-medium">{shop.name}</span>
      </div>

      {/* Shop Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
      >
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-slate-100 to-slate-200 relative mx-6 rounded-3xl overflow-hidden">
          {shop.banner_url ? (
            <img src={shop.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Shop info */}
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative -mt-14 flex flex-col sm:flex-row items-start sm:items-end gap-5 mb-8"
          >
            <div className="w-28 h-28 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border-4 border-white flex items-center justify-center overflow-hidden flex-shrink-0">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Store className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <div className="pb-2 flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 mb-1">{shop.name}</h1>
              {shop.description && (
                <p className="text-slate-500 dark:text-slate-400 max-w-xl mb-3">{shop.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{products.length}</span> produit{products.length !== 1 ? 's' : ''}
                </span>
                {shop.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {shop.city}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Catalogue
          </h2>
          {products.length > 0 && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Plus recents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
                <option value="name">Nom (A→Z)</option>
              </select>
            </div>
          )}
        </motion.div>

        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Bientot disponible</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">Cette boutique n'a pas encore ajoute de produits.</p>
            <Link to="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
              Explorer d'autres boutiques
            </Link>
          </motion.div>
        ) : displayed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Aucun resultat</h3>
            <p className="text-slate-500 dark:text-slate-400">Aucun produit ne correspond a « {search} ».</p>
          </motion.div>
        ) : (
          <div
            className={`grid gap-6 ${
              theme.layout === 'grid-2' ? 'grid-cols-1 sm:grid-cols-2' :
              theme.layout === 'grid-4' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
              theme.layout === 'list' ? 'grid-cols-1' :
              'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {displayed.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/s/${slug}/p/${product.id}`}
                  className={`group flex ${theme.layout === 'list' ? 'flex-row gap-6 items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md' : 'flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300'}`}
                >
                  <div
                    className={`bg-slate-100 dark:bg-slate-800 overflow-hidden relative ${
                      theme.layout === 'list' ? 'w-48 h-48 flex-shrink-0 rounded-xl' : 'aspect-square'
                    }`}
                  >
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <ShoppingBag className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    {product.comparePrice > product.price && (
                      <div
                        className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: theme.secondaryColor }}
                      >
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className={theme.layout === 'list' ? 'flex-1' : 'p-4'}>
                    {product.category && (
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{product.category}</div>
                    )}
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-lg" style={{ color: theme.primaryColor }}>
                        {product.price.toFixed(2)} €
                      </span>
                      {product.comparePrice > product.price && (
                        <span className="text-slate-400 line-through text-sm">
                          {product.comparePrice.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicShopPage;
