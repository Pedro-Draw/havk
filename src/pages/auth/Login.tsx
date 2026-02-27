import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await signIn(email.trim(), password);
      if (success) {
        navigate('/', { replace: true });
      } else {
        setError(t('invalidCredentials') || 'E-mail ou senha incorretos');
      }
    } catch (err: any) {
      setError(err.message || t('errorLogin') || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDevLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const success = await signIn('dev@havk.local', 'dev123');
      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Falha no login de desenvolvimento');
      }
    } catch (err) {
      setError('Erro no login rápido de dev');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Havk</h1>
          <p className="text-zinc-400 mt-2 text-lg">{t('welcomeBack')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input
            ref={emailRef}
            label={t('emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@exemplo.com"
            error={error}
            required
            fullWidth
            autoComplete="email"
            autoCapitalize="off"
          />

          <div className="relative">
            <Input
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error && !email ? error : undefined}
              required
              fullWidth
              autoComplete="current-password"
              trailingIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="text-zinc-400 hover:text-zinc-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </div>

          {error && email && password && (
            <p className="text-red-400 text-sm text-center font-medium bg-red-950/40 border border-red-900/50 rounded-lg p-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            icon={<LogIn className="w-5 h-5" />}
          >
            {t('signIn')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleQuickDevLogin}
            disabled={loading}
            icon={<LogIn className="w-5 h-5" />}
          >
            {t('quickDevLogin') || 'Entrar como Dev (teste)'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm space-y-3">
          <Link
            to="/forgot-password"
            className="text-zinc-400 hover:text-zinc-200 transition-colors block"
          >
            {t('forgotYourPassword')}
          </Link>

          <p className="text-zinc-500">
            {t('dontHaveAccount')}{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}