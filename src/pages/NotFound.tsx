// pages/NotFound.tsx
import { useTranslation } from '../i18n/useTranslation';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-lg text-center">
        <AlertTriangle className="mx-auto mb-6 h-16 w-16 text-red-500 sm:h-20 sm:w-20" />

        <h1 className="mb-4 text-6xl font-extrabold tracking-tight text-white sm:text-8xl">
          404
        </h1>

        <h2 className="mb-4 text-2xl font-bold text-zinc-100 sm:text-3xl">
          {t('paginaNaoEncontrada') || 'Página não encontrada'}
        </h2>

        <p className="mb-8 text-base leading-relaxed text-zinc-400 sm:text-lg">
          {t('paginaNaoEncontradaDesc') ||
            'A página que você está procurando não existe, foi movida ou está temporariamente indisponível.'}
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          <Home className="h-5 w-5" />
          {t('voltarDashboard') || 'Voltar para o Dashboard'}
        </Link>
      </div>
    </div>
  );
}
