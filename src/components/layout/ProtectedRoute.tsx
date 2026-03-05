import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function ProtectedRoute() {

  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isAuthLoading = useAppStore((state) => state.isAuthLoading);

  const location = useLocation();

  // Enquanto verifica autenticação (futuro Firebase/Auth)
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-zinc-400">
        Carregando...
      </div>
    );
  }

  // Usuário não autenticado → redireciona
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Usuário autenticado → renderiza rota protegida
  return <Outlet />;
}