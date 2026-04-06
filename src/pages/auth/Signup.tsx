import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const signupSchema = z
  .object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    email: z.string().email('Informe um email válido.'),
    password: z.string().min(8, 'Sua senha deve ter no mínimo 8 caracteres.'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Você precisa aceitar os termos para continuar.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const { createAccount, signInWithProvider } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { acceptTerms: false },
  });

  const passwordValue = watch('password');

  const passwordStrength = useMemo(() => {
    if (!passwordValue) return 0;
    let strength = 0;
    if (passwordValue.length >= 8) strength++;
    if (/[A-Z]/.test(passwordValue)) strength++;
    if (/[0-9]/.test(passwordValue)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) strength++;
    return strength;
  }, [passwordValue]);

  const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleProviderLogin = async (provider: 'google' | 'github') => {
    try {
      setLoadingProvider(provider);
      await signInWithProvider(provider);
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro ao autenticar.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    try {
      await createAccount(data.name.trim(), data.email.trim().toLowerCase(), data.password);
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro ao criar sua conta.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4 py-8">
      <div className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-6 shadow-2xl">

        {/* HEADER */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Havk</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Crie sua conta gratuita e desbloqueie todo o potencial da plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* NOME */}
          <Input
            label="Nome completo"
            placeholder="Digite seu nome completo"
            {...register('name')}
            error={errors.name?.message}
            fullWidth
          />

          {/* EMAIL */}
          <Input
            label="Email profissional"
            type="email"
            placeholder="nome@exemplo.com"
            {...register('email')}
            error={errors.email?.message}
            fullWidth
          />

          {/* SENHA */}
          <div>
            <Input
              label="Senha segura"
              type={showPassword ? 'text' : 'password'}
              placeholder="Crie uma senha forte"
              {...register('password')}
              error={errors.password?.message}
              fullWidth
              trailingIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Mostrar ou ocultar senha"
                  className="text-zinc-400 hover:text-zinc-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            {passwordValue && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= level ? strengthColor[passwordStrength] : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Força: <span className="font-medium text-zinc-200">{strengthLabel[passwordStrength] || 'Muito fraca'}</span>
                </p>
              </div>
            )}
          </div>

          {/* CONFIRMAR SENHA */}
          <Input
            label="Confirmar senha"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repita sua senha"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            fullWidth
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label="Mostrar ou ocultar senha"
                className="text-zinc-400 hover:text-zinc-200 focus:outline-none"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {/* TERMOS */}
          <div className="space-y-1">
            <label className="flex items-start gap-2 text-xs text-zinc-300 leading-snug cursor-pointer">
              <input
                type="checkbox"
                {...register('acceptTerms')}
                className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30"
              />
              <span>
                Ao criar sua conta, você concorda com nossos{' '}
                <span className="text-indigo-400">Termos de Uso</span>{' '}
                e com a{' '}
                <span className="text-indigo-400">Política de Privacidade</span>.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.acceptTerms.message}</p>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Criar minha conta
          </Button>

          {/* DIVISOR */}
          <div className="flex items-center my-5">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="mx-3 text-zinc-500 text-xs uppercase tracking-wide">ou continue com</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* LOGIN SOCIAL */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              loading={loadingProvider === 'google'}
              disabled={!!loadingProvider || isSubmitting}
              onClick={() => handleProviderLogin('google')}
              icon={<FcGoogle className="w-5 h-5" />}
            >
              Continuar com Google
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              loading={loadingProvider === 'github'}
              disabled={!!loadingProvider || isSubmitting}
              onClick={() => handleProviderLogin('github')}
              icon={<FaGithub className="w-5 h-5" />}
            >
              Continuar com GitHub
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Já possui uma conta?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-medium">
            Acessar painel
          </Link>
        </div>
      </div>
    </div>
  );
}
