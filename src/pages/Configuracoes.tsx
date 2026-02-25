import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { Settings, User, Palette, Bell, Shield, LogOut } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

export default function Configuracoes() {
  const { t } = useTranslation();
  const { user, updateUserProfile, setTheme, theme, language, setLanguage } = useAppStore();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    await updateUserProfile(formData);
  };

  const handleSaveAvatar = async () => {
    if (!user || !newAvatarUrl) return;
    await updateUserProfile({ avatar: newAvatarUrl });
    setIsAvatarModalOpen(false);
    setNewAvatarUrl('');
  };

  const handleLogout = () => {
    // Logout mock
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">{t('configuracoes')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu lateral */}
          <Card className="lg:col-span-1 h-fit">
            <nav className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800 text-left">
                <User className="w-5 h-5" /> {t('meusDados')}
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-left">
                <Palette className="w-5 h-5" /> {t('tema')}
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-left">
                <Bell className="w-5 h-5" /> {t('notificacoes')}
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-left">
                <Shield className="w-5 h-5" /> Permissões & Segurança
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 text-red-400 text-left mt-8"
              >
                <LogOut className="w-5 h-5" /> {t('logout')}
              </button>
            </nav>
          </Card>

          {/* Conteúdo principal */}
          <div className="lg:col-span-2 space-y-8">
            <Card title={t('meusDados')}>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl text-zinc-400">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <Button variant="outline" onClick={() => setIsAvatarModalOpen(true)}>
                    {t('atualizarFoto')}
                  </Button>
                </div>

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

                <Button variant="primary" onClick={handleSaveProfile}>
                  {t('salvar')}
                </Button>
              </div>
            </Card>

            <Card title={t('tema')}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['light', 'dark', 'system', 'gray'].map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th as any)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === th
                        ? 'border-zinc-100 bg-zinc-800'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`w-full h-20 rounded-lg mb-3 ${
                      th === 'light' ? 'bg-white' :
                      th === 'dark' ? 'bg-zinc-950' :
                      th === 'gray' ? 'bg-zinc-700' :
                      'bg-gradient-to-br from-white to-zinc-950'
                    }`} />
                    <p className="text-center font-medium capitalize">{t(th)}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card title={t('idioma')}>
              <div className="space-y-4">
                <button
                  onClick={() => setLanguage('pt-BR')}
                  className={`w-full p-4 rounded-lg border-2 text-left ${
                    language === 'pt-BR' ? 'border-zinc-100 bg-zinc-800' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Português (Brasil)
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`w-full p-4 rounded-lg border-2 text-left ${
                    language === 'en' ? 'border-zinc-100 bg-zinc-800' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  English
                </button>
              </div>
            </Card>
          </div>
        </div>

        <Modal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          title="Atualizar Foto de Perfil"
        >
          <div className="space-y-6">
            <Input
              label="URL da imagem (ex: link do Imgur, Cloudinary...)"
              value={newAvatarUrl}
              onChange={(e) => setNewAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAvatarModalOpen(false)}>
                {t('cancelar')}
              </Button>
              <Button variant="primary" onClick={handleSaveAvatar}>
                {t('salvar')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}