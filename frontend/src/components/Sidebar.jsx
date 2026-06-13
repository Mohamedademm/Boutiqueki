import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import {
  LayoutDashboard, Package, Settings, LogOut, Store,
  ShoppingBag, Warehouse, MonitorPlay, ShieldAlert,
  ChevronLeft, ChevronRight, Users, Building2, ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produits', href: '/dashboard/products', icon: Package },
  { name: 'Stock', href: '/dashboard/stock', icon: Warehouse },
  { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Éditeur Visuel', href: '/builder', icon: MonitorPlay },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

const adminItems = [
  { name: 'Vue globale', href: '/dashboard/admin', icon: ShieldAlert },
  { name: 'Utilisateurs', href: '/dashboard/admin/users', icon: Users },
  { name: 'Boutiques', href: '/dashboard/admin/shops', icon: Building2 },
];

const NavLink = ({ item, collapsed, isActive }) => (
  <Link
    to={item.href}
    title={collapsed ? item.name : undefined}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
      isActive
        ? 'bg-blue-600/15 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
    } ${collapsed ? 'justify-center' : ''}`}
  >
    <item.icon className={`flex-shrink-0 w-4.5 h-4.5 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="overflow-hidden whitespace-nowrap"
        >
          {item.name}
        </motion.span>
      )}
    </AnimatePresence>
    {isActive && (
      <motion.div
        layoutId="active-pill"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full"
      />
    )}
  </Link>
);

const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [adminOpen, setAdminOpen] = useState(
    () => location.pathname.startsWith('/dashboard/admin')
  );

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const isActive = (href) =>
    location.pathname === href || (href !== '/dashboard' && location.pathname.startsWith(href + '/'));

  const isAdminActive = adminItems.some(i => isActive(i.href));

  return (
    <motion.div
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex h-screen flex-col justify-between border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0A0F1E] fixed left-0 top-0 z-40 overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="px-3 py-5 flex-1 overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <div className={`flex items-center mb-7 px-1 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/25">
              <Store className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-black text-base text-slate-900 dark:text-white tracking-tight truncate"
                >
                  BoutiqueKi
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main nav */}
        <nav className="space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.href} item={item} collapsed={collapsed} isActive={isActive(item.href)} />
          ))}
        </nav>

        {/* Admin section */}
        {user?.role === 'admin' && (
          <div className="mt-4">
            {!collapsed && (
              <button
                onClick={() => setAdminOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isAdminActive
                    ? 'bg-red-500/10 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldAlert className={`w-4.5 h-4.5 flex-shrink-0 ${isAdminActive ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="flex-1 text-left">Administration</span>
                {adminOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
            {collapsed && (
              <NavLink item={{ name: 'Administration', href: '/dashboard/admin', icon: ShieldAlert }} collapsed={collapsed} isActive={isAdminActive} />
            )}
            <AnimatePresence>
              {adminOpen && !collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 ml-4 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
                    {adminItems.map(item => (
                      <NavLink key={item.href} item={item} collapsed={false} isActive={isActive(item.href)} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-slate-200 dark:border-slate-800/60 p-3">
        {/* Collapse toggle when collapsed */}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="w-full flex justify-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors mb-2"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
