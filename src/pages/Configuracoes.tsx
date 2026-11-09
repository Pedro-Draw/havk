import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Settings, Camera, Mail, Lock, Globe, Moon, Sun, Monitor,
  Trash2, Check, Download, Eye, EyeOff, LogOut,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import PageHeader from '../components/layout/PageHeader';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import { auth } from '../lib/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { mapAuthError } from '../lib/authSession';
import { devicePermission, requestDevicePermission, showDeviceNotification } from '../lib/deviceNotify';
import { confirmAction } from '../lib/confirm';
import { readSquareImage } from '../lib/images';
import { useTheme } from '../hooks/useTheme';

const THEMES = [
  { value: 'light', label: 'Claro', icon: Sun, bg: '#f4f4f5', side: '#ffffff', card: '#ffffff' },
  { value: 'dark', label: 'Escuro', icon: Moon, bg: '#09090b', side: '#0c0c0f', card: '#141418' },
  { value: 'gray', label: 'Cinza', icon: Monitor, bg: '#121417', side: '#171a1f', card: '#1c2026' },
  { value: 'system', label: 'Sistema', icon: Monitor, bg: 'linear-gradient(135deg, #f4f4f5 50%, #09090b 50%)', side: '#e4e4e7', card: '#18181b' },
] as const;

const NOTICES = [
  { key: 'device', title: 'Notificações do dispositivo', desc: 'Mostrar os avisos da Havk fora do aplicativo' },
  { key: 'newDemanda', title: 'Novas demandas', desc: 'Avisar quando uma demanda for criada' },
  { key: 'chat', title: 'Mensagens no chat', desc: 'Avisar quando chegar uma mensagem' },
  { key: 'prazos', title: 'Prazos próximos', desc: 'Lembrar quando um prazo estiver perto' },
  { key: 'system', title: 'Atualizações do sistema', desc: 'Novidades da plataforma' },
  { key: 'emailMarketing', title: 'E-mails promocionais', desc: 'Novidades e dicas da Havk' },
] as const;

