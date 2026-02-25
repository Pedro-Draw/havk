import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import MobileMenu from './components/layout/MobileMenu';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Projetos from './pages/Projetos';
import Kanban from './pages/Kanban';
import DemandaDetail from './pages/DemandaDetail';
import Calendario from './pages/Calendario';
import Gantt from './pages/Gantt';
import TimeTracker from './pages/TimeTracker';
import AIStudio from './pages/AIStudio';
import Notas from './pages/Notas';
import Templates from './pages/Templates';
import Objetivos from './pages/Objetivos';
import Relatorios from './pages/Relatorios';
import Equipe from './pages/Equipe';
import ChatGlobal from './pages/ChatGlobal';
import Configuracoes from './pages/Configuracoes';

import NotFound from './pages/NotFound';

export default function App() {
  const { isAuthenticated, theme } = useAppStore();
  const { setTheme } = useTheme();
  const { changeLanguage } = useLanguage();

  // Aplica tema inicial e idioma do usuário (ou padrão)
  useEffect(() => {
    // Tema já é aplicado pelo useTheme hook
    // Idioma do usuário (se logado)
    if (isAuthenticated) {
      // changeLanguage(user.language); // já feito no store ao logar
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        {/* Sidebar desktop */}
        {isAuthenticated && <Sidebar />}

        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          {isAuthenticated && <Topbar />}

          {/* Área de conteúdo */}
          <main className={`flex-1 ${isAuthenticated ? 'pt-16 lg:ml-64' : ''}`}>
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Rotas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/projetos" element={<Projetos />} />
                <Route path="/kanban" element={<Kanban />} />
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

                {/* Qualquer outra rota protegida cai aqui */}
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* 404 global */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>

        {/* Menu flutuante mobile */}
        {isAuthenticated && <MobileMenu />}
      </div>
    </Router>
  );
}