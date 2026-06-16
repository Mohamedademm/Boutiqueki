import { Outlet } from 'react-router-dom';
import ConsumerHeader from '../components/ConsumerHeader';
import ConsumerFooter from '../components/ConsumerFooter';
import CartDrawer from '../components/CartDrawer';

const ConsumerLayout = () => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <ConsumerHeader />
    <main className="flex-1">
      <Outlet />
    </main>
    <ConsumerFooter />
    <CartDrawer />
  </div>
);

export default ConsumerLayout;
