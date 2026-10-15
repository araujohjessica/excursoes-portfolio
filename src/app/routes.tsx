import { createBrowserRouter, createHashRouter, Outlet, Navigate, ScrollRestoration } from 'react-router';
import { IS_DEMO } from '../services/demo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Home from '../pages/Home';
import Excursoes from '../pages/Excursoes';
import ExcursionDetail from '../pages/ExcursionDetail';
import Checkout from '../pages/Checkout';
import Pagamento from '../pages/Pagamento';
import ComoFunciona from '../pages/ComoFunciona';
import CustomerLogin from '../pages/cliente/CustomerLogin';
import CustomerArea from '../pages/cliente/CustomerArea';
import AdminMensagens from '../pages/admin/AdminMensagens';
import AdminAvaliacoes from '../pages/admin/AdminAvaliacoes';
import AdminFinanceiro from '../pages/admin/AdminFinanceiro';
import AdminPedidos from '../pages/admin/AdminPedidos';
import AdminConfiguracoes from '../pages/admin/AdminConfiguracoes';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminEventos from '../pages/admin/AdminEventos';
import AdminCreateEvent from '../pages/admin/AdminCreateEvent';
import AdminReservas from '../pages/admin/AdminReservas';
import AdminEventoParticipantes from '../pages/admin/AdminEventoParticipantes';
import { useApp } from '../store/AppContext';

function PublicLayout() {
  return (
    <>
      <ScrollRestoration />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function AdminLayout() {
  const { isAdminLoggedIn } = useApp();
  if (!isAdminLoggedIn) return <Navigate to="/admin/login" replace />;
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function AdminLoginRoute() {
  const { isAdminLoggedIn } = useApp();
  if (isAdminLoggedIn) return <Navigate to="/admin" replace />;
  return <AdminLogin />;
}

// Na demonstração (GitHub Pages) as rotas usam # para não dar 404 ao recarregar
const createRouter = IS_DEMO ? createHashRouter : createBrowserRouter;

export const router = createRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'excursoes', element: <Excursoes /> },
      { path: 'excursao/:slug', element: <ExcursionDetail /> },
      { path: 'checkout/:slug', element: <Checkout /> },
      { path: 'pagamento/:token', element: <Pagamento /> },
      { path: 'como-funciona', element: <ComoFunciona /> },
      { path: 'minha-conta', element: <CustomerArea /> },
      { path: 'minha-conta/entrar', element: <CustomerLogin /> },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLoginRoute />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'eventos', element: <AdminEventos /> },
      { path: 'eventos/novo', element: <AdminCreateEvent /> },
      { path: 'eventos/editar/:id', element: <AdminCreateEvent /> },
      { path: 'reservas', element: <AdminReservas /> },
      { path: 'eventos/:id/participantes', element: <AdminEventoParticipantes /> },
      { path: 'mensagens', element: <AdminMensagens /> },
      { path: 'avaliacoes', element: <AdminAvaliacoes /> },
      { path: 'financeiro', element: <AdminFinanceiro /> },
      { path: 'pedidos', element: <AdminPedidos /> },
      { path: 'configuracoes', element: <AdminConfiguracoes /> },
    ],
  },
]);
