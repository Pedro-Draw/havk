import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import MobileMenu from './components/layout/MobileMenu';
import Footer from './components/layout/Footer';

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

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Topbar />

        <main className="flex-1 pt-16 overflow-x-hidden">
          <Outlet />
        </main>

        <Footer />
      </div>

      <MobileMenu />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>

        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rotas protegidas com layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
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

            {/* Rotas placeholder */}
            <Route path="/integracoes" element={<NotFound />} />
            <Route path="/planos" element={<NotFound />} />
            <Route path="/ajuda" element={<NotFound />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* Fallback global */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}