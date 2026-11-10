import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../../lib/firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const toastStyle = {
  background: '#18181b',
  color: '#fafafa',
  border: '1px solid #3f3f46',
  borderRadius: '16px',
};

export default function ResetPassword() {
  const [params] = useSearchParams();
  const code = params.get('oobCode') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!code) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    verifyPasswordResetCode(auth, code)
      .then((account) => setEmail(account))
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [code]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error('A nova senha precisa ter pelo menos 8 caracteres.', { style: toastStyle });
      return;
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem.', { style: toastStyle });
      return;
    }
    setSaving(true);
    try {
      await confirmPasswordReset(auth, code, password);
      setDone(true);
      toast.success('Senha alterada. Entre com a nova senha.', { style: toastStyle });
    } catch {
      toast.error('Este link expirou ou já foi usado. Peça um novo.', { style: toastStyle });
      setInvalid(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="auth-card w-full max-w-md rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-6 text-center shadow-2xl sm:p-8">
        {loading ? (
          <p className="text-zinc-300">Conferindo o link de recuperação...</p>
        ) : done ? (
          <>
            <h1 className="text-2xl font-bold text-white">Senha atualizada</h1>
            <p className="mt-3 text-zinc-300">A conta {email} já pode entrar com a nova senha.</p>
          </>
        ) : invalid ? (
          <>
            <h1 className="text-2xl font-bold text-white">Link inválido</h1>
            <p className="mt-3 text-zinc-300">Peça um novo link na recuperação de senha. Este não pode mais ser usado.</p>
          </>
        ) : (
          <form onSubmit={save} className="space-y-5 text-left">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-indigo-500/10">
                <KeyRound className="h-8 w-8 text-indigo-300" />
              </div>
              <h1 className="text-2xl font-bold text-white">Nova senha</h1>
              <p className="mt-2 text-sm text-zinc-400">{email}</p>
            </div>
            <Input
              label="Nova senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
              required
              trailingIcon={<button type="button" className={`password-eye${showPassword ? ' is-on' : ''}`} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
            />
            <Input
              label="Confirmar senha"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              fullWidth
              required
              trailingIcon={<button type="button" className={`password-eye${showConfirm ? ' is-on' : ''}`} aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowConfirm((value) => !value)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={saving} disabled={saving}>
              Salvar nova senha
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-8 inline-flex items-center gap-2 text-indigo-300">
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
