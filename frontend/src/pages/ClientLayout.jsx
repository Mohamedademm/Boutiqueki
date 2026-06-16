import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, MessageSquareWarning, Heart, User,
} from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { label: 'Tableau de bord', href: '/client', icon: LayoutDashboard },
  { label: 'Commandes', href: '/client/orders', icon: Package },
  { label: 'Reclamations', href: '/client/claims', icon: MessageSquareWarning },
  { label: 'Favoris', href: '/client/wishlist', icon: Heart },
  { label: 'Profil', href: '/client/profile', icon: User },
];

const ClientLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[60vh]">
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {active && (
                    <motion.div
                      layoutId="client-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default ClientLayout;
