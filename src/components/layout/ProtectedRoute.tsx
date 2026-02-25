import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAppStore(); // mock, será real depois

  // Se não estiver logado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver logado, renderiza o layout + conteúdo
  return <Outlet />;
}