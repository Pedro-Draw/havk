import { Bell, Search, UserCircle } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Link } from 'react-router-dom';

export default function Topbar() {
  const { user } = useAppStore(); // mock
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 bg-zinc-900 border-b border-zinc-800 h-16 flex items-center px-6">
      {/* Logo mobile */}
      <div className="lg:hidden mr-4">
        <Link to="/" className="text-xl font-bold text-white">Havk</Link>
      </div>

      {/* Busca */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder={t('topbar.search')}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Ações direita */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 hover:bg-zinc-800 rounded-full">
          <Bell className="w-5 h-5 text-zinc-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <ThemeToggle />

        <Link to="/configuracoes" className="flex items-center gap-2 hover:opacity-80">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <UserCircle className="w-8 h-8 text-zinc-400" />
          )}
          <span className="hidden md:inline text-sm font-medium">
            {user?.name || t('topbar.perfil')}
          </span>
        </Link>

        {/* Botão Nova Demanda */}
        <button className="hidden md:flex items-center px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium">
          + {t('topbar.novaDemanda')}
        </button>
      </div>
    </header>
  );
}