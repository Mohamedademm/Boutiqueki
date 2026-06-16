import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Store, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ShopCard from '../components/ShopCard';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

const SkeletonShopCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="h-32 bg-slate-200" />
    <div className="p-5 pt-9 space-y-3">
      <div className="h-5 bg-slate-200 rounded w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
  </div>
);

const BoutiquesDirectoryPage = () => {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ page, limit: LIMIT, sort });
        if (search) params.set('search', search);
        const res = await api.get(`/public/shops?${params}`);
        setShops(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch {
        setShops([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [page, sort, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-8 md:p-10 mb-10"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/15 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-blue-300 text-xs font-semibold mb-4">
            <Store className="w-3.5 h-3.5" />
            Annuaire des boutiques
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Toutes les boutiques</h1>
          <p className="text-slate-400 mb-6 max-w-lg">Decouvrez toutes les boutiques presentes sur BoutiqueKi et trouvez vos produits preferes.</p>

          {/* Search inside hero */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher une boutique..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              />
            </form>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
            >
              <option value="newest" className="text-slate-900">Plus recentes</option>
              <option value="name" className="text-slate-900">Nom (A→Z)</option>
              <option value="products" className="text-slate-900">Plus de produits</option>
            </select>
          </div>
        </div>
      </motion.section>

      {/* Result count */}
      {!isLoading && shops.length > 0 && (
        <p className="text-sm text-slate-500 mb-6">{total} boutique{total > 1 ? 's' : ''} trouvee{total > 1 ? 's' : ''}</p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonShopCard key={i} />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-100 p-16 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-blue-300" />
          </div>
          <p className="text-xl font-bold text-slate-800 mb-2">Aucune boutique trouvee</p>
          <p className="text-sm text-slate-500 mb-6">
            {search ? `Aucune boutique ne correspond a "${search}".` : 'Aucune boutique disponible pour le moment.'}
          </p>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Revenir a l'accueil
          </a>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop, i) => (
            <ShopCard key={shop.id} shop={shop} delay={i * 0.05} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between pt-8">
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

export default BoutiquesDirectoryPage;
