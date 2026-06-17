import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';

const CartDrawer = ({ theme = {} }) => {
  const navigate = useNavigate();
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    getCartTotal
  } = useCartStore();

  if (!isOpen) return null;

  const total = getCartTotal();

  const handleCheckout = () => {
    closeCart();
    navigate(`/checkout`); // We'll need to pass shop info or handle checkout
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-[101] flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Votre Panier
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-4">
              <ShoppingBag className="w-16 h-16 text-slate-200" />
              <p>Votre panier est vide.</p>
              <button 
                onClick={closeCart}
                className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-full hover:bg-slate-200 transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.images && item.images[0] ? (
                    <img src={item.images[0]} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-slate-400 hover:text-red-500 p-1 -mr-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Variants */}
                  {Object.keys(item.selectedVariants).length > 0 && (
                    <div className="text-xs text-slate-500 mb-2 flex gap-2">
                      {Object.entries(item.selectedVariants).map(([key, value]) => (
                        <span key={key} className="bg-slate-100 px-2 py-0.5 rounded-md">
                          {value}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div className="font-bold" style={{ color: theme?.primaryColor || '#2563EB' }}>
                      {item.price.toFixed(2)} €
                    </div>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button 
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-slate-800">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-medium">Sous-total</span>
              <span className="text-2xl font-black text-slate-900">{total.toFixed(2)} €</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Les frais de port et taxes seront calculés à l'étape suivante.
            </p>
            <button 
              onClick={handleCheckout}
              className="w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transform transition hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: theme?.primaryColor || '#2563EB' }}
            >
              Commander
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </>
  );
};

export default CartDrawer;
