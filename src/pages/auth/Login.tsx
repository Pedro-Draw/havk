import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Award,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { signIn, signInWithGoogle, signInWithGithub, signInAsDev } = useAuth();
  const { t } = useTranslation();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseX.set(e.clientX - window.innerWidth / 2);
    mouseY.set(e.clientY - window.innerHeight / 2);
  };

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const isFormValid = validateEmail(email) && password.length >= 6;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setError(
        t('credenciaisInvalidas') ||
        'Por favor, preencha os campos corretamente.'
      );
      triggerShake();
      return;
    }

    setLoading(true);

    try {

      const result = await signIn(email.trim(), password);

      if (!result) {
        setError(
          t('credenciaisInvalidas') ||
          'Email ou senha incorretos.'
        );
        triggerShake();
        return;
      }

      toast.success('Login realizado com sucesso!');

    } catch (err: any) {

      const message =
        err?.message ||
        'Ocorreu um erro ao realizar o login.';

      setError(message);
      triggerShake();

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (
    provider: 'google' | 'github' | 'dev'
  ) => {

    setLoading(true);
    setError('');

    try {

      if (provider === 'google') {
        await signInWithGoogle();
        toast.success('Login com Google realizado');
      }

      if (provider === 'github') {
        await signInWithGithub();
        toast.success('Login com GitHub realizado');
      }

      if (provider === 'dev') {
        await signInAsDev();
        toast.success('Login DEV ativado');
      }

    } catch (err: any) {

      const message =
        err?.message ||
        'Ocorreu um erro na autenticação.';

      setError(message);
      triggerShake();
      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (

    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4 overflow-hidden"
    >

      {/* Glow Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          x: springX,
          y: springY,
          background:
            'radial-gradient(circle at center, rgba(120,120,255,0.25), transparent 70%)',
        }}
      />

      {/* Card */}
      <motion.div
        animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 shadow-2xl z-10"
      >

        <div className="text-center mb-8">

          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Havk
          </h1>

          <p className="text-zinc-400 mt-2">
            {t('welcomeBack') || 'Bem-vindo de volta'}
          </p>

        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          <Input
            ref={emailRef}
            label={t('email') || 'Email'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@exemplo.com"
            required
            fullWidth
            autoComplete="email"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                passwordRef.current?.focus();
              }
            }}
          />

          <Input
            ref={passwordRef}
            label={t('senha') || 'Senha'}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            required
            fullWidth
            autoComplete="current-password"
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Mostrar ou ocultar senha"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-sm">

            <label className="flex items-center gap-2 text-zinc-400">

              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800"
              />

              Lembrar meus dados

            </label>

            <Link
              to="/forgot-password"
              className="text-indigo-400 hover:text-indigo-300"
            >
              {t('esqueceuSenha') || 'Esqueceu sua senha?'}
            </Link>

          </div>

          {error && (

            <p className="text-red-400 text-sm text-center bg-red-950/40 border border-red-900/50 rounded-lg p-3">
              {error}
            </p>

          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!isFormValid || loading}
            icon={<LogIn className="w-5 h-5" />}
          >
            {loading ? 'Entrando...' : t('entrar') || 'Entrar'}
          </Button>

        </form>

        <div className="flex items-center my-8">

          <div className="flex-grow border-t border-zinc-800"></div>

          <span className="mx-3 text-zinc-500 text-sm">
            {t('ouContinuarCom') || 'Ou continue com'}
          </span>

          <div className="flex-grow border-t border-zinc-800"></div>

        </div>

        <div className="space-y-3">

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            onClick={() => handleProviderLogin('google')}
            icon={<FcGoogle className="w-5 h-5" />}
          >
            {t('entrarComGoogle') || 'Entrar com Google'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            onClick={() => handleProviderLogin('github')}
            icon={<FaGithub className="w-5 h-5" />}
          >
            {t('entrarComGithub') || 'Entrar com GitHub'}
          </Button>

{/* comentado temporariamente, não remova esse comentario/botao entrar comodev e nem sua lógica */}
          {/* <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            onClick={() => handleProviderLogin('dev')}
          >
            {t('entrarComoDev') || 'Entrar como desenvolvedor'}
          </Button> */}

        </div>

        <div className="mt-10 text-center text-sm">

          <p className="text-zinc-500">
            {t('naoTemConta') || 'Ainda não possui uma conta?'}{' '}
            <Link
              to="/signup"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {t('cadastrar') || 'Criar conta'}
            </Link>
          </p>

        </div>

      </motion.div>

      <div className="flex flex-wrap justify-center gap-8 text-sm mt-16 z-10">

        <div className="flex items-center gap-2 text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          Segurança empresarial
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Zap className="w-4 h-4 text-yellow-400" />
          Alto desempenho
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Award className="w-4 h-4 text-purple-400" />
          Plataforma SaaS premium
        </div>

        {/* <div className="flex items-center gap-2 text-zinc-400">
          <Heart className="w-4 h-4 text-red-400" />
          Construído com paixão
        </div> */}
      </div>
    </div>
  );
}