import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ShoppingBag, ArrowLeft, Plus, Minus, Star, ChevronRight } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import CartDrawer from '../components/CartDrawer';
import { setSEO } from '../utils/seo';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

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
  const { addItem, openCart, getCartCount } = useCartStore();

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

  // Default-select the first in-stock variant once the product loads + set SEO tags
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
    }
  }, [data, selectedVariantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Produit introuvable</h1>
        <p className="text-slate-600 mb-8">{error}</p>
        <Link to={`/s/${slug}`} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Retour à la boutique
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
      alert('Erreur lors de l\'ajout de l\'avis.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length 
    : 0;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ fontFamily: theme.font || 'Inter', backgroundColor: theme.template === 'Minimal' ? '#f8fafc' : '#ffffff' }}
    >
      {/* Header */}
      <header 
        className="py-6 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 transition-colors"
        style={{ 
          backgroundColor: theme.template === 'Bold' ? theme.primaryColor : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: theme.template !== 'Bold' ? 'blur(10px)' : 'none',
          borderBottom: theme.template !== 'Bold' ? '1px solid #f1f5f9' : 'none'
        }}
      >
        <Link 
          to={`/s/${slug}`} 
          className={`text-2xl font-black flex items-center gap-2 ${theme.template === 'Bold' ? 'text-white' : ''}`}
          style={{ color: theme.template !== 'Bold' ? theme.primaryColor : '' }}
        >
          <ArrowLeft className="w-5 h-5" />
          {shop.name}
        </Link>
        <button 
          onClick={openCart}
          className={`relative p-2 rounded-full ${theme.template === 'Bold' ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ShoppingBag className="w-6 h-6" />
          {getCartCount() > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {getCartCount()}
            </span>
          )}
        </button>
      </header>

      {/* Breadcrumb */}
      <div className="px-6 md:px-12 py-4 flex items-center text-sm text-slate-500">
        <Link to={`/s/${slug}`} className="hover:text-slate-800 transition-colors">Accueil</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-800 font-medium">{product.category}</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-400 truncate">{product.name}</span>
      </div>

      {/* Product Details Section */}
      <div className="flex-1 py-8 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Images */}
          <div className="lg:w-1/2">
            <div className="bg-slate-100 rounded-3xl overflow-hidden aspect-square relative mb-4">
              {product.images && product.images[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-20 h-20 opacity-20" />
                </div>
              )}
              {product.comparePrice > product.price && (
                <div 
                  className="absolute top-6 left-6 text-white text-sm font-bold px-4 py-1.5 rounded-full"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  Promo
                </div>
              )}
            </div>
            
            {/* Thumbnails placeholder if more than 1 image */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button key={idx} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-blue-500 transition-colors">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            {/* Reviews summary */}
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'fill-current' : 'text-slate-200 fill-slate-200'}`} 
                  />
                ))}
              </div>
              <span className="text-slate-500">
                ({reviews.length} avis)
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-end gap-4 mb-8">
              <span 
                className="text-3xl font-bold"
                style={{ color: theme.primaryColor }}
              >
                {product.price.toFixed(2)} €
              </span>
              {product.comparePrice > product.price && (
                <span className="text-xl text-slate-400 line-through mb-1">
                  {product.comparePrice.toFixed(2)} €
                </span>
              )}
            </div>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              {product.description}
            </p>

            {/* Variants (flat: each variant is a selectable option) */}
            {variants.length > 1 && (
              <div className="mb-10">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Variante
                </h3>
                <div className="flex flex-wrap gap-3">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={v.stock_qty <= 0}
                      className={`px-4 py-2 border rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedVariantId === v.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {v.name}{v.stock_qty <= 0 ? ' (épuisé)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <div className="flex items-center border-2 border-slate-200 rounded-2xl h-14 w-full sm:w-32 bg-white flex-shrink-0">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center text-slate-500 hover:text-slate-900"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-bold text-slate-900">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-full flex items-center justify-center text-slate-500 hover:text-slate-900"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={availableStock <= 0}
                className="flex-1 h-14 rounded-2xl font-bold text-lg text-white shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <ShoppingBag className="w-5 h-5" />
                {availableStock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
              </button>
            </div>

            {availableStock > 0 && availableStock <= 5 && (
              <p className="text-amber-600 text-sm font-medium mt-4">
                Plus que {availableStock} en stock !
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 w-full border-t border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-10">Avis clients</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Add Review Form */}
          <div className="lg:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Laissez un avis</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Votre nom</label>
                <input 
                  type="text" 
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({...newReview, rating: star})}
                      className={`p-1 ${star <= newReview.rating ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
                <textarea 
                  required
                  rows="4"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmittingReview}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Publier l\'avis'}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Soyez le premier à donner votre avis sur ce produit !
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-slate-800">{review.name}</div>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-slate-200 fill-slate-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600">{review.comment}</p>
                  <div className="text-xs text-slate-400 mt-4">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 text-center border-t border-slate-200 mt-20">
        <p className="text-slate-500 mb-4">&copy; {new Date().getFullYear()} {shop.name}. Tous droits réservés.</p>
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
          Propulsé par <Link to="/" className="font-bold text-blue-600 hover:underline">BoutiqueKi</Link>
        </p>
      </footer>
      
      {/* Cart Drawer */}
      <CartDrawer theme={theme} />
    </div>
  );
};

export default PublicProductPage;
