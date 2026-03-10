// components/layout/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function ProtectedRoute() {
  const location = useLocation();

  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isAuthLoading = useAppStore((state) => state.isAuthLoading);
  const user = useAppStore((state) => state.user);

  // Enquanto verifica autenticação (ex: restaurando sessão do IndexedDB / Firebase futuramente)
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Carregando sessão...</span>
        </div>
      </div>
    );
  }

  // Usuário não autenticado → redireciona para login
  if (!isAuthenticated || !user) {
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