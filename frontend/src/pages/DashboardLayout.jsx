import { Outlet, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import { Bell, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';

const breadcrumbMap = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/products': 'Produits',
  '/dashboard/products/new': 'Nouveau produit',
  '/dashboard/stock': 'Stock',
  '/dashboard/orders': 'Commandes',
  '/dashboard/settings': 'Paramètres',
  '/dashboard/admin': 'Administration',
  '/dashboard/admin/users': 'Utilisateurs',
  '/dashboard/admin/shops': 'Boutiques',
};

const useSidebarWidth = () => {
  const [width, setWidth] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true' ? 72 : 256);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setWidth(localStorage.getItem('sidebar-collapsed') === 'true' ? 72 : 256);
    });
    observer.observe(document.body, { subtree: true, attributes: true });
    const onStorage = () => {
      setWidth(localStorage.getItem('sidebar-collapsed') === 'true' ? 72 : 256);
    };
    window.addEventListener('storage', onStorage);
    return () => { observer.disconnect(); window.removeEventListener('storage', onStorage); };
  }, []);
  return width;
};

const DashboardLayout = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = [];
  let path = '';
  for (const seg of segments) {
    path += '/' + seg;
    const label = breadcrumbMap[path];
    if (label) crumbs.push({ label, href: path });
  }

  const pageTitle = crumbs[crumbs.length - 1]?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1E] flex">
      <Sidebar />

      <motion.div
        animate={{ marginLeft: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-1 flex flex-col min-h-screen"
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 flex items-center px-6 justify-between">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1.5">
                {i < crumbs.length - 1 ? (
                  <>
                    <Link to={c.href} className="text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-medium">
                      {c.label}
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                  </>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{c.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs cursor-pointer">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;
