// App.tsx
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { DEV_SESSION_KEY, applyFirebaseUser } from "./lib/authSession";
import { useAppStore } from "./store/useAppStore";
import { rememberPlace } from "./lib/places";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import MobileMenu from "./components/layout/MobileMenu";
import Footer from "./components/layout/Footer";
import CommandPalette from "./components/command/CommandPalette";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Projetos from "./pages/Projetos";
import Kanban from "./pages/Kanban";
import DemandaDetail from "./pages/DemandaDetail";
import Calendario from "./pages/Calendario";
import Gantt from "./pages/Gantt";
import TimeTracker from "./pages/TimeTracker";
import AIStudio from "./pages/AIStudio";
import Notas from "./pages/Notas";
import Templates from "./pages/Templates";
import Objetivos from "./pages/Objetivos";
import Relatorios from "./pages/Relatorios";
import Equipe from "./pages/Equipe";
import ChatGlobal from "./pages/ChatGlobal";
import Configuracoes from "./pages/Configuracoes";

import NotFound from "./pages/NotFound";
import Empresas from "./pages/Empresas";
import HavkToaster from "./components/ui/HavkToaster";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import { devicePermission, requestDevicePermission } from "./lib/deviceNotify";

function AuthSync() {
  useEffect(() => {
    const stopWaiting = window.setTimeout(() => {
      if (useAppStore.getState().isAuthLoading) {
        useAppStore.setState({ isAuthLoading: false });
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          try {
            sessionStorage.removeItem(DEV_SESSION_KEY);
          } catch {
            /* ignora */
          }
          const current = useAppStore.getState().user;
          if (current?.id !== firebaseUser.uid) {
            await applyFirebaseUser(firebaseUser);
          } else {
            useAppStore.setState({ isAuthenticated: true, isAuthLoading: false });
          }
          return;
        }

        const savedDev = sessionStorage.getItem(DEV_SESSION_KEY);
        if (savedDev) {
          const devUser = JSON.parse(savedDev);
          useAppStore.setState({
            user: devUser,
            isAuthenticated: true,
            isAuthLoading: false,
          });
          return;
        }

        if (!useAppStore.getState().user?.isDev) {
          useAppStore.setState({
            user: null,
            isAuthenticated: false,
          });
        }
      } catch (err) {
        console.error('Falha ao sincronizar sessão:', err);
      } finally {
        useAppStore.setState({ isAuthLoading: false });
      }
    });

    return () => {
      window.clearTimeout(stopWaiting);
      unsubscribe();
    };
  }, []);

  return null;
}

function AppLayout() {
  const loadAll = useAppStore((state) => state.loadAll);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);
  const location = useLocation();

  useEffect(() => {
    rememberPlace(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAll();
    }
  }, [isAuthenticated, user, loadAll]);

  useEffect(() => {
    const blockScroll = (event: Event) => {
      const floating = document.querySelector('[data-float-panel]');
      const overlay = document.querySelector('[data-havk-overlay]');
      if (!floating && !overlay) return;
      const target = event.target as HTMLElement | null;
      if (floating) {
        if (target?.closest('[data-float-panel]')) return;
        event.preventDefault();
        return;
      }
      if (target?.closest('[role="dialog"], .mobile-drawer.is-open, .overlay-scroll')) return;
      event.preventDefault();
    };
    document.addEventListener('wheel', blockScroll, { passive: false, capture: true });
    document.addEventListener('touchmove', blockScroll, { passive: false, capture: true });
    return () => {
      document.removeEventListener('wheel', blockScroll, true);
      document.removeEventListener('touchmove', blockScroll, true);
    };
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content">
          <DeviceNotice />
          <Outlet />
          <Footer />
        </main>
      </div>
      <MobileMenu />
      <CommandPalette />
    </div>
  );
}

function DeviceNotice() {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('havk-notify-ask') === '1' || devicePermission() !== 'default';
  });

  if (hidden) return null;

  return (
    <div className="havk-toast mx-auto mb-4">
      <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="" className="havk-toast-logo" />
      <div className="min-w-0 flex-1">
        <p className="havk-toast-kicker">Neste dispositivo</p>
        <p className="havk-toast-message">A Havk pode enviar avisos com a logo e a mensagem direto na central de notificações.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded-full bg-violet-600 px-3 py-1.5 text-sm font-medium text-white"
            onClick={async () => {
              const result = await requestDevicePermission();
              localStorage.setItem('havk-notify-ask', '1');
              setHidden(true);
              if (result === 'granted') {
                toast.success('A Havk vai avisar neste dispositivo, com a logo e a mensagem.');
              } else {
                toast.error('O sistema não liberou as notificações da Havk.');
              }
            }}
          >
            Ativar
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-sm text-[var(--text-secondary)]"
            onClick={() => {
              localStorage.setItem('havk-notify-ask', '1');
              setHidden(true);
            }}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordResetLink() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'resetPassword' && params.get('oobCode') && location.pathname !== '/reset-password') {
      navigate(`/reset-password?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return null;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Rotas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/kanban" element={<Kanban />} />

          {/* Demandas */}
          <Route path="/demandas" element={<DemandaDetail />} />
          <Route path="/demandas/:id" element={<DemandaDetail />} />

          <Route path="/calendario" element={<Calendario />} />
          <Route path="/gantt" element={<Gantt />} />
          <Route path="/tempo" element={<TimeTracker />} />
          <Route path="/ia" element={<AIStudio />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/objetivos" element={<Objetivos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/chat" element={<ChatGlobal />} />
          <Route path="/configuracoes" element={<Configuracoes />} />

          {/* Páginas futuras */}
          <Route path="/integracoes" element={<NotFound />} />
          <Route path="/planos" element={<NotFound />} />
          <Route path="/ajuda" element={<NotFound />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export default function App() {
  return (
    <Router basename={routerBasename === '' ? undefined : routerBasename}>
      <AuthSync />
      <PasswordResetLink />
      <AppRoutes />
      <HavkToaster />
      <ConfirmDialog />
    </Router>
  );
}