import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { LogIn, Eye, EyeOff, ShieldCheck, Zap, Award, Heart } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    signIn,
    signInWithGoogle,
    signInWithGithub,
    signInAsDev,
  } = useAuth();

  const { t } = useTranslation();
  const emailRef = useRef<HTMLInputElement>(null);

  // 🔥 Glow Effect
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await signIn(email.trim(), password);
      if (!success) {
        setError(t('invalidCredentials') || 'E-mail ou senha incorretos');
      }
    } catch (err: any) {
      setError(err.message || t('errorLogin') || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: 'google' | 'github' | 'dev') => {
    setLoading(true);
    setError('');

    try {
      if (provider === 'google') await signInWithGoogle();
      if (provider === 'github') await signInWithGithub();
      if (provider === 'dev') await signInAsDev();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4 overflow-hidden"
    >

      {/* GLOW BACKGROUND */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          x: springX,
          y: springY,
          background:
            "radial-gradient(circle at center, rgba(120,120,255,0.25), transparent 70%)"
        }}
      />

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 shadow-2xl z-10">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Havk
          </h1>
          <p className="text-zinc-400 mt-2">
            {t('welcomeBack')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input
            ref={emailRef}
            label={t('emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@exemplo.com"
            required
            fullWidth
            autoComplete="email"
          />

          <Input
            label={t('password')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

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
            disabled={loading}
            icon={<LogIn className="w-5 h-5" />}
          >
            {t('signIn')}
          </Button>
        </form>

        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="mx-3 text-zinc-500 text-sm">
            ou continuar com
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
            Entrar com Google
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
            Entrar com GitHub
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            onClick={() => handleProviderLogin('dev')}
          >
            Entrar como Dev
          </Button>
        </div>

        <div className="mt-10 text-center text-sm space-y-3">
          <Link
            to="/forgot-password"
            className="text-zinc-400 hover:text-zinc-200 transition-colors block"
          >
            {t('forgotYourPassword')}
          </Link>

          <p className="text-zinc-500">
            {t('dontHaveAccount')}{' '}
            <Link
              to="/signup"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>

      {/* TRUST BADGES */}
      <div className="flex flex-wrap justify-center gap-8 text-sm mt-16 z-10">
        <div className="flex items-center gap-2 text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          Segurança Enterprise
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Zap className="w-4 h-4 text-yellow-400" />
          Alta Performance
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Award className="w-4 h-4 text-purple-400" />
          SaaS Premium
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Heart className="w-4 h-4 text-red-400" />
          Construído com paixão
        </div>
      </div>

    </div>
  );
}