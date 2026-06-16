import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, ArrowRight, Sparkles, TrendingUp, Store, Tag, Loader2,
  Shield, Truck, CreditCard, Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
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

const SkeletonProductCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-slate-200" />
    <div className="p-4 space-y-2">
      <div className="h-3 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
      <div className="h-5 bg-slate-200 rounded w-1/4 mt-2" />
    </div>
  </div>
);

const trustBadges = [
  { icon: Shield, label: 'Paiement securise', desc: 'Transactions 100% protegees' },
  { icon: Truck, label: 'Livraison rapide', desc: 'Offerte des 50€ d\'achat' },
  { icon: Star, label: 'Qualite garantie', desc: 'Boutiques verifiees' },
  { icon: CreditCard, label: 'Retours faciles', desc: 'Satisfait ou rembourse' },
];

const ExplorePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopsRes, productsRes, catsRes] = await Promise.all([
          api.get('/public/shops?limit=6&sort=newest'),
          api.get('/public/products?limit=8&sort=newest'),
          api.get('/public/categories'),
        ]);
        setShops(shopsRes.data.data || []);
        setProducts(productsRes.data.data || []);
        setCategories(catsRes.data.data || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/explore/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-300 text-xs font-semibold mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Decouvrez les meilleures boutiques
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
              Trouvez les produits <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                qui vous correspondent
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
              Explorez des centaines de boutiques et des milliers de produits uniques, selectionnes pour vous.
            </p>

            <form onSubmit={handleSearch} className="max-w-lg mx-auto relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit, une boutique..."
                className="w-full pl-14 pr-32 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Rechercher
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Trust badges bar */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <badge.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{badge.label}</p>
                  <p className="text-xs text-slate-500">{badge.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="max-w-7xl mx-auto px-6">
          <div className="py-16">
            <div className="h-6 bg-slate-200 rounded w-48 mb-8 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonShopCard key={i} />)}
            </div>
          </div>
          <div className="py-16">
            <div className="h-6 bg-slate-200 rounded w-48 mb-8 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Featured Boutiques */}
          {shops.length > 0 && (
            <section className="max-w-7xl mx-auto px-6 py-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">
                    <Store className="w-4 h-4" /> Boutiques en vedette
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Boutiques populaires</h2>
                </div>
                <Link
                  to="/boutiques"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  Voir toutes <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop, i) => (
                  <ShopCard key={shop.id} shop={shop} delay={i * 0.06} />
                ))}
              </div>
              <div className="sm:hidden mt-6 text-center">
                <Link to="/boutiques" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                  Voir toutes les boutiques <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <section className="bg-gradient-to-br from-slate-50 to-white border-y border-slate-100 py-14">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-widest mb-3">
                    <Tag className="w-4 h-4" /> Parcourir par categorie
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Trouvez ce que vous cherchez</h2>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/explore/products?category=${encodeURIComponent(cat)}`}
                        className="group inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                      >
                        {cat}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Trending Products */}
          {products.length > 0 && (
            <section className="max-w-7xl mx-auto px-6 py-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-2">
                    <TrendingUp className="w-4 h-4" /> Nouveautes
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Produits recents</h2>
                </div>
                <Link
                  to="/explore/products"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  Voir tous <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    shopSlug={product.shopSlug}
                    shopName={product.shopName}
                    shopLogo={product.shopLogo}
                    showShopBadge
                    delay={i * 0.05}
                  />
                ))}
              </div>
              <div className="sm:hidden mt-6 text-center">
                <Link to="/explore/products" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                  Voir tous les produits <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          {/* CTA for shop owners */}
          <section className="relative overflow-hidden py-20 px-6">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-0 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-300 text-xs font-semibold mb-6 backdrop-blur-sm">
                <Store className="w-3.5 h-3.5" />
                Espace vendeurs
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Vous avez une boutique ?</h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Rejoignez BoutiqueKi et vendez vos produits a des milliers de clients. Inscription gratuite, commencez a vendre en quelques minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
                >
                  Creer ma boutique <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/boutiques"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Voir les boutiques
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ExplorePage;
