import { Link } from 'react-router-dom';
import { Store, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopCard = ({ shop, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Link
        to={`/s/${shop.slug}`}
        className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      >
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
          {shop.bannerUrl ? (
            <img
              src={shop.bannerUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10" />
          )}
          {/* Logo overlay */}
          <div className="absolute -bottom-6 left-5">
            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-9 pb-5 px-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 group-hover:text-blue-600 transition-colors">
            {shop.name}
          </h3>
          {shop.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
              {shop.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Package className="w-3.5 h-3.5" />
              {shop.productCount} produit{shop.productCount !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Voir <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ShopCard;
