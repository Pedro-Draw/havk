// App.tsx
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useAppStore } from "./store/useAppStore";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import MobileMenu from "./components/layout/MobileMenu";
import Footer from "./components/layout/Footer";

import Splash from "./components/Splash";

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

function AppLayout() {
  const loadAll = useAppStore((state) => state.loadAll);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);

  // Carrega todos os dados sempre que o usuário está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAll();
    }
  }, [isAuthenticated, user, loadAll]);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Topbar />

        <main className="flex-1 pt-16 overflow-x-hidden">
          <Outlet />
        </main>

        <Footer />
      </div>

      <MobileMenu />

      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}

function AppWrapper() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <Splash onFinish={() => setShowSplash(false)} duration={2000} />}
      {!showSplash && <App />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/** Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/** Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/kanban" element={<Kanban />} />
            {/* Adicione essas duas linhas aqui */}
            <Route path="/demandas" element={<DemandaDetail />} />
            <Route path="/demandas/:id" element={<DemandaDetail />} />
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

            <Route path="/integracoes" element={<NotFound />} />
            <Route path="/planos" element={<NotFound />} />
            <Route path="/ajuda" element={<NotFound />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}