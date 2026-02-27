import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { Settings, User, Palette, Bell, Shield, LogOut, Camera } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

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

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar || '');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
      setPreviewAvatar(user.avatar || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewAvatar(base64);

      const updatedUser = {
        ...user,
        avatar: base64,
      };

      setUser(updatedUser);
      localStorage.setItem('havk-storage', JSON.stringify({
        ...JSON.parse(localStorage.getItem('havk-storage') || '{}'),
        state: {
          ...useAppStore.getState(),
          user: updatedUser,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      name: formData.name,
      email: formData.email,
    };

    setUser(updatedUser);

    localStorage.setItem('havk-storage', JSON.stringify({
      ...JSON.parse(localStorage.getItem('havk-storage') || '{}'),
      state: {
        ...useAppStore.getState(),
        user: updatedUser,
      },
    }));

    alert(t('perfilAtualizado') || 'Perfil atualizado com sucesso!');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-20 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">{t('configuracoes')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 h-fit sticky top-20">
            <nav className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800 text-left font-medium">
                <User className="w-5 h-5" /> {t('meusDados')}
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-left">
                <Palette className="w-5 h-5" /> {t('tema')}
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-left">
                <Bell className="w-5 h-5" /> {t('notificacoes')}
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-left">
                <Shield className="w-5 h-5" /> {t('permissoesSeguranca') || 'Permissões & Segurança'}
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 text-red-400 text-left mt-8"
              >
                <LogOut className="w-5 h-5" /> {t('logout')}
              </button>
            </nav>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            <Card title={t('meusDados')}>
              <div className="space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    {previewAvatar ? (
                      <img
                        src={previewAvatar}
                        alt="Foto de perfil"
                        className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700 shadow-lg transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center text-5xl text-zinc-400 border-4 border-zinc-700 shadow-lg">
                        {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-zinc-800 p-3 rounded-full shadow-lg hover:bg-zinc-700 transition-colors"
                    >
                      <Camera className="w-6 h-6" />
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <p className="text-sm text-zinc-400">
                    {t('cliqueParaAlterarFoto') || 'Clique na câmera para escolher foto da galeria'}
                  </p>
                </div>

                <div className="space-y-6">
                  <Input
                    label={t('name')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                  />

                  <Input
                    label={t('email')}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                  />

                  <Button variant="primary" onClick={handleSaveProfile} fullWidth>
                    {t('salvarAlteracoes')}
                  </Button>
                </div>
              </div>
            </Card>

            <Card title={t('tema')}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['light', 'dark', 'system', 'gray'].map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th as 'light' | 'dark' | 'system' | 'gray')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                      theme === th
                        ? 'border-zinc-100 bg-zinc-800 shadow-inner'
                        : 'border-zinc-800 hover:border-zinc-700 hover:shadow-md'
                    }`}
                  >
                    <div
                      className={`w-20 h-20 rounded-lg shadow-inner ${
                        th === 'light'
                          ? 'bg-white'
                          : th === 'dark'
                          ? 'bg-zinc-950'
                          : th === 'gray'
                          ? 'bg-zinc-700'
                          : 'bg-gradient-to-br from-white to-zinc-950'
                      }`}
                    />
                    <p className="font-medium capitalize">{t(th)}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card title={t('idioma')}>
              <div className="space-y-4">
                <button
                  onClick={() => setLanguage('pt-BR')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    language === 'pt-BR'
                      ? 'border-zinc-100 bg-zinc-800'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Português (Brasil)
                </button>

                <button
                  onClick={() => setLanguage('en')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    language === 'en'
                      ? 'border-zinc-100 bg-zinc-800'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  English
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}