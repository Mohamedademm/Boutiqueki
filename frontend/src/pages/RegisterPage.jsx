import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Store, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import GoogleAuthButton from '../components/GoogleAuthButton';

const RoleCard = ({ role, title, description, icon: Icon, gradient, selected, onSelect }) => (
  <motion.button
    type="button"
    onClick={() => onSelect(role)}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`relative w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
      selected
        ? 'border-transparent shadow-lg shadow-blue-500/20'
        : 'border-slate-200 hover:border-slate-300 bg-white'
    }`}
    style={selected ? { background: 'white', borderColor: 'transparent' } : {}}
  >
    {selected && (
      <div className={`absolute inset-0 rounded-2xl ${gradient} opacity-[0.08]`} />
    )}
    <div className="relative z-10 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${selected ? gradient : 'bg-slate-100'}`}>
        <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base mb-1 ${selected ? 'text-slate-900' : 'text-slate-700'}`}>{title}</p>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
      {selected && (
        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      )}
    </div>
    {selected && (
      <motion.div
        layoutId="role-underline"
        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl ${gradient}`}
      />
    )}
  </motion.button>
);

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
  });

  const { register, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect based on role stored in auth store
      const user = useAuthStore.getState().user;
      if (user?.role === 'client') {
        navigate('/explore');
      } else {
        navigate('/onboarding');
      }
    }
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden py-12">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] right-[20%] w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl z-10 border border-white"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Store className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Créer un compte</h1>
          <p className="text-slate-500 mt-2">Bienvenue sur BoutiqueKi !</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Je veux… <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <RoleCard
                role="client"
                title="Faire mes achats"
                description="Je suis acheteur et je veux parcourir et commander des produits."
                icon={ShoppingBag}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                selected={formData.role === 'client'}
                onSelect={(r) => setFormData({ ...formData, role: r })}
              />
              <RoleCard
                role="owner"
                title="Créer ma boutique"
                description="Je suis vendeur et je veux ouvrir ma boutique en ligne."
                icon={Store}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                selected={formData.role === 'owner'}
                onSelect={(r) => setFormData({ ...formData, role: r })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="name"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Jean Dupont"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                name="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="text-sm text-slate-500 pt-2">
            En vous inscrivant, vous acceptez nos{' '}
            <a href="#" className="text-blue-600 hover:underline">Conditions d'utilisation</a>{' '}
            et notre{' '}
            <a href="#" className="text-blue-600 hover:underline">Politique de confidentialité</a>.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed group mt-4"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Créer mon compte
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">ou</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google sign-up */}
        <GoogleAuthButton redirectTo={formData.role === 'client' ? '/explore' : '/onboarding'} text="signup_with" />

        <p className="mt-8 text-center text-sm text-slate-500">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
