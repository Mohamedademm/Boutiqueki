import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Loader2, ShoppingBag, Plus, Minus, Star, ChevronRight, Heart,
  Shield, Truck, RotateCcw, CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import { setSEO, setJsonLd, productJsonLd } from '../utils/seo';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const trustItems = [
  { icon: Shield, label: 'Paiement securise' },
  { icon: Truck, label: 'Livraison rapide' },
  { icon: RotateCcw, label: 'Retours faciles' },
];

const PublicProductPage = () => {
  const { slug, id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const [productRes, reviewsRes] = await Promise.all([
          api.get(`/public/products/${id}`),
          api.get(`/public/products/${id}/reviews`)
        ]);
        setData(productRes.data.data);
        setReviews(reviewsRes.data.data);
      } catch {
        setError("Produit introuvable.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const variants = data?.product?.variants || [];
    if (variants.length > 0 && !selectedVariantId) {
      const firstInStock = variants.find(v => v.stock_qty > 0) || variants[0];
      setSelectedVariantId(firstInStock.id);
    }
    if (data?.product) {
      const p = data.product;
      setSEO({
        title: `${p.name} — ${data.shop?.name || 'BoutiqueKi'}`,
        description: p.description || `Achetez ${p.name} en ligne.`,
        image: p.images?.[0],
      });
      setJsonLd('product', productJsonLd(p, data.shop?.name));
    }
    return () => setJsonLd('product', null);
  }, [data, selectedVariantId]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-8 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-4" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2">
            <div className="aspect-square bg-slate-200 rounded-3xl animate-pulse" />
          </div>
          <div className="lg:w-1/2 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-10 bg-slate-200 rounded w-1/3" />
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded w-full mt-4" />
            <div className="h-12 bg-slate-200 rounded w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Produit introuvable</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">{error}</p>
        <Link to={`/s/${slug}`} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
          Retour a la boutique
        </Link>
      </div>
    );
  }

  const { product, shop } = data;
  const theme = shop.theme || {};

  const variants = product.variants || [];
  const selectedVariant = variants.find(v => v.id === selectedVariantId) || null;
  const availableStock = selectedVariant ? selectedVariant.stock_qty : product.stock ?? 0;

  const handleAddToCart = () => {
    if (availableStock <= 0) return;
    const vName = selectedVariant?.name;
    addItem(
      product,
      quantity,
      vName ? { Variante: vName } : {},
      selectedVariant?.id || null
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;
    try {
      setIsSubmittingReview(true);
      const res = await api.post(`/public/products/${id}/reviews`, newReview);
      setReviews([res.data.data, ...reviews]);
      setNewReview({ name: '', rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length
    : 0;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const discountPercent = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div style={{ fontFamily: theme.font || 'Inter' }}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/explore" className="hover:text-slate-800 transition-colors">Explorer</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link to={`/s/${slug}`} className="hover:text-slate-800 transition-colors">{shop.name}</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-400 truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-1/2"
          >
            <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden aspect-square relative mb-4 group">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-20 h-20 opacity-20" />
                </div>
              )}
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-rose-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg shadow-rose-500/30">
                  -{discountPercent}%
                </div>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWishlisted(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  aria-pressed={isWishlisted(product.id)}
                  className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                </button>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === idx ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-1/2 flex flex-col"
          >
            {/* Shop badge */}
            <Link
              to={`/s/${slug}`}
              className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 mb-4 transition-colors w-fit bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                {shop.logo_url ? (
                  <img src={shop.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-3 h-3 text-slate-400" />
                )}
              </div>
              {shop.name}
            </Link>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'fill-current' : 'text-slate-200 fill-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({reviews.length} avis)</span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {product.price.toFixed(2)} €
              </span>
              {product.comparePrice > product.price && (
                <span className="text-xl text-slate-400 line-through mb-0.5">
                  {product.comparePrice.toFixed(2)} €
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg mb-0.5">
                  Economisez {(product.comparePrice - product.price).toFixed(2)} €
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {variants.length > 1 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                  Variante
                </h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={v.stock_qty <= 0}
                      className={`px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedVariantId === v.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {v.name}{v.stock_qty <= 0 ? ' (epuise)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <div className="flex items-center border-2 border-slate-200 dark:border-slate-700 rounded-xl h-13 w-full sm:w-36 bg-white dark:bg-slate-900 flex-shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Diminuer la quantité"
                  className="w-12 h-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-bold text-slate-900 dark:text-slate-100 text-lg" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Augmenter la quantité"
                  className="w-12 h-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={availableStock <= 0 || addedToCart}
                className={`flex-1 h-13 rounded-xl font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${
                  addedToCart
                    ? 'bg-emerald-500 shadow-emerald-500/25'
                    : availableStock <= 0
                      ? 'bg-slate-400 opacity-50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {addedToCart ? (
                  <><CheckCircle2 className="w-5 h-5" /> Ajoute au panier !</>
                ) : availableStock > 0 ? (
                  <><ShoppingBag className="w-5 h-5" /> Ajouter au panier</>
                ) : (
                  'Rupture de stock'
                )}
              </button>
            </div>

            {availableStock > 0 && availableStock <= 5 && (
              <p className="text-amber-600 text-sm font-medium mt-3">
                Plus que {availableStock} en stock !
              </p>
            )}

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <item.icon className="w-4 h-4 text-emerald-500" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-700">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-8"
        >
          Avis clients ({reviews.length})
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Add Review Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-fit shadow-sm"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Laissez un avis</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Votre nom</label>
                <input
                  type="text"
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({...newReview, rating: star})}
                      className={`p-1 transition-transform hover:scale-110 ${star <= newReview.rating ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Commentaire</label>
                <textarea
                  required
                  rows="4"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm"
              >
                {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Publier l'avis"}
              </button>
            </form>
          </motion.div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-7 h-7 text-amber-300" />
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">Aucun avis pour l'instant</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Soyez le premier a donner votre avis !</p>
              </div>
            ) : (
              reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {review.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{review.name}</p>
                        <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-current' : 'text-slate-200 fill-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{review.comment}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProductPage;