export default function Configuracoes() {
  const { t, i18n } = useTranslation();
  const {
    user,
    setUser,
    language,
    setLanguage,
    logout,
    notificationPreferences,
    setNotificationPref,
  } = useAppStore();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
    role: user?.role || '',
    website: user?.website || '',
    instagram: user?.instagram || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordStrength = (() => {
    const pass = formData.newPassword;
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  })();

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || '',
      email: user.email || '',
      role: user.role || '',
      website: user.website || '',
      instagram: user.instagram || '',
      linkedin: user.linkedin || '',
      github: user.github || '',
    }));
    setPreviewAvatar(user.avatar || '');
  }, [user?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 5MB)');
      return;
    }
    try {
      const base64 = await readSquareImage(file, 256);
      setPreviewAvatar(base64);
      await setUser({ ...user, id: user.id, avatar: base64 });
      toast.success('Foto de perfil atualizada');
    } catch {
      toast.error('Não foi possível usar essa imagem');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      toast.error('Username inválido (3-20 caracteres, letras, números e _)');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('E-mail inválido');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = {
        ...user,
        id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username?.trim(),
        bio: formData.bio?.trim(),
        role: formData.role?.trim(),
      };
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: updatedUser.name });
      }
      await setUser(updatedUser);
      toast.success('Perfil salvo com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    if (!user) return;
    setIsSavingLinks(true);
    try {
      await setUser({
        ...user,
        id: user.id,
        website: formData.website?.trim(),
        instagram: formData.instagram?.trim().replace(/^@/, ''),
        linkedin: formData.linkedin?.trim(),
        github: formData.github?.trim().replace(/^@/, ''),
      });
      toast.success('Links salvos com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar links');
    } finally {
      setIsSavingLinks(false);
    }
  };

  const linkHref = (type: 'instagram' | 'linkedin' | 'github' | 'website') => {
    const value = formData[type]?.trim();
    if (!value) return '';
    if (type === 'instagram') return `https://instagram.com/${value.replace(/^@/, '')}`;
    if (type === 'github') return `https://github.com/${value.replace(/^@/, '')}`;
    if (type === 'linkedin') return value.startsWith('http') ? value : `https://www.linkedin.com/in/${value}`;
    return value.startsWith('http') ? value : `https://${value}`;
  };

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (passwordStrength < 3) {
      toast.error('Senha muito fraca. Use maiúsculas, números e símbolos.');
      return;
    }
    const current = auth.currentUser;
    if (!current?.email) {
      toast.error('Entre com e-mail e senha para alterar a senha.');
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(current.email, formData.currentPassword);
      await reauthenticateWithCredential(current, credential);
      await updatePassword(current, formData.newPassword);
      toast.success('Senha alterada com sucesso');
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: unknown) {
      toast.error(mapAuthError(err as { code?: string; message?: string }));
    }
  };

  const handleExportData = () => {
    const state = useAppStore.getState();
    const data = {
      user: { ...state.user, avatar: undefined },
      preferences: {
        theme: state.theme,
        language: state.language,
        notifications: state.notificationPreferences,
      },
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `havk-dados-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  const handleLogout = async () => {
    const accepted = await confirmAction({
      title: 'Sair da conta?',
      message: 'Você volta para a tela de entrada. Os dados da empresa continuam neste aparelho.',
      confirmLabel: 'Sair',
    });
    if (!accepted) return;
    try {
      sessionStorage.removeItem('havk-dev-session');
      await firebaseSignOut(auth);
    } catch {
      /* o encerramento local segue mesmo assim */
    }
    await logout();
    window.location.href = '/login';
  };

  const handleDeleteAccount = () => {
    if (deleteReason.trim().length < 5) {
      toast.error('Informe o motivo com pelo menos 5 caracteres');
      return;
    }
    toast.success('Conta excluída permanentemente (simulado)');
    logout();
    window.location.href = '/signup';
  };

  const handleChangeLanguage = (newLang: 'pt-BR' | 'en') => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    setTimeout(() => window.location.reload(), 700);
  };

  const initial = formData.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-3 py-4 sm:px-6 sm:py-8">
      <PageHeader
        icon={<Settings size={18} />}
        title={t('configuracoes') || 'Configurações'}
        description="Conta, aparência e avisos deste aparelho."
      />

      <div className="space-y-4">
        <Card title="Perfil" description="Nome, foto e como você aparece no workspace.">
          <div className="flex items-center gap-4">
            <button type="button" className="profile-photo" aria-label="Alterar foto de perfil" onClick={() => fileInputRef.current?.click()}>
              {previewAvatar ? <img src={previewAvatar} alt="" /> : <span>{initial}</span>}
              <span className="profile-photo-edit"><Camera size={14} /></span>
            </button>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{formData.name || 'Seu nome'}</p>
              <p className="truncate text-sm text-[var(--text-muted)]">{formData.email}</p>
              {formData.role && <p className="truncate text-sm text-[var(--text-secondary)]">{formData.role}</p>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('nomeCompleto') || 'Nome completo'} name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Username" name="username" value={formData.username} onChange={handleChange} placeholder="seu_nome" />
            <Input label="Cargo" name="role" value={formData.role} onChange={handleChange} placeholder="Ex: Desenvolvedor" />
            <Input label={t('email') || 'E-mail'} name="email" type="email" value={formData.email} onChange={handleChange} leadingIcon={<Mail size={16} />} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Biografia</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} maxLength={160} className="havk-field h-24 resize-none px-3 py-2.5 text-sm" />
              <p className="mt-1 text-right text-xs text-[var(--text-muted)]">{formData.bio.length}/160</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleSaveProfile} loading={isSavingProfile} disabled={isSavingProfile}>
              Salvar perfil
            </Button>
          </div>
        </Card>

        <Card title="Links" description="Site e redes. Só aparecem os que estiverem preenchidos.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Site" name="website" value={formData.website} onChange={handleChange} placeholder="https://meusite.com" />
            <Input label="Instagram" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@usuario" />
            <Input label="LinkedIn" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="seunome" />
            <Input label="GitHub" name="github" value={formData.github} onChange={handleChange} placeholder="@usuario" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['website', 'instagram', 'linkedin', 'github'] as const).map((type) => {
              const href = linkHref(type);
              if (!href) return null;
              const label = type === 'website' ? 'Site' : type === 'instagram' ? 'Instagram' : type === 'linkedin' ? 'LinkedIn' : 'GitHub';
              return (
                <a key={type} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--border)' }}>
                  {label}
                </a>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleSaveSocialLinks} loading={isSavingLinks} disabled={isSavingLinks}>
              Salvar links
            </Button>
          </div>
        </Card>

        <Card title="Aparência" description="O tema vale para todo o aplicativo e fica salvo neste aparelho.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEMES.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`theme-choice ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setTheme(option.value)}
                >
                  <span className="theme-preview" style={{ background: option.bg }}>
                    <span style={{ background: option.side }} />
                    <span style={{ background: option.card }} />
                  </span>
                  <span className="flex items-center justify-between gap-2 text-sm font-medium">
                    <span className="inline-flex items-center gap-1.5"><Icon size={14} /> {option.label}</span>
                    {active && <Check size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={t('idiomaDaInterface') || 'Idioma'} description="A página recarrega para aplicar o idioma.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { code: 'pt-BR' as const, name: 'Português (Brasil)' },
              { code: 'en' as const, name: 'English' },
            ].map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`theme-choice ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => handleChangeLanguage(lang.code)}
                >
                  <span className="flex items-center justify-between text-sm font-medium">
                    <span className="inline-flex items-center gap-2"><Globe size={14} /> {lang.name}</span>
                    {active && <Check size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Notificações" description="Avisos dentro da Havk e na central deste aparelho.">
          <div className="mb-3 rounded-2xl border p-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-medium">Central do dispositivo</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">A logo da Havk acompanha a mensagem na central de notificações.</p>
            <Button
              className="mt-3"
              variant="primary"
              onClick={async () => {
                const result = await requestDevicePermission();
                if (result !== 'granted') {
                  toast.error('Libere as notificações da Havk nas configurações do sistema.');
                  return;
                }
                setNotificationPref('device', true);
                await showDeviceNotification('A Havk está pronta para avisar neste dispositivo.');
                toast.success('A Havk vai avisar neste dispositivo.');
              }}
            >
              {devicePermission() === 'granted' ? 'Enviar teste' : 'Ativar neste dispositivo'}
            </Button>
          </div>
          <div className="space-y-2">
            {NOTICES.map((item) => (
              <label key={item.key} className="settings-row">
                <span>
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-sm text-[var(--text-muted)]">{item.desc}</span>
                </span>
                <span className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notificationPreferences?.[item.key] ?? true}
                    onChange={() => setNotificationPref(item.key, !(notificationPreferences?.[item.key] ?? true))}
                  />
                  <i />
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card title="Segurança" description="A troca de senha pede a senha atual.">
          <div className="grid grid-cols-1 gap-4">
            {([
              ['current', 'currentPassword', 'Senha atual'],
              ['new', 'newPassword', 'Nova senha'],
              ['confirm', 'confirmPassword', 'Confirmar nova senha'],
            ] as const).map(([field, name, label]) => (
              <Input
                key={name}
                label={label}
                name={name}
                type={showPasswords[field] ? 'text' : 'password'}
                value={formData[name]}
                onChange={handleChange}
                leadingIcon={<Lock size={16} />}
                trailingIcon={
                  <button type="button" className="text-[var(--text-muted)]" onClick={() => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))} aria-label={showPasswords[field] ? 'Ocultar senha' : 'Mostrar senha'}>
                    {showPasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            ))}
          </div>
          {formData.newPassword && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--hover)' }}>
              <div
                className={`h-full ${passwordStrength <= 1 ? 'w-1/4 bg-red-500' : passwordStrength === 2 ? 'w-1/2 bg-orange-500' : passwordStrength === 3 ? 'w-3/4 bg-yellow-500' : 'w-full bg-green-500'}`}
              />
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleChangePassword}>Atualizar senha</Button>
          </div>
        </Card>

        <Card title="Conta">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="outline" icon={<Download size={16} />} onClick={handleExportData}>Exportar meus dados</Button>
            <Button variant="ghost" icon={<LogOut size={16} />} onClick={handleLogout}>Sair</Button>
            <Button variant="destructive" icon={<Trash2 size={16} />} onClick={() => setDeleteConfirmOpen(true)}>Excluir conta</Button>
          </div>
        </Card>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="havk-card w-full max-w-lg rounded-2xl border p-5 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir conta</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Conte o motivo. Esta ação está marcada como simulada e encerra a sessão neste aparelho.</p>
            <textarea
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Motivo"
              className="havk-field mt-4 h-28 resize-none px-3 py-2.5 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteReason.trim().length < 5}>Excluir minha conta</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
