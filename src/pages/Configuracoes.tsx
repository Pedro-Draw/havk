// pages/Configuracoes.tsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Settings, User, Palette, Bell, Shield, LogOut, Camera, Mail, Lock,
  Globe, Moon, Sun, Monitor, Trash2, CheckCircle, AlertTriangle,
  Download, Eye, EyeOff, Smartphone, Briefcase, Link as LinkIcon,
  Instagram, Linkedin, Github, Globe as WebIcon,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function Configuracoes() {
  const { t, i18n } = useTranslation();
  const {
    user,
    setUser,
    theme,
    setTheme,
    language,
    setLanguage,
    logout,
    notificationPreferences,
    setNotificationPref,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<
    'perfil' | 'links' | 'tema' | 'idioma' | 'notificacoes' | 'seguranca' | 'dispositivos'
  >('perfil');

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

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Força da senha visual
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
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        email: user.email || '',
        role: user.role || '',
        website: user.website || '',
        instagram: user.instagram || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPreviewAvatar(user.avatar || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !user) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Arquivo muito grande (máx. 5MB)');
    return;
  }

  const reader = new FileReader();

  reader.onload = async event => {
    const base64 = event.target?.result as string;

    setPreviewAvatar(base64);

    await setUser({
  id: user.id,
  ...user,
  avatar: base64,
});

    toast.success('Foto de perfil atualizada');
  };

  reader.readAsDataURL(file);
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
  id: user.id, // 🔴 GARANTE QUE É O MESMO REGISTRO
  ...user,
  name: formData.name.trim(),
  email: formData.email.trim(),
  username: formData.username?.trim(),
  bio: formData.bio?.trim(),
  role: formData.role?.trim(),
};
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
      const updatedUser = {
  id: user.id, // 🔴 obrigatório
  ...user,
  website: formData.website?.trim(),
  instagram: formData.instagram?.trim().replace(/^@/, ''),
  linkedin: formData.linkedin?.trim(),
  github: formData.github?.trim().replace(/^@/, ''),
};
      await setUser(updatedUser);
      toast.success('Links sociais salvos com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar links');
    } finally {
      setIsSavingLinks(false);
    }
  };

  const getSocialUrl = (type: 'instagram' | 'linkedin' | 'github' | 'website') => {
    const val = formData[type]?.trim();
    if (!val) return '#';

    if (type === 'instagram') return `https://instagram.com/${val.replace(/^@/, '')}`;
    if (type === 'github')     return `https://github.com/${val.replace(/^@/, '')}`;
    if (type === 'linkedin')   return val.startsWith('http') ? val : `https://www.linkedin.com/in/${val}`;
    if (type === 'website')    return val.startsWith('http') ? val : `https://${val}`;

    return '#';
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
    await new Promise(r => setTimeout(r, 1400)); // simulação
    toast.success('Senha alterada com sucesso (simulado)');
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `havk-dados-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  const handleLogout = () => {
  toast((toastId) => (
    <div className="flex flex-col gap-4 w-80 p-4 rounded-xl
      bg-white dark:bg-zinc-900
      border border-zinc-200 dark:border-zinc-700
      text-zinc-900 dark:text-zinc-100
      shadow-xl">

      <p className="font-medium">Tem certeza que deseja sair?</p>

      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.dismiss(toastId.id)}
        >
          Cancelar
        </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              logout();
              window.location.href = '/login';
              toast.dismiss(toastId.id);
            }}
          >
            Sim, sair
          </Button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const handleDeleteAccount = () => {
    if (!deleteConfirmOpen) {
      setDeleteConfirmOpen(true);
      return;
    }
    if (deleteReason.trim().length < 5) {
      toast.error('Por favor, informe o motivo (mínimo 5 caracteres)');
      return;
    }
    toast.success('Conta excluída permanentemente (simulado)');
    logout();
    window.location.href = '/signup';
  };

  const handleChangeLanguage = (newLang: 'pt-BR' | 'en') => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    toast.success(`Idioma alterado para ${newLang === 'pt-BR' ? 'Português' : 'Inglês'}`);
    setTimeout(() => window.location.reload(), 700);
  };

  const mockDevices = [
    { id: 1, name: 'iPhone 14 – Brasília', lastActive: 'Agora', current: true },
    { id: 2, name: 'Chrome – Windows 11', lastActive: '2 horas atrás' },
    { id: 3, name: 'Safari – MacBook Pro', lastActive: 'Ontem às 14:30' },
  ];

  const sidebarItems = [
    { id: 'perfil', label: t('perfil'), icon: User },
    { id: 'links', label: 'Links & Redes', icon: LinkIcon },
    { id: 'tema', label: t('tema'), icon: Palette },
    { id: 'idioma', label: t('idioma'), icon: Globe },
    { id: 'notificacoes', label: t('notificacoes'), icon: Bell },
    { id: 'seguranca', label: t('seguranca'), icon: Shield },
    { id: 'dispositivos', label: 'Dispositivos', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 pb-24">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl shadow-lg">
              <Settings className="w-12 h-12 text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {t('configuracoes')}
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="lg:col-span-3 lg:sticky lg:top-24 h-fit"
            >
              <Card className="border-zinc-800 shadow-xl">
                <nav className="p-4 space-y-2">
                  {sidebarItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 ${
                        activeSection === item.id
                          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 border-l-4 border-indigo-500 text-white shadow-md'
                          : 'hover:bg-zinc-800/70 text-zinc-300'
                      }`}
                    >
                      <item.icon className="w-6 h-6 flex-shrink-0" />
                      <span className="font-medium text-lg truncate">{item.label}</span>
                    </button>
                  ))}

                  <div className="pt-10 px-2 border-t border-zinc-800 mt-8 space-y-4">
                    <Button
                      variant="outline"
                      fullWidth
                      icon={<Download className="w-5 h-5" />}
                      onClick={handleExportData}
                      className="justify-start py-4 text-base"
                    >
                      Exportar meus dados
                    </Button>
                    <Button
                      variant="destructive"
                      fullWidth
                      icon={<Trash2 className="w-5 h-5" />}
                      onClick={handleDeleteAccount}
                      className="justify-start py-4 text-base"
                    >
                      Excluir conta
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      icon={<LogOut className="w-5 h-5" />}
                      onClick={handleLogout}
                      className="justify-start py-4 text-rose-400 hover:text-rose-300"
                    >
                      Sair
                    </Button>
                  </div>
                </nav>
              </Card>
            </motion.div>

            {/* Conteúdo principal */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-9 space-y-10"
            >
              {/* PERFIL */}
              {activeSection === 'perfil' && (
                <Card title={t('informacoesPessoais')} className="border-zinc-800 shadow-xl">
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                      <div className="relative group">
                        {previewAvatar ? (
                          <img
                            src={previewAvatar}
                            alt="Foto de perfil"
                            className="w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover border-4 border-zinc-700 shadow-2xl transition-all duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-44 h-44 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-8xl text-zinc-500 border-4 border-zinc-700">
                            {formData.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-5 -right-5 bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-full shadow-2xl hover:scale-110 transition-all ring-4 ring-zinc-900"
                          aria-label="Alterar foto de perfil"
                        >
                          <Camera className="w-8 h-8 text-white" />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      <div className="text-center md:text-left space-y-3">
                        <h3 className="text-3xl font-bold">{formData.name || 'Seu nome'}</h3>
                        {formData.username && <p className="text-xl text-indigo-400">@{formData.username}</p>}
                        {formData.role && (
                          <p className="text-lg text-zinc-300 flex items-center gap-2">
                            <Briefcase className="w-5 h-5" /> {formData.role}
                          </p>
                        )}
                        <p className="text-lg text-zinc-400 flex items-center gap-3 justify-center md:justify-start">
                          <Mail className="w-6 h-6" /> {formData.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input
                        label={t('nomeCompleto')}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="text-lg py-4"
                      />
                      <Input
                        label="Username (@handle)"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="text-lg py-4"
                      />
                      <Input
                        label="Cargo / Função / Profissão"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        placeholder="Ex: Desenvolvedor Full-Stack"
                        className="text-lg py-4"
                      />
                      <Input
                        label={t('email')}
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="text-lg py-4"
                      />

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-zinc-300">
                          Biografia (máx. 160 caracteres)
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          maxLength={160}
                          className="w-full h-28 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:outline-none focus:border-indigo-500 resize-none text-base"
                        />
                        <p className="text-xs text-zinc-500 mt-1 text-right">
                          {formData.bio.length}/160
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={handleSaveProfile}
                        loading={isSavingProfile}
                        disabled={isSavingProfile}
                      >
                        Salvar alterações
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* LINKS & REDES SOCIAIS – Nova seção */}
              {activeSection === 'links' && (
                <Card title="Links e Redes Sociais" className="border-zinc-800 shadow-xl">
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input
                        label="Site / Portfólio"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://meusite.com"
                        className="text-lg py-4"
                      />
                      <Input
                        label="Instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="@seuusuario"
                        className="text-lg py-4"
                      />
                      <Input
                        label="LinkedIn"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="linkedin.com/in/seunome ou @seunome"
                        className="text-lg py-4"
                      />
                      <Input
                        label="GitHub"
                        name="github"
                        value={formData.github}
                        onChange={handleChange}
                        placeholder="@seuusuario"
                        className="text-lg py-4"
                      />
                    </div>

                    {/* Preview dos links (clicáveis) */}
                    <div className="pt-6 border-t border-zinc-800">
                      <p className="text-lg font-medium mb-4 text-zinc-300">Seus links (clique para visitar):</p>
                      <div className="flex flex-wrap gap-4">
                        {formData.website && (
                          <a
                            href={getSocialUrl('website')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-5 py-3 bg-zinc-900 rounded-xl border border-zinc-700 hover:border-indigo-500/50 transition-colors"
                          >
                            <WebIcon className="w-5 h-5" />
                            Site
                          </a>
                        )}
                        {formData.instagram && (
                          <a
                            href={getSocialUrl('instagram')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-5 py-3 bg-zinc-900 rounded-xl border border-zinc-700 hover:border-pink-500/50 transition-colors"
                          >
                            <Instagram className="w-5 h-5 text-pink-400" />
                            @{formData.instagram.replace(/^@/, '')}
                          </a>
                        )}
                        {formData.linkedin && (
                          <a
                            href={getSocialUrl('linkedin')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-5 py-3 bg-zinc-900 rounded-xl border border-zinc-700 hover:border-blue-500/50 transition-colors"
                          >
                            <Linkedin className="w-5 h-5 text-blue-400" />
                            LinkedIn
                          </a>
                        )}
                        {formData.github && (
                          <a
                            href={getSocialUrl('github')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-5 py-3 bg-zinc-900 rounded-xl border border-zinc-700 hover:border-zinc-300 transition-colors"
                          >
                            <Github className="w-5 h-5" />
                            @{formData.github.replace(/^@/, '')}
                          </a>
                        )}
                        {!formData.website && !formData.instagram && !formData.linkedin && !formData.github && (
                          <p className="text-zinc-500 italic">Nenhum link adicionado ainda</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={handleSaveSocialLinks}
                        loading={isSavingLinks}
                        disabled={isSavingLinks}
                      >
                        Salvar links
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* TEMA */}
              {activeSection === 'tema' && (
                <Card title="Aparência da aplicação" className="border-zinc-800 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { value: 'light', label: 'Claro', icon: Sun },
                      { value: 'dark', label: 'Escuro', icon: Moon },
                      { value: 'system', label: 'Sistema', icon: Monitor },
                      { value: 'gray', label: 'Cinza', icon: Monitor },
                    ].map(option => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setTheme(option.value)}
                        className={`relative p-8 rounded-2xl border-2 flex flex-col items-center gap-5 transition-all ${
                          theme === option.value
                            ? 'border-indigo-500 bg-zinc-800/60 shadow-indigo-500/30'
                            : 'border-zinc-800 hover:border-zinc-600 hover:shadow-xl'
                        }`}
                      >
                        <div className="w-24 h-24 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                          <option.icon className="w-10 h-10" />
                        </div>
                        <p className="font-semibold text-lg">{option.label}</p>
                        {theme === option.value && (
                          <CheckCircle className="w-7 h-7 text-indigo-400 absolute top-4 right-4" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </Card>
              )}

              {/* IDIOMA */}
              {activeSection === 'idioma' && (
                <Card title={t('idiomaDaInterface')} className="border-zinc-800 shadow-xl">
                  <div className="space-y-6 max-w-lg">
                    {[
                      { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
                      { code: 'en', name: 'English', flag: '🇺🇸' },
                    ].map(lang => (
                      <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => handleChangeLanguage(lang.code)}
                        className={`w-full p-7 rounded-2xl border-2 flex items-center gap-6 transition-all ${
                          language === lang.code
                            ? 'border-indigo-500 bg-indigo-950/20 shadow-md'
                            : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-6xl">{lang.flag}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-2xl">{lang.name}</p>
                          <p className="text-zinc-400">{lang.code}</p>
                        </div>
                        {language === lang.code && (
                          <CheckCircle className="w-10 h-10 text-indigo-400" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </Card>
              )}

              {/* NOTIFICAÇÕES */}
              {activeSection === 'notificacoes' && (
                <Card title={t('preferenciasDeNotificacoes')} className="border-zinc-800 shadow-xl">
                  <div className="space-y-5">
                    {[
                      { key: 'newDemanda', title: 'Novas demandas', desc: 'Receber quando uma nova demanda for criada' },
                      { key: 'chat', title: 'Mensagens no chat', desc: 'Notificações de novas mensagens' },
                      { key: 'prazos', title: 'Prazos próximos', desc: 'Lembretes de prazos se aproximando' },
                      { key: 'system', title: 'Atualizações do sistema', desc: 'Novidades e anúncios da plataforma' },
                      { key: 'emailMarketing', title: 'E-mails promocionais', desc: 'Receber novidades e dicas da Havk' },
                    ].map(item => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-xl">{item.title}</p>
                          <p className="text-base text-zinc-400 mt-1">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationPreferences?.[item.key as keyof typeof notificationPreferences] ?? true}
                            onChange={() => setNotificationPref(item.key, !notificationPreferences?.[item.key as keyof typeof notificationPreferences])}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-zinc-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* SEGURANÇA */}
              {activeSection === 'seguranca' && (
                <Card title={t('segurancaDaConta')} className="border-zinc-800 shadow-xl">
                  <div className="space-y-12">
                    <div className="p-8 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-5 mb-8">
                        <Lock className="w-10 h-10 text-indigo-400" />
                        <h3 className="text-3xl font-semibold">Alterar senha</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                          label="Senha atual"
                          name="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={handleChange}
                          icon={showPasswords.current ? <EyeOff /> : <Eye />}
                          onIconClick={() => togglePasswordVisibility('current')}
                        />
                        <div className="relative">
                          <Input
                            label="Nova senha"
                            name="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={formData.newPassword}
                            onChange={handleChange}
                            icon={showPasswords.new ? <EyeOff /> : <Eye />}
                            onIconClick={() => togglePasswordVisibility('new')}
                          />
                          {formData.newPassword && (
                            <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength <= 1 ? 'bg-red-600 w-1/4' :
                                  passwordStrength === 2 ? 'bg-orange-500 w-2/4' :
                                  passwordStrength === 3 ? 'bg-yellow-500 w-3/4' :
                                  'bg-green-500 w-full'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                        <Input
                          label="Confirmar nova senha"
                          name="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          icon={showPasswords.confirm ? <EyeOff /> : <Eye />}
                          onIconClick={() => togglePasswordVisibility('confirm')}
                        />
                      </div>
                      <div className="mt-10 flex justify-end">
                        <Button variant="primary" onClick={handleChangePassword}>
                          Atualizar senha
                        </Button>
                      </div>
                    </div>

                    <div className="p-8 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-5 mb-6">
                        <Shield className="w-10 h-10 text-green-400" />
                        <h3 className="text-3xl font-semibold">Autenticação de dois fatores</h3>
                      </div>
                      <p className="text-lg text-zinc-300 mb-8">
                        Ative a 2FA para maior segurança (em breve disponível)
                      </p>
                      <Button variant="outline" disabled>
                        Ativar 2FA
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* DISPOSITIVOS */}
              {activeSection === 'dispositivos' && (
                <Card title="Sessões ativas e dispositivos" className="border-zinc-800 shadow-xl">
                  <div className="space-y-5">
                    {mockDevices.map(device => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Smartphone className="w-8 h-8 text-zinc-400" />
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-sm text-zinc-500">Última atividade: {device.lastActive}</p>
                          </div>
                        </div>
                        {device.current ? (
                          <span className="px-4 py-1.5 bg-green-900/60 text-green-400 text-sm rounded-full border border-green-800/50">
                            Este dispositivo
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-400 hover:text-rose-300"
                            onClick={() => toast.success(`Sessão "${device.name}" encerrada (simulado)`)}
                          >
                            Encerrar sessão
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="pt-6">
                      <Button
                        variant="destructive"
                        fullWidth
                        onClick={() => toast.success('Todas as outras sessões foram encerradas (simulado)')}
                      >
                        Encerrar todas as outras sessões
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal exclusão */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-start gap-5 mb-6 text-rose-400">
                <AlertTriangle className="w-12 h-12 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold">Excluir conta permanentemente?</h2>
                  <p className="text-zinc-300 mt-3">
                    Esta ação não pode ser desfeita. Todos os seus dados serão apagados do sistema.
                  </p>
                </div>
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3 text-zinc-300">
                  Por favor, nos conte o motivo (ajuda muito a melhorar o Havk)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Ex: Mudei de ferramenta, não uso mais, outro motivo..."
                  className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:border-rose-500 resize-none text-base"
                />
              </div>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteReason.trim().length < 5}
                >
                  Excluir minha conta
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}