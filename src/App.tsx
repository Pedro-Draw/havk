// App.tsx
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { DEV_SESSION_KEY, applyFirebaseUser } from "./lib/authSession";
import { useAppStore } from "./store/useAppStore";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import MobileMenu from "./components/layout/MobileMenu";
import Footer from "./components/layout/Footer";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

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

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAll();
    }
  }, [isAuthenticated, user, loadAll]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Topbar />

        <main className="w-full min-w-0 flex-1">
          <Outlet />
        </main>

        <Footer />
      </div>

      <MobileMenu />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

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
      <AppRoutes />
      <Toaster
        position="top-center"
        containerClassName="!top-4"
        toastOptions={{
          duration: 4000,
          className: "text-sm",
        }}
      />
    </Router>
  );
}