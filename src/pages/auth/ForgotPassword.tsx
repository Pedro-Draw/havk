// pages/ForgotPassword.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPassword() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { t } = useTranslation();
  const { sendPasswordReset } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Digite um e-mail válido.');
      setLoading(false);
      return;
    }

    try {
      const result = await sendPasswordReset(email.trim().toLowerCase());

      if (result === 'sent') {
        setSubmitted(true);
        setMessage('Enviamos o link de recuperação para esse e-mail. Confira a caixa de entrada e o spam.');
      } else if (result === 'missing') {
        setError('Não existe uma conta com esse e-mail. Nenhum link foi enviado.');
      } else if (result === 'invalid') {
        setError('Digite um e-mail válido.');
      } else {
        setError('Não foi possível confirmar ou enviar a recuperação. Tente novamente.');
      }
    } catch {
      setError('Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-shell flex min-h-screen items-center justify-center px-4">
        <div className="auth-card w-full max-w-md rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {t('verifiqueSeuEmail')}
          </h2>
          <p className="text-zinc-300 mb-8">{message}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <ArrowLeft size={18} />
            {t('voltarLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-8">
      <div className="auth-card w-full max-w-md rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Havk</h1>
          <p className="text-zinc-400 mt-2 text-lg">{t('recuperarSenha')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            ref={emailRef}
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@exemplo.com"
            error={error}
            required
            fullWidth
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            icon={<Mail className="w-5 h-5" />}
          >
            {t('enviarLinkRecuperacao')}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('voltarLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
