// pages/NotFound.tsx
import { useTranslation } from '../i18n/useTranslation';
import { AlertTriangle, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center">
      {/* Ajuste principal: pt-20 para header fixo + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
          w-full
        `}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md sm:max-w-lg">
            <AlertTriangle
              className="w-28 h-28 md:w-32 md:h-32 text-red-500 mx-auto mb-10 animate-pulse"
            />
            
            <h1 className="text-8xl md:text-9xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
              404
            </h1>
            
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-6">
              {t('paginaNaoEncontrada') || 'Página não encontrada'}
            </h2>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed">
              {t('paginaNaoEncontradaDesc') ||
                'A página que você está procurando não existe, foi movida ou está temporariamente indisponível.'}
            </p>

            <Button
              variant="primary"
              size="xl"
              icon={<Home className="w-6 h-6" />}
              asChild
              className="px-10 py-5 text-lg font-medium shadow-lg hover:shadow-indigo-500/30 transition-all"
            >
              <Link to="/">
                {t('voltarDashboard') || 'Voltar para o Dashboard'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}