import { useTranslation } from '../i18n/useTranslation';
import { AlertTriangle, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-8" />
        <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-zinc-100 mb-6">
          {t('paginaNaoEncontrada') || 'Página não encontrada'}
        </h2>
        <p className="text-zinc-400 mb-10">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button variant="primary" size="lg" icon={<Home />} asChild>
          <Link to="/">
            Voltar para o Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}