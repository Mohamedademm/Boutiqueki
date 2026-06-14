import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import { ChevronRight, CreditCard, ShoppingBag, Truck, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getCartTotal, shopId, clearCart } = useCartStore();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    paymentMethod: 'cash_on_delivery'
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      navigate('/');
    }
  }, [items, navigate, orderComplete]);

  const subtotal = getCartTotal();
  const shippingFee = subtotal >= 50 ? 0 : 5;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg(null);
    try {
      const res = await api.post('/public/coupons/validate', { shopId, code: couponCode.trim(), subtotal });
      setDiscount(res.data.data.discount);
      setCouponMsg({ type: 'ok', text: `Code appliqué : -${res.data.data.discount.toFixed(2)} €` });
    } catch (err) {
      setDiscount(0);
      setCouponMsg({ type: 'err', text: err.response?.data?.message || 'Code invalide' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmitOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const payload = {
        shopId,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country
        },
        items: items.map(item => ({
          productId: item.id,
          variantId: item.variantId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.selectedVariants || {}
        })),
        paymentMethod: formData.paymentMethod,
        couponCode: discount > 0 ? couponCode.trim() : null
      };

      const res = await api.post('/checkout', payload);
      setOrderData(res.data.data);
      setOrderComplete(true);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur s'est produite lors de la commande.");
    } finally {
      setIsLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Merci pour votre commande !</h1>
          <p className="text-slate-500 mb-6">
            Votre commande numéro <strong className="text-slate-800">#{orderData?.id?.substring(0, 8).toUpperCase()}</strong> a bien été enregistrée. Un email de confirmation vous sera envoyé à {formData.email}.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl mb-8 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Total payé</span>
              <span className="font-bold text-slate-800">{orderData?.total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Méthode</span>
              <span className="font-bold text-slate-800">
                {formData.paymentMethod === 'cash_on_delivery' ? 'Paiement à la livraison' : 'Carte bancaire'}
              </span>
            </div>
          </div>
          <Link to="/" className="inline-block w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-slate-800">BoutiqueKi</Link>
        <div className="flex items-center text-sm font-medium text-slate-500">
          <span className={step >= 1 ? 'text-blue-600' : ''}>Livraison</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className={step >= 2 ? 'text-blue-600' : ''}>Paiement</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 flex flex-col lg:flex-row gap-12">
        {/* Left Form */}
        <div className="flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in slide-in-from-left-4">
              {/* Contact Info */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                  Informations de contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                    <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                  Adresse de livraison
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                    <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="123 rue de la Paix" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                    <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
                    <input type="text" name="postalCode" required value={formData.postalCode} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                Continuer vers le paiement
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
                    Paiement
                  </h2>
                  <button onClick={() => setStep(1)} className="text-sm text-blue-600 font-medium hover:underline">Modifier l'adresse</button>
                </div>
                
                <div className="space-y-4">
                  {/* Mock Payment Options */}
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === 'stripe' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="paymentMethod" value="stripe" checked={formData.paymentMethod === 'stripe'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <CreditCard className="w-6 h-6 ml-4 mr-3 text-slate-600" />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">Carte Bancaire (Stripe)</span>
                      <span className="text-xs text-slate-500">Paiement sécurisé. Non disponible en mode démo.</span>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === 'cash_on_delivery' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="paymentMethod" value="cash_on_delivery" checked={formData.paymentMethod === 'cash_on_delivery'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <Truck className="w-6 h-6 ml-4 mr-3 text-slate-600" />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">Paiement à la livraison</span>
                      <span className="text-xs text-slate-500">Payez en espèces lorsque vous recevez le colis.</span>
                    </div>
                  </label>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={handleSubmitOrder}
                    disabled={isLoading}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Payer {total.toFixed(2)} €
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center">
                    <Lock className="w-3 h-3 mr-1" /> Vos données sont cryptées et sécurisées.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Résumé de la commande</h2>
            
            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                    )}
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-slate-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</h3>
                    {Object.values(item.selectedVariants).length > 0 && (
                      <p className="text-xs text-slate-500">{Object.values(item.selectedVariants).join(', ')}</p>
                    )}
                    <p className="text-sm font-bold mt-1 text-slate-800">{(item.price * item.quantity).toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="border-t border-slate-100 pt-4 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Code promo"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applyingCoupon}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  {applyingCoupon ? '…' : 'Appliquer'}
                </button>
              </div>
              {couponMsg && (
                <p className={`mt-2 text-xs font-medium ${couponMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Réduction</span>
                  <span>−{discount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Livraison</span>
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-medium">Gratuite</span>
                ) : (
                  <span>{shippingFee.toFixed(2)} €</span>
                )}
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between items-end mt-4">
                <span className="text-lg font-bold text-slate-800">Total</span>
                <span className="text-3xl font-black text-slate-900">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
