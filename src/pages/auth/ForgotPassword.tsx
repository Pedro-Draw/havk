import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Mock - em produção enviaria email real
    try {
      // Simula envio
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMessage(t('resetLinkSent') || 'Link de redefinição enviado para o seu e-mail');
    } catch (err) {
      setError(t('errorSending') || 'Erro ao enviar link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Havk</h1>
          <p className="text-zinc-400 mt-2">{t('forgotPassword')}</p>
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

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-400 text-sm text-center">{message}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<Mail className="w-5 h-5" />}
          >
            {t('sendResetLink') || 'Enviar link de recuperação'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-zinc-400 hover:text-zinc-200">
            ← {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}