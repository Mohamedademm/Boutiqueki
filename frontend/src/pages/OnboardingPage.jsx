import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Store, Palette, Globe, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/axios';

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const OnboardingPage = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shopData, setShopData] = useState({
    name: '',
    slug: '',
    description: '',
    theme: {
      template: 'Minimal',
      primaryColor: '#1E3A5F',
      secondaryColor: '#2563EB',
    }
  });

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleNameChange = (name) => {
    setShopData((current) => ({
      ...current,
      name,
      slug: current.slug ? current.slug : slugify(name),
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/shops', {
        name: shopData.name.trim(),
        slug: slugify(shopData.slug || shopData.name),
        description: shopData.description.trim(),
        logo_url: '',
        banner_url: '',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création de la boutique");
      setIsLoading(false);
    }
  };

  const slideVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">BoutiqueKi</span>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Étape {step} sur 3
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-16 px-4">
        {/* Progress bar */}
        <div className="w-full max-w-2xl mb-12 flex items-center">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white'}`}>
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold mt-2">Identité</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white'}`}>
              <Palette className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold mt-2">Design</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold mt-2">Finalisation</span>
          </div>
        </div>

        {error && (
          <div className="w-full max-w-2xl mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Donnez un nom à votre boutique</h2>
                  <p className="text-slate-500 mt-1">C'est la première chose que vos clients verront.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la boutique</label>
                  <input
                    type="text"
                    required
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                    placeholder="Ex: Ma Super Boutique"
                    value={shopData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL de la boutique</label>
                  <div className="flex rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                    <span className="flex items-center border-r border-slate-200 px-4 text-sm text-slate-500">boutiki.com/</span>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-r-xl px-4 py-3 text-lg outline-none"
                      placeholder="ma-boutique"
                      value={shopData.slug}
                      onChange={(e) => setShopData({ ...shopData, slug: slugify(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Courte description</label>
                  <textarea
                    rows={3}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Vendez du rêve en quelques mots..."
                    value={shopData.description}
                    onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Choisissez votre style</h2>
                  <p className="text-slate-500 mt-1">Vous pourrez modifier ces paramètres plus tard dans l'éditeur visuel.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Thème de base</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Minimal', 'Bold', 'Artisan', 'Luxe'].map((t) => (
                      <div 
                        key={t}
                        onClick={() => setShopData({ ...shopData, theme: { ...shopData.theme, template: t } })}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${shopData.theme.template === t ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="font-semibold text-slate-800 mb-1">{t}</div>
                        <div className="text-xs text-slate-500">Design parfait pour commencer.</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Tout est prêt, {user?.name} !</h2>
                <p className="text-slate-500 text-lg max-w-md mx-auto">
                  Votre boutique <strong>{shopData.name || "Ma Boutique"}</strong> est sur le point d'être créée avec le design <strong>{shopData.theme.template}</strong>.
                </p>
                <p className="text-slate-500 mt-4">Cliquez sur terminer pour accéder à votre tableau de bord et ajouter vos premiers produits.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              onClick={handleBack}
              disabled={step === 1 || isLoading}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && !shopData.name.trim()}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Création...' : 'Créer ma boutique'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
