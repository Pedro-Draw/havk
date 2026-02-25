import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createDev, setCreateDev] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { setUser } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch') || 'As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Mock de cadastro - cria usuário no IndexedDB
      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        language: 'pt-BR',
        theme: 'system',
        createdAt: new Date().toISOString(),
        isDev: createDev,
      };

      // Salva no IndexedDB
      await addItem('user', newUser); // importado de db/indexedDB.ts

      setUser(newUser);
      await signIn(email, password); // ativa login mock

      navigate('/');
    } catch (err) {
      setError(t('errorSignup') || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Havk</h1>
          <p className="text-zinc-400 mt-2">Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t('name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

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

          <Input
            label={t('confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
          />

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={createDev}
              onChange={(e) => setCreateDev(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-zinc-500"
            />
            {t('createDevAccount')}
          </label>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<UserPlus className="w-5 h-5" />}
          >
            {t('signup')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-zinc-500">
            {t('haveAccount')}{' '}
            <Link to="/login" className="text-zinc-200 hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}