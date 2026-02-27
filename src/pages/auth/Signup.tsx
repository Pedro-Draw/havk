import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { addItem } from '../../db/indexedDB'; // ajuste o caminho se necessário

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createDev, setCreateDev] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { setUser } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Limpa erro específico ao começar a digitar novamente
  useEffect(() => {
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  }, [name]);

  useEffect(() => {
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  }, [email]);

  useEffect(() => {
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
  }, [password]);

  useEffect(() => {
    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
  }, [confirmPassword]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = t('nameRequired') || 'O nome é obrigatório';
    } else if (name.trim().length < 2) {
      newErrors.name = t('nameTooShort') || 'Nome muito curto';
    }

    if (!email) {
      newErrors.email = t('emailRequired') || 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('invalidEmail') || 'E-mail inválido';
    }

    if (!password) {
      newErrors.password = t('passwordRequired') || 'Senha é obrigatória';
    } else if (password.length < 8) {
      newErrors.password = t('passwordMinLength') || 'A senha deve ter pelo menos 8 caracteres';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwordsDontMatch') || 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const newUser = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        language: 'pt-BR',
        theme: 'system',
        createdAt: new Date().toISOString(),
        isDev: createDev,
        // campos futuros úteis em SaaS real:
        // plan: 'free',
        // onboarded: false,
        // lastLogin: new Date().toISOString(),
      };

      await addItem('user', newUser);

      setUser(newUser);

      // Mock de autenticação (mantém o comportamento que você quer)
      const success = await signIn(email.trim(), password);
      if (!success) {
        throw new Error('Falha ao autenticar após cadastro');
      }

      navigate('/', { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrors({
        general: err.message || t('errorSignup') || 'Não foi possível criar a conta. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Havk</h1>
          <p className="text-zinc-400 mt-2 text-lg">{t('createYourAccount')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input
            label={t('fullName')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
            fullWidth
            autoComplete="name"
          />

          <Input
            ref={emailInputRef}
            label={t('emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@exemplo.com"
            error={errors.email}
            required
            fullWidth
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <div className="space-y-1">
            <Input
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              fullWidth
              autoComplete="new-password"
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

            {password && (
              <div className="flex gap-1 mt-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i < getPasswordStrength()
                        ? i === 0
                          ? 'bg-red-500'
                          : i === 1
                          ? 'bg-orange-500'
                          : i === 2
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <Input
            label={t('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
            fullWidth
            autoComplete="new-password"
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                className="text-zinc-400 hover:text-zinc-200 focus:outline-none"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          <label className="flex items-center gap-2.5 text-sm text-zinc-300 select-none">
            <input
              type="checkbox"
              checked={createDev}
              onChange={(e) => setCreateDev(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-2 focus:ring-offset-zinc-900"
            />
            <span>{t('createAsDeveloperAccount') || 'Criar como conta de desenvolvedor (dev tools)'}</span>
          </label>

          {/* Honeypot anti-spam (invisível para humanos) */}
          <input type="text" name="_gotcha" tabIndex={-1} className="sr-only" />

          {errors.general && (
            <p className="text-red-400 text-sm text-center font-medium bg-red-950/40 border border-red-900/50 rounded-lg p-3">
              {errors.general}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            icon={<UserPlus className="w-5 h-5" />}
          >
            {t('createAccount')}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-zinc-500">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}