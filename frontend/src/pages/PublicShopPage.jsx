import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ShoppingBag, Search } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import CartDrawer from '../components/CartDrawer';
import { ensureGoogleFont } from '../utils/fonts';
import { setSEO } from '../utils/seo';

const api = axios.create({
  baseURL: '/api',
});

const PublicShopPage = () => {
  const { slug } = useParams();
  const [shopData, setShopData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const { openCart, getCartCount } = useCartStore();

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

  // Load the shop's chosen Google Font so the storefront renders with it
  useEffect(() => {
    ensureGoogleFont(shopData?.shop?.theme?.font);
    if (shopData?.shop) {
      const s = shopData.shop;
      setSEO({
        title: `${s.name} — Boutique en ligne`,
        description: s.description || `Découvrez les produits de ${s.name} sur BoutiqueKi.`,
        image: s.logo_url || s.banner_url,
      });
    }
  }, [shopData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !shopData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Oops !</h1>
        <p className="text-slate-600 mb-8">{error}</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Retour à BoutiqueKi
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
      return 0; // newest — keep server order
    });

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
          className={`text-2xl font-black ${theme.template === 'Bold' ? 'text-white' : ''}`}
          style={{ color: theme.template !== 'Bold' ? theme.primaryColor : '' }}
        >
          {shop.name}
        </Link>
        <div className="flex items-center gap-6">
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
        </div>
      </header>

      {/* Hero Section */}
      <div 
        className="py-24 px-6 md:px-12 text-center relative overflow-hidden"
        style={{ 
          backgroundColor: theme.template === 'Luxe' ? '#0f172a' : theme.primaryColor + '08' 
        }}
      >
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 
            className="text-5xl md:text-6xl font-black mb-6 leading-tight"
            style={{ 
              color: theme.template === 'Luxe' ? '#f8fafc' : theme.primaryColor
            }}
          >
            {shop.name}
          </h1>
          <p 
            className="text-lg md:text-xl mb-10"
            style={{ 
              color: theme.template === 'Luxe' ? '#cbd5e1' : '#64748b'
            }}
          >
            {shop.description || "Découvrez notre collection exclusive de produits."}
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="flex-1 py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <h2 className="text-3xl font-bold text-slate-800">Notre Collection</h2>
          {products.length > 0 && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="name">Nom (A→Z)</option>
              </select>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Bientôt disponible</h3>
            <p className="text-slate-500">Cette boutique n'a pas encore ajouté de produits.</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Aucun résultat</h3>
            <p className="text-slate-500">Aucun produit ne correspond à « {search} ».</p>
          </div>
        ) : (
          <div
            className={`grid gap-8 ${
              theme.layout === 'grid-2' ? 'grid-cols-1 sm:grid-cols-2' :
              theme.layout === 'grid-4' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
              theme.layout === 'list' ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {displayed.map(product => (
              <Link 
                to={`/s/${slug}/p/${product.id}`} 
                key={product.id} 
                className={`group flex ${theme.layout === 'list' ? 'flex-row gap-6 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md' : 'flex-col'}`}
              >
                <div 
                  className={`bg-slate-100 rounded-2xl overflow-hidden relative ${
                    theme.layout === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-square mb-4'
                  }`}
                >
                  {product.images && product.images[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  {product.comparePrice > product.price && (
                    <div 
                      className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: theme.secondaryColor }}
                    >
                      Promo
                    </div>
                  )}
                </div>
                <div className={theme.layout === 'list' ? 'flex-1' : ''}>
                  <div className="text-sm text-slate-500 mb-1">{product.category}</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span 
                      className="font-bold text-xl"
                      style={{ color: theme.primaryColor }}
                    >
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
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 text-center border-t border-slate-200 mt-auto">
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

export default PublicShopPage;
