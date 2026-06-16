import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShoppingBag, Store, Globe, Zap, Palette, Lock, Star, TrendingUp, Users, Package } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';

const Counter = ({ end, suffix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let frame;
    const start = performance.now();
    const duration = 1800;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isInView, end]);

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>;
};

const FloatingCard = ({ children, className, delay = 0 }) => (
  <motion.div
    animate={{ y: [0, -12, 0] }}
    transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden cursor-default transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
  >
    <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="relative text-base font-bold text-white mb-2">{title}</h3>
    <p className="relative text-slate-400 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const PricingCard = ({ title, price, features, isPopular, cta }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -4 }}
    className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
      isPopular
        ? 'border border-blue-500/40 bg-gradient-to-b from-blue-950/70 to-slate-900/70 shadow-2xl shadow-blue-500/15 scale-105 z-10'
        : 'border border-white/10 bg-white/[0.04]'
    }`}
  >
    {isPopular && (
      <>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
          Le Plus Populaire
        </div>
      </>
    )}
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <div className="mb-6">
      <span className="text-5xl font-black text-white">{price}€</span>
      <span className="text-slate-400 ml-1 text-sm">/mois</span>
    </div>
    <ul className="space-y-3 mb-8 flex-1">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="text-slate-300 text-sm">{f}</span>
        </li>
      ))}
    </ul>
    <Link
      to="/register"
      className={`w-full py-3 px-6 rounded-xl text-center font-bold transition-all text-sm ${
        isPopular
          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]'
          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
      }`}
    >
      {cta}
    </Link>
  </motion.div>
);

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: Palette, title: 'Éditeur Visuel No-Code', description: 'Personnalisez chaque aspect de votre boutique avec notre éditeur en direct. Thèmes premium, couleurs, typographies.', gradient: 'from-purple-600 to-pink-600', delay: 0 },
    { icon: ShoppingBag, title: 'Gestion de Catalogue', description: 'Ajoutez des produits, variantes, gérez votre stock en temps réel et créez des catégories sans effort.', gradient: 'from-blue-600 to-cyan-600', delay: 0.1 },
    { icon: Lock, title: 'Paiements Sécurisés', description: "Intégration native avec Stripe. Acceptez les cartes en toute sécurité avec un tunnel d'achat optimisé.", gradient: 'from-emerald-600 to-teal-600', delay: 0.2 },
    { icon: Globe, title: 'Domaine Personnalisé', description: 'Connectez votre propre nom de domaine ou utilisez un sous-domaine gratuit pour votre marque.', gradient: 'from-orange-600 to-amber-600', delay: 0.3 },
    { icon: Zap, title: 'Performances Extrêmes', description: 'Architecture moderne garantissant un chargement ultra-rapide (Core Web Vitals parfaits) pour vos clients.', gradient: 'from-yellow-500 to-orange-600', delay: 0.4 },
    { icon: Store, title: 'Multi-boutiques', description: 'Gérez plusieurs marques depuis un seul compte. Chaque boutique est isolée avec ses propres paramètres.', gradient: 'from-violet-600 to-indigo-600', delay: 0.5 },
  ];

  const stats = [
    { value: 1200, suffix: '+', label: 'Boutiques créées' },
    { value: 24, suffix: 'M€', label: 'Volume de ventes' },
    { value: 98, suffix: '%', label: 'Satisfaction client' },
    { value: 14, suffix: 'j', label: 'Essai gratuit' },
  ];

  const testimonials = [
    { name: 'Sophie Martin', role: 'Créatrice de bijoux', rating: 5, text: "BoutiqueKi a transformé mon activité. En 2 heures j'avais ma boutique en ligne et mes premières ventes !" },
    { name: 'Thomas Legrand', role: 'Vendeur mode vintage', rating: 5, text: "L'éditeur visuel est incroyable. J'ai pu créer exactement le design que j'avais en tête, sans toucher au code." },
    { name: 'Amira Benali', role: 'Artisane cosmétique', rating: 5, text: "La gestion du stock m'a sauvé la mise plusieurs fois. Les alertes automatiques sont une vraie valeur ajoutée." },
  ];

  return (
    <div className="min-h-screen bg-[#050B1A] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#050B1A]/85 backdrop-blur-xl border-b border-white/10 shadow-xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-glow">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">BoutiqueKi</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link to="/explore" className="hover:text-white transition-colors">Parcourir les boutiques</Link>
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalites</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Temoignages</a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 hidden sm:block">
              Connexion
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105">
              Créer ma boutique
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[160px]" />
        </div>

        {/* Grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] pointer-events-none" />

        {/* Floating status cards */}
        <FloatingCard delay={0} className="absolute top-[18%] right-[6%] hidden xl:block z-20">
          <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl w-52">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Ventes du jour</p>
                <p className="text-sm font-bold text-emerald-400">+ 1 249 €</p>
              </div>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '76%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">76% de l'objectif</p>
          </div>
        </FloatingCard>

        <FloatingCard delay={1.2} className="absolute bottom-[22%] left-[5%] hidden xl:block z-20">
          <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl w-48">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Visiteurs</p>
                <p className="text-sm font-bold text-blue-400">2 847</p>
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {[40,65,45,80,55,92,70].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex-1 bg-blue-500/40 rounded-sm origin-bottom"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </FloatingCard>

        <FloatingCard delay={0.6} className="absolute top-[28%] left-[5%] hidden xl:block z-20">
          <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                <Package className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Nouvelle commande</p>
                <p className="text-xs font-bold text-white">Robe florale · 89 €</p>
              </div>
            </div>
          </div>
        </FloatingCard>

        {/* Main content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-sm font-semibold mb-8 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              La nouvelle ère du e-commerce est là
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6">
              <span className="text-white">Créez votre boutique</span>
              <br className="hidden md:block" />
              <span className="gradient-text"> sans écrire une ligne de code.</span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              BoutiqueKi est la plateforme tout-en-un pour lancer, gérer et faire évoluer votre commerce en ligne. Design premium, paiements sécurisés et gestion de stock simplifiée.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                to="/register"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-lg font-bold rounded-2xl hover:shadow-2xl hover:shadow-pink-500/30 transition-all hover:scale-105 flex items-center justify-center"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-white/8 text-white border border-white/15 text-lg font-bold rounded-2xl hover:bg-white/15 transition-all backdrop-blur-sm flex items-center justify-center"
              >
                Voir les fonctionnalités
              </a>
            </div>

            <p className="text-sm text-slate-600">Aucune carte de crédit · Essai gratuit 14 jours · Configuration en 5 minutes</p>
          </motion.div>

          {/* 3D Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 mx-auto max-w-4xl"
            style={{ perspective: '1400px' }}
          >
            <motion.div
              animate={{ rotateX: [3, 1, 3] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="rounded-2xl border border-white/10 bg-[#0F172A]/80 backdrop-blur-sm shadow-[0_40px_120px_rgba(59,130,246,0.15)] overflow-hidden"
            >
              {/* Browser bar */}
              <div className="h-10 bg-[#1E293B] flex items-center px-4 gap-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-4 flex-1 max-w-xs bg-white/5 h-6 rounded-md border border-white/10 flex items-center px-3 gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600" />
                  <span className="text-[10px] text-slate-500 font-mono">boutiqueki.com/dashboard</span>
                </div>
              </div>
              {/* Dashboard UI */}
              <div className="flex h-72">
                {/* Sidebar */}
                <div className="w-40 border-r border-white/5 bg-[#0A0F1E] p-3 space-y-1.5">
                  <div className="h-7 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 rounded-lg mb-4 flex items-center px-2 gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-white/30" />
                    <div className="h-2 bg-white/20 rounded flex-1" />
                  </div>
                  {[true, false, false, false, false].map((active, i) => (
                    <div key={i} className={`h-7 rounded-lg flex items-center px-2 gap-2 ${active ? 'bg-blue-500/15 border border-blue-500/25' : 'bg-white/4'}`}>
                      <div className={`w-3.5 h-3.5 rounded ${active ? 'bg-blue-400' : 'bg-white/15'}`} />
                      <div className={`h-2 rounded flex-1 ${active ? 'bg-blue-300/40' : 'bg-white/10'}`} />
                    </div>
                  ))}
                </div>
                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/4 mb-1" />
                  <div className="grid grid-cols-4 gap-2.5">
                    {['from-blue-500/20 to-blue-600/5', 'from-emerald-500/20 to-emerald-600/5', 'from-amber-500/20 to-amber-600/5', 'from-purple-500/20 to-purple-600/5'].map((g, i) => (
                      <div key={i} className={`bg-gradient-to-b ${g} border border-white/8 rounded-xl p-2.5`}>
                        <div className="w-6 h-6 rounded-lg bg-white/15 mb-2" />
                        <div className="h-1.5 bg-white/20 rounded mb-1 w-3/4" />
                        <div className="h-3 bg-white/30 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2.5">
                    <div className="col-span-3 bg-white/4 border border-white/8 rounded-xl p-3 h-20">
                      <div className="h-2 bg-white/15 rounded mb-2 w-1/3" />
                      <div className="flex items-end gap-0.5 h-10">
                        {[60,80,45,90,70,55,85,65,95,75].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/50 to-cyan-500/20 rounded-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 bg-white/4 border border-white/8 rounded-xl p-3 h-20">
                      <div className="h-2 bg-white/15 rounded mb-3 w-2/3" />
                      {[1,2,3].map(i => (
                        <div key={i} className="flex gap-1.5 items-center mb-1.5">
                          <div className="w-4 h-4 bg-white/15 rounded" />
                          <div className="h-1.5 bg-white/15 rounded flex-1" />
                          <div className="h-2 bg-emerald-400/40 rounded w-7" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-4xl font-black text-white mb-1">
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <p className="text-sm text-slate-500">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-xs font-bold text-blue-400 tracking-[0.2em] uppercase mb-4 block">Fonctionnalités</span>
            <h2 className="text-4xl font-black text-white mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-400">Des outils puissants conçus pour vous faire gagner du temps et augmenter vos ventes, sans complexité technique.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-28 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-xs font-bold text-blue-400 tracking-[0.2em] uppercase mb-4 block">Tarifs</span>
            <h2 className="text-4xl font-black text-white mb-4">Simples et transparents</h2>
            <p className="text-slate-400">Commencez gratuitement, évoluez selon vos besoins. Pas de frais cachés.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
            <PricingCard title="Starter" price="9" cta="Commencer" features={["Jusqu'à 500 produits","Commandes illimitées","Domaine personnalisé","Thèmes de base","Commission 3%"]} />
            <PricingCard title="Pro" price="29" isPopular cta="Essai gratuit 14 jours" features={["Jusqu'à 5 000 produits","Commandes illimitées","Thèmes premium","Analytics avancées","Commission 1,5%"]} />
            <PricingCard title="Business" price="79" cta="Contacter les ventes" features={["Produits illimités","API Access","Support prioritaire 24/7","Marque blanche","0% de commission"]} />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-xs font-bold text-blue-400 tracking-[0.2em] uppercase mb-4 block">Témoignages</span>
            <h2 className="text-4xl font-black text-white">Ils nous font confiance</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-white/20"
              >
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-12 text-center border border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-cyan-600/20" />
            <div className="absolute inset-0 bg-[#0F172A]/50" />
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-white mb-4">Prêt à lancer votre boutique ?</h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">Rejoignez plus de 1 200 entrepreneurs qui font confiance à BoutiqueKi pour vendre en ligne.</p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-lg font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all hover:scale-105"
              >
                Créer ma boutique gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">BoutiqueKi</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">Conditions</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-slate-600">&copy; 2026 BoutiqueKi. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
