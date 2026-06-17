import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import useWishlistStore from '../store/useWishlistStore';
import ProductCard from '../components/ProductCard';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-slate-200" />
    <div className="p-4 space-y-2">
      <div className="h-3 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
      <div className="h-5 bg-slate-200 rounded w-1/4 mt-2" />
    </div>
  </div>
);

const WishlistPage = () => {
  const { items, isLoaded, loadWishlist, toggleWishlist, isWishlisted } = useWishlistStore();
  const [isLoading, setIsLoading] = useState(!isLoaded);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const load = async () => {
      await loadWishlist();
      setIsLoading(false);
    };
    load();
  }, [loadWishlist]);

  const activeItems = items.filter(item => item.productStatus === 'active');

  const handleClearAll = async () => {
    setClearing(true);
    for (const item of items) {
      await toggleWishlist(item.productId);
    }
    setClearing(false);
  };

  return (
    <div>
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 rounded-3xl p-8 mb-10 border border-rose-100"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Mes favoris</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {isLoading
                  ? 'Chargement...'
                  : activeItems.length > 0
                    ? `${activeItems.length} article${activeItems.length > 1 ? 's' : ''} sauvegarde${activeItems.length > 1 ? 's' : ''}`
                    : 'Retrouvez ici vos produits preferes'}
              </p>
            </div>
          </div>
          {activeItems.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Tout supprimer
            </button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-100 p-16 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-rose-300" />
          </div>
          <p className="text-xl font-bold text-slate-800 mb-2">Aucun favori pour l'instant</p>
          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            Explorez nos boutiques et ajoutez des produits a vos favoris en cliquant sur le coeur.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Explorer les boutiques
            </Link>
            <Link
              to="/explore/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Voir les nouveautes
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          {activeItems.map((item, i) => (
            <ProductCard
              key={item.productId}
              product={{
                id: item.productId,
                name: item.name,
                price: item.price,
                comparePrice: item.comparePrice,
                images: item.images,
                category: null,
              }}
              shopSlug={item.shopSlug}
              shopName={item.shopName}
              shopLogo={item.shopLogo}
              showShopBadge
              isWishlisted={isWishlisted(item.productId)}
              onWishlistToggle={toggleWishlist}
              delay={i * 0.04}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default WishlistPage;
