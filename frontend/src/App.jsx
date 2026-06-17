import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import useAuthStore from './store/useAuthStore';
import { AnnouncementBanner, MaintenanceGate } from './components/GlobalChrome';

// Pages (lazy-loaded)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardLayout = lazy(() => import('./pages/DashboardLayout'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const ShopBuilderPage = lazy(() => import('./pages/ShopBuilderPage'));
const PublicShopPage = lazy(() => import('./pages/PublicShopPage'));
const PublicProductPage = lazy(() => import('./pages/PublicProductPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminShopsPage = lazy(() => import('./pages/AdminShopsPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminClaimsPage = lazy(() => import('./pages/AdminClaimsPage'));

// Consumer marketplace pages
const ConsumerLayout = lazy(() => import('./pages/ConsumerLayout'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const BoutiquesDirectoryPage = lazy(() => import('./pages/BoutiquesDirectoryPage'));
const ProductsExplorePage = lazy(() => import('./pages/ProductsExplorePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Client account pages
const ClientLayout = lazy(() => import('./pages/ClientLayout'));
const ClientDashboardPage = lazy(() => import('./pages/ClientDashboardPage'));
const ClientOrdersPage = lazy(() => import('./pages/ClientOrdersPage'));
const ClientClaimsPage = lazy(() => import('./pages/ClientClaimsPage'));
const ClientProfilePage = lazy(() => import('./pages/ClientProfilePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));

// Simple loading spinner
const FullScreenLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'client') return <Navigate to="/explore" />;
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" />;
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const { loadUser, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <Router>
      <AnnouncementBanner />
      <MaintenanceGate>
      <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* Marketing / SaaS landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Consumer marketplace (public — uses top nav) */}
        <Route element={<ConsumerLayout />}>
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/products" element={<ProductsExplorePage />} />
          <Route path="/boutiques" element={<BoutiquesDirectoryPage />} />
          <Route path="/s/:slug" element={<PublicShopPage />} />
          <Route path="/s/:slug/p/:id" element={<PublicProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        {/* Client account pages (protected, also uses consumer top nav) */}
        <Route element={
          <ProtectedRoute allowedRoles={['client', 'owner', 'admin']}>
            <ConsumerLayout />
          </ProtectedRoute>
        }>
          <Route element={<ClientLayout />}>
            <Route path="/client" element={<ClientDashboardPage />} />
            <Route path="/client/orders" element={<ClientOrdersPage />} />
            <Route path="/client/claims" element={<ClientClaimsPage />} />
            <Route path="/client/profile" element={<ClientProfilePage />} />
            <Route path="/client/wishlist" element={<WishlistPage />} />
          </Route>
        </Route>

        {/* Protected Routes — Owner/Admin only */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/builder"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <ShopBuilderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/shops" element={<AdminShopsPage />} />
          <Route path="admin/settings" element={<AdminSettingsPage />} />
          <Route path="admin/claims" element={<AdminClaimsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="stock" element={<StockPage />} />
        </Route>

        {/* 404 — catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      </MaintenanceGate>
    </Router>
  );
}

export default App;
