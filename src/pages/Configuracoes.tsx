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
import { motion, AnimatePresence } from 'framer-motion'; // Instale: npm i framer-motion

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
      // Persistência já acontece via middleware + IndexedDB
      await new Promise((r) => setTimeout(r, 800)); // simula delay real

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

    // Aqui iria chamada real para API de mudança de senha
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
      // Futuro: demandas, projetos, etc.
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

    // Simulação de exclusão
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
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-24 bg-gradient-to-b from-zinc-950 to-zinc-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
            <Settings className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {t('configuracoes')}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navegação lateral */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card className="border-zinc-800 h-fit lg:sticky lg:top-24">
              <nav className="p-3 space-y-1.5">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-200 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border-l-4 border-indigo-500 text-white shadow-md'
                        : 'hover:bg-zinc-800/70 text-zinc-300'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.label}</span>
                  </button>
                ))}

                <div className="pt-10 px-2 border-t border-zinc-800 mt-6">
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Download className="w-5 h-5" />}
                    onClick={handleExportData}
                    className="mb-3 justify-start"
                  >
                    {t('exportarMeusDados')}
                  </Button>

                  <Button
                    variant="destructive"
                    fullWidth
                    icon={<Trash2 className="w-5 h-5" />}
                    onClick={handleDeleteAccount}
                    className="justify-start"
                  >
                    {t('excluirConta')}
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
              <Card title={t('informacoesPessoais')} className="border-zinc-800">
                <div className="space-y-12">
                  {/* Avatar */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                    <div className="relative group">
                      <div className="relative">
                        {previewAvatar ? (
                          <img
                            src={previewAvatar}
                            alt="Foto de perfil"
                            className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover border-4 border-zinc-700 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-2 group-hover:shadow-indigo-500/40"
                          />
                        ) : (
                          <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-6xl md:text-8xl text-zinc-500 border-4 border-zinc-700 shadow-2xl">
                            {formData.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-4 -right-4 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full shadow-xl hover:scale-110 transition-all ring-4 ring-zinc-900"
                          aria-label={t('alterarFotoPerfil')}
                        >
                          <Camera className="w-7 h-7 text-white" />
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

                    <div className="text-center md:text-left space-y-3">
                      <h3 className="text-2xl font-bold">{formData.name || t('seuNome')}</h3>
                      <p className="text-zinc-400 flex items-center gap-2 justify-center md:justify-start">
                        <Mail className="w-5 h-5" /> {user?.email}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {t('membroDesde')} {new Date(user?.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Formulário */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label={t('nomeCompleto')}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('digiteSeuNomeCompleto')}
                      icon={<User className="w-5 h-5" />}
                      required
                    />

                    <Input
                      label={t('email')}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('seuEmailPrincipal')}
                      icon={<Mail className="w-5 h-5" />}
                      disabled
                      helperText={t('emailNaoPodeSerAlteradoAinda')}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSaveProfile}
                      loading={isSaving}
                      disabled={isSaving}
                      icon={<CheckCircle className="w-5 h-5" />}
                    >
                      {t('salvarAlteracoes')}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* TEMA */}
            {activeSection === 'tema' && (
              <Card title={t('aparenciaDaAplicacao')} className="border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { value: 'light', label: t('claro'), icon: Sun, preview: 'bg-white border-zinc-300' },
                    { value: 'dark', label: t('escuro'), icon: Moon, preview: 'bg-zinc-950 border-zinc-700' },
                    { value: 'system', label: t('seguirSistema'), icon: Monitor, preview: 'bg-gradient-to-br from-white to-zinc-950 border-zinc-500' },
                    { value: 'gray', label: t('cinzaNeutro'), icon: Palette, preview: 'bg-zinc-800 border-zinc-600' },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme(option.value as any)}
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-5 shadow-md ${
                        theme === option.value
                          ? 'border-indigo-500 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-indigo-500/30 ring-2 ring-indigo-500/50'
                          : 'border-zinc-800 hover:border-zinc-600 hover:shadow-xl bg-zinc-900/70'
                      }`}
                    >
                      <div className={`w-24 h-24 rounded-xl shadow-inner border ${option.preview}`} />
                      <div className="text-center">
                        <p className="font-semibold text-lg">{option.label}</p>
                        <option.icon className="w-7 h-7 mx-auto mt-3 opacity-80" />
                      </div>
                      {theme === option.value && (
                        <CheckCircle className="w-6 h-6 text-indigo-400 absolute top-4 right-4" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </Card>
            )}

            {/* IDIOMA */}
            {activeSection === 'idioma' && (
              <Card title={t('idiomaDaInterface')} className="border-zinc-800">
                <div className="space-y-5 max-w-lg">
                  {[
                    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
                    { code: 'en', name: 'English (United States)', flag: '🇺🇸' },
                  ].map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLanguage(lang.code as 'pt-BR' | 'en')}
                      className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-5 ${
                        language === lang.code
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-600/10 to-purple-600/5 shadow-md'
                          : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/60'
                      }`}
                    >
                      <span className="text-4xl">{lang.flag}</span>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-xl">{lang.name}</p>
                        <p className="text-sm text-zinc-400">{lang.code.toUpperCase()}</p>
                      </div>
                      {language === lang.code && (
                        <CheckCircle className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </Card>
            )}

            {/* NOTIFICAÇÕES */}
            {activeSection === 'notificacoes' && (
              <Card title={t('preferenciasDeNotificacoes')} className="border-zinc-800">
                <div className="space-y-6">
                  {[
                    { title: t('novasDemandas'), desc: t('receberQuandoNovaDemandaCriada'), key: 'newDemanda' },
                    { title: t('mensagensChat'), desc: t('notificacoesNovasMensagens'), key: 'chat' },
                    { title: t('prazosProximos'), desc: t('lembretesDePrazos'), key: 'prazos' },
                    { title: t('atualizacoesSistema'), desc: t('novidadesEHavk'), key: 'system' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-lg">{item.title}</p>
                        <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-14 h-7 bg-zinc-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* SEGURANÇA */}
            {activeSection === 'seguranca' && (
              <Card title={t('segurancaDaConta')} className="border-zinc-800">
                <div className="space-y-10">
                  {/* Alterar senha */}
                  <div className="p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-4 mb-6">
                      <Lock className="w-8 h-8 text-indigo-400" />
                      <h3 className="text-2xl font-semibold">{t('alterarSenha')}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Input
                        label={t('senhaAtual')}
                        name="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={handleChange}
                        icon={showPasswords.current ? <EyeOff /> : <Eye />}
                        onIconClick={() => togglePasswordVisibility('current')}
                      />

                      <Input
                        label={t('novaSenha')}
                        name="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={handleChange}
                        icon={showPasswords.new ? <EyeOff /> : <Eye />}
                        onIconClick={() => togglePasswordVisibility('new')}
                      />

                      <Input
                        label={t('confirmarNovaSenha')}
                        name="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        icon={showPasswords.confirm ? <EyeOff /> : <Eye />}
                        onIconClick={() => togglePasswordVisibility('confirm')}
                      />
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button
                        variant="primary"
                        onClick={handleChangePassword}
                        icon={<Lock className="w-5 h-5" />}
                      >
                        {t('atualizarSenha')}
                      </Button>
                    </div>
                  </div>

                  {/* 2FA e outras opções */}
                  <div className="p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-4 mb-6">
                      <Shield className="w-8 h-8 text-green-400" />
                      <h3 className="text-2xl font-semibold">{t('autenticacaoDoisFatores')}</h3>
                    </div>
                    <p className="text-zinc-300 mb-6">{t('2faAumentaSeguranca')}</p>
                    <Button variant="outline" disabled>
                      {t('ativar2FA')} (em breve)
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}