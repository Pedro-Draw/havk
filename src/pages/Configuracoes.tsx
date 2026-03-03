import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import {
  Settings,
  User,
  Palette,
  Bell,
  Shield,
  LogOut,
  Camera,
  Mail,
  Lock,
  Globe,
  Moon,
  Sun,
  Monitor,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Configuracoes() {
  const { t } = useTranslation();
  const {
    user,
    setUser,
    setTheme,
    theme,
    language,
    setLanguage,
    logout,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<
    'perfil' | 'tema' | 'idioma' | 'notificacoes' | 'seguranca' | 'dados'
  >('perfil');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
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
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
      setPreviewAvatar(user.avatar || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('arquivoMuitoGrande') || 'Arquivo excede 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewAvatar(base64);
      setUser({ ...user, avatar: base64 });
      toast.success(t('fotoAtualizada'));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error(t('nomeObrigatorio'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('emailInvalido'));
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      setUser(updatedUser);
      await new Promise((r) => setTimeout(r, 800)); // simula delay

      toast.success(t('perfilSalvo'));
    } catch (err) {
      toast.error(t('erroSalvar'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error(t('preenchaTodosCamposSenha'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('senhasNaoCoincidem'));
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('senhaMin8Caracteres'));
      return;
    }

    toast.success(t('senhaAlterada') || 'Senha alterada com sucesso (simulado)');
    setFormData((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleExportData = () => {
    const data = {
      user,
      preferences: { theme, language },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'havk-dados-exportados.json';
    a.click();
    URL.revokeObjectURL(url);

    toast.success(t('dadosExportados'));
  };

  const handleLogout = () => {
    toast((toastId) => (
      <div className="flex flex-col gap-4 w-80">
        <p className="font-medium">{t('confirmarLogout')}</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.dismiss(toastId.id)}
          >
            {t('cancelar')}
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
            {t('simSair')}
          </Button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const handleDeleteAccount = () => {
    if (!deleteConfirmOpen) {
      setDeleteConfirmOpen(true);
      toast(t('confirmeExclusaoConta'));
      setTimeout(() => setDeleteConfirmOpen(false), 10000);
      return;
    }

    toast.success(t('contaExcluida') || 'Conta excluída (simulado)');
    logout();
    window.location.href = '/signup';
  };

  const sidebarItems = [
    { id: 'perfil', label: t('perfil'), icon: User },
    { id: 'tema', label: t('tema'), icon: Palette },
    { id: 'idioma', label: t('idioma'), icon: Globe },
    { id: 'notificacoes', label: t('notificacoes'), icon: Bell },
    { id: 'seguranca', label: t('seguranca'), icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal: pt-20 para header fixo + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
        `}
      >
        <div className="mx-auto max-w-7xl pb-24">
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
            {/* Navegação lateral (sticky) */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 lg:sticky lg:top-24 h-fit"
            >
              <Card className="border-zinc-800 shadow-xl">
                <nav className="p-4 space-y-2">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as any)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 ${
                        activeSection === item.id
                          ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border-l-4 border-indigo-500 text-white shadow-md'
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
                      {t('exportarMeusDados')}
                    </Button>

                    <Button
                      variant="destructive"
                      fullWidth
                      icon={<Trash2 className="w-5 h-5" />}
                      onClick={handleDeleteAccount}
                      className="justify-start py-4 text-base"
                    >
                      {t('excluirConta')}
                    </Button>

                    <Button
                      variant="ghost"
                      fullWidth
                      icon={<LogOut className="w-5 h-5" />}
                      onClick={handleLogout}
                      className="justify-start py-4 text-base text-rose-400 hover:text-rose-300"
                    >
                      {t('sair')}
                    </Button>
                  </div>
                </nav>
              </Card>
            </motion.div>

            {/* Conteúdo dinâmico */}
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
                    {/* Avatar */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                      <div className="relative group">
                        <div className="relative">
                          {previewAvatar ? (
                            <img
                              src={previewAvatar}
                              alt="Foto de perfil"
                              className="w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover border-4 border-zinc-700 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-2 group-hover:shadow-indigo-500/40"
                            />
                          ) : (
                            <div className="w-44 h-44 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-7xl md:text-9xl text-zinc-500 border-4 border-zinc-700 shadow-2xl">
                              {formData.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}

                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-5 -right-5 bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-full shadow-2xl hover:scale-110 transition-all ring-4 ring-zinc-900"
                            aria-label={t('alterarFotoPerfil')}
                          >
                            <Camera className="w-8 h-8 text-white" />
                          </button>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      <div className="text-center md:text-left space-y-4">
                        <h3 className="text-3xl font-bold">{formData.name || t('seuNome')}</h3>
                        <p className="text-lg text-zinc-400 flex items-center gap-3 justify-center md:justify-start">
                          <Mail className="w-6 h-6" /> {user?.email}
                        </p>
                        <p className="text-base text-zinc-500">
                          {t('membroDesde')} {new Date(user?.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Formulário */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input
                        label={t('nomeCompleto')}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('digiteSeuNomeCompleto')}
                        icon={<User className="w-6 h-6" />}
                        required
                        className="text-lg py-4"
                      />

                      <Input
                        label={t('email')}
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('seuEmailPrincipal')}
                        icon={<Mail className="w-6 h-6" />}
                        disabled
                        helperText={t('emailNaoPodeSerAlteradoAinda')}
                        className="text-lg py-4"
                      />
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={handleSaveProfile}
                        loading={isSaving}
                        disabled={isSaving}
                        icon={<CheckCircle className="w-6 h-6" />}
                      >
                        {t('salvarAlteracoes')}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* TEMA */}
              {activeSection === 'tema' && (
                <Card title={t('aparenciaDaAplicacao')} className="border-zinc-800 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { value: 'light', label: t('claro'), icon: Sun, preview: 'bg-white border-zinc-300' },
                      { value: 'dark', label: t('escuro'), icon: Moon, preview: 'bg-zinc-950 border-zinc-700' },
                      { value: 'system', label: t('seguirSistema'), icon: Monitor, preview: 'bg-gradient-to-br from-white to-zinc-950 border-zinc-500' },
                      { value: 'gray', label: t('cinzaNeutro'), icon: Palette, preview: 'bg-zinc-800 border-zinc-600' },
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.05, y: -6 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTheme(option.value as any)}
                        className={`p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-6 shadow-lg ${
                          theme === option.value
                            ? 'border-indigo-500 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-indigo-500/40 ring-2 ring-indigo-500/50'
                            : 'border-zinc-800 hover:border-zinc-600 hover:shadow-2xl bg-zinc-900/70'
                        }`}
                      >
                        <div className={`w-28 h-28 rounded-xl shadow-inner border ${option.preview}`} />
                        <div className="text-center">
                          <p className="font-semibold text-xl">{option.label}</p>
                          <option.icon className="w-9 h-9 mx-auto mt-4 opacity-80" />
                        </div>
                        {theme === option.value && (
                          <CheckCircle className="w-8 h-8 text-indigo-400 absolute top-6 right-6" />
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
                      { code: 'en', name: 'English (United States)', flag: '🇺🇸' },
                    ].map((lang) => (
                      <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLanguage(lang.code as 'pt-BR' | 'en')}
                        className={`w-full p-8 rounded-2xl border-2 transition-all flex items-center gap-6 ${
                          language === lang.code
                            ? 'border-indigo-500 bg-gradient-to-r from-indigo-600/10 to-purple-600/5 shadow-md'
                            : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/60'
                        }`}
                      >
                        <span className="text-5xl">{lang.flag}</span>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-2xl">{lang.name}</p>
                          <p className="text-base text-zinc-400 mt-1">{lang.code.toUpperCase()}</p>
                        </div>
                        {language === lang.code && (
                          <CheckCircle className="w-10 h-10 text-indigo-400 flex-shrink-0" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </Card>
              )}

              {/* NOTIFICAÇÕES */}
              {activeSection === 'notificacoes' && (
                <Card title={t('preferenciasDeNotificacoes')} className="border-zinc-800 shadow-xl">
                  <div className="space-y-6">
                    {[
                      { title: t('novasDemandas'), desc: t('receberQuandoNovaDemandaCriada'), key: 'newDemanda' },
                      { title: t('mensagensChat'), desc: t('notificacoesNovasMensagens'), key: 'chat' },
                      { title: t('prazosProximos'), desc: t('lembretesDePrazos'), key: 'prazos' },
                      { title: t('atualizacoesSistema'), desc: t('novidadesEHavk'), key: 'system' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-xl">{item.title}</p>
                          <p className="text-base text-zinc-400 mt-2">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-16 h-8 bg-zinc-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-1.5 after:left-1.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-8"></div>
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
                    {/* Alterar senha */}
                    <div className="p-8 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-5 mb-8">
                        <Lock className="w-10 h-10 text-indigo-400" />
                        <h3 className="text-3xl font-semibold">{t('alterarSenha')}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Input
                          label={t('senhaAtual')}
                          name="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={handleChange}
                          icon={showPasswords.current ? <EyeOff /> : <Eye />}
                          onIconClick={() => togglePasswordVisibility('current')}
                          className="text-lg py-4"
                        />

                        <Input
                          label={t('novaSenha')}
                          name="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={formData.newPassword}
                          onChange={handleChange}
                          icon={showPasswords.new ? <EyeOff /> : <Eye />}
                          onIconClick={() => togglePasswordVisibility('new')}
                          className="text-lg py-4"
                        />

                        <Input
                          label={t('confirmarNovaSenha')}
                          name="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          icon={showPasswords.confirm ? <EyeOff /> : <Eye />}
                          onIconClick={() => togglePasswordVisibility('confirm')}
                          className="text-lg py-4"
                        />
                      </div>

                      <div className="mt-10 flex justify-end">
                        <Button
                          variant="primary"
                          size="xl"
                          onClick={handleChangePassword}
                          icon={<Lock className="w-6 h-6" />}
                        >
                          {t('atualizarSenha')}
                        </Button>
                      </div>
                    </div>

                    {/* 2FA */}
                    <div className="p-8 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-5 mb-8">
                        <Shield className="w-10 h-10 text-green-400" />
                        <h3 className="text-3xl font-semibold">{t('autenticacaoDoisFatores')}</h3>
                      </div>
                      <p className="text-lg text-zinc-300 mb-8">{t('2faAumentaSeguranca')}</p>
                      <Button variant="outline" size="xl" disabled>
                        {t('ativar2FA')} (em breve)
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}