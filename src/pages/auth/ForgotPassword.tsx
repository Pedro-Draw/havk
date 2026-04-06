// pages/ForgotPassword.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
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
      setError(t('emailInvalido') || 'Digite um e-mail válido');
      setLoading(false);
      toast.error(t('emailInvalido') || 'E-mail inválido');
      return;
    }

    try {
      const success = await sendPasswordReset(email.trim().toLowerCase());

      if (success) {
        setSubmitted(true);
        setMessage(
          t('linkRecuperacaoEnviado') ||
            'Se o e-mail existir em nosso sistema, enviaremos um link de recuperação.'
        );
      }
    } catch (err) {
      setError(t('erroEnviarEmail') || 'Não foi possível enviar o e-mail. Tente novamente.');
      toast.error(t('erroEnviarEmail') || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4">
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 shadow-2xl text-center">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Havk</h1>
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
