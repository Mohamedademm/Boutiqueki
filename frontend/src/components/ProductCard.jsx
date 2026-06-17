import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({
  product,
  shopSlug,
  shopName,
  shopLogo,
  showShopBadge = false,
  isWishlisted = false,
  onWishlistToggle,
  delay = 0,
}) => {
  const hasPromo = product.comparePrice > product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Wishlist button */}
      {onWishlistToggle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishlistToggle(product.id);
          }}
          aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isWishlisted}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart
            className={`w-4.5 h-4.5 transition-colors ${
              isWishlisted
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          />
        </button>
      )}

      <Link to={`/s/${shopSlug}/p/${product.id}`}>
        {/* Image */}
        <div className="aspect-square bg-slate-100 overflow-hidden relative">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
              <ShoppingBag className="w-12 h-12 opacity-30" />
            </div>
          )}
          {hasPromo && (
            <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category && (
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
              {product.category}
            </p>
          )}
          <h3 className="font-bold text-slate-800 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-lg text-slate-900">
              {Number(product.price).toFixed(2)} €
            </span>
            {hasPromo && (
              <span className="text-sm text-slate-400 line-through">
                {Number(product.comparePrice).toFixed(2)} €
              </span>
            )}
          </div>

          {/* Shop badge */}
          {showShopBadge && shopName && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              {shopLogo ? (
                <img src={shopLogo} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                  <ShoppingBag className="w-3 h-3 text-slate-400" />
                </div>
              )}
              <span className="text-xs font-medium text-slate-500 truncate">{shopName}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
