import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await signIn(email, password);
      if (success) {
        navigate('/');
      } else {
        setError(t('invalidCredentials') || 'Credenciais inválidas');
      }
    } catch (err) {
      setError(t('errorLogin') || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    const success = await signIn('dev@havk.local', 'dev123');
    if (success) {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Havk</h1>
          <p className="text-zinc-400 mt-2">{t('welcomeBack')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            fullWidth
          />

          <Input
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<LogIn className="w-5 h-5" />}
          >
            {t('login')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleDevLogin}
            disabled={loading}
            icon={<UserPlus className="w-5 h-5" />}
          >
            {t('autoDev')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2">
          <Link to="/forgot-password" className="text-zinc-400 hover:text-zinc-200">
            {t('forgotPassword')}
          </Link>
          <p className="text-zinc-500">
            {t('noAccount')}{' '}
            <Link to="/signup" className="text-zinc-200 hover:underline">
              {t('signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}