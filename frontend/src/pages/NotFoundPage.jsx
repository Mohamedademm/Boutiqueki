import { Link } from 'react-router-dom';
import { Home, Compass, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center max-w-md"
    >
      <p className="text-[7rem] leading-none font-black bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent select-none">
        404
      </p>
      <h1 className="text-2xl font-black text-slate-900 mt-2 mb-2">Page introuvable</h1>
      <p className="text-slate-500 mb-8">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/explore"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
        >
          <Compass className="w-4 h-4" /> Explorer les boutiques
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" /> Accueil
        </Link>
      </div>
      <button
        onClick={() => window.history.back()}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Revenir en arrière
      </button>
    </motion.div>
  </div>
);

export default NotFoundPage;
