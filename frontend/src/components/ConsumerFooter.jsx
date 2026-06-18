import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Send, Globe, MessageCircle, Share2, CreditCard, CheckCircle2 } from 'lucide-react';

const ConsumerFooter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="mt-auto">
      {/* Newsletter */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-black text-white mb-1">Restez informes</h3>
              <p className="text-slate-400 text-sm">Recevez les meilleures offres et nouveautes directement dans votre boite mail.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="flex-1 md:w-72 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
                S'abonner
              </button>
            </form>
          </div>
          {subscribed && (
            <div className="mt-4 flex items-center justify-center md:justify-end gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Merci pour votre inscription !
            </div>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/explore" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Store className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-black text-lg text-slate-900 dark:text-slate-100">BoutiqueKi</span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                La marketplace qui connecte les meilleures boutiques avec leurs clients.
              </p>
              <div className="flex gap-2">
                <a href="#" aria-label="Notre site web" className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Nous contacter" className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-pink-100 flex items-center justify-center text-slate-400 hover:text-pink-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Partager" className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-colors">
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Explorer */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4">Explorer</h4>
              <ul className="space-y-2.5">
                <li><Link to="/explore" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Accueil</Link></li>
                <li><Link to="/boutiques" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Toutes les boutiques</Link></li>
                <li><Link to="/explore/products" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Tous les produits</Link></li>
              </ul>
            </div>

            {/* Mon compte */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4">Mon compte</h4>
              <ul className="space-y-2.5">
                <li><Link to="/client/orders" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Mes commandes</Link></li>
                <li><Link to="/client/claims" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Mes reclamations</Link></li>
                <li><Link to="/client/wishlist" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Mes favoris</Link></li>
                <li><Link to="/client/profile" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Mon profil</Link></li>
              </ul>
            </div>

            {/* Vendeurs */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4">Vendeurs</h4>
              <ul className="space-y-2.5">
                <li><Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Ouvrir ma boutique</Link></li>
                <li><Link to="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Connexion vendeur</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-100 dark:border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} BoutiqueKi. Tous droits reserves.</p>

            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {['Visa', 'Mastercard', 'PayPal'].map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400">
                    <CreditCard className="w-3 h-3" />
                    {m}
                  </span>
                ))}
              </div>
              <span className="hidden sm:inline text-slate-200">|</span>
              <div className="flex gap-5 text-xs text-slate-400">
                <a href="#" className="hover:text-slate-600 transition-colors">Confidentialite</a>
                <a href="#" className="hover:text-slate-600 transition-colors">Conditions</a>
                <a href="#" className="hover:text-slate-600 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ConsumerFooter;
