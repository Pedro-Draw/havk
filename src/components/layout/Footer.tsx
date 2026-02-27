import { useTranslation } from '../../i18n/useTranslation';
import { Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 py-8 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo e copyright */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white">Havk</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {t('footer.copyright', { year: currentYear }) || `© ${currentYear} Havk. Todos os direitos reservados.`}
            </p>
          </div>

          {/* Links sociais */}
          <div className="flex items-center gap-6">
            <a href="https://github.com/pedro-draw" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              <Github className="w-6 h-6" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="mailto:contato@havk.app" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              <Mail className="w-6 h-6" />
            </a>
          </div>

          {/* Links úteis */}
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-200 transition-colors">{t('footer.terms') || 'Termos'}</a>
            <a href="#" className="hover:text-zinc-200 transition-colors">{t('footer.privacy') || 'Privacidade'}</a>
            <a href="#" className="hover:text-zinc-200 transition-colors">{t('footer.help') || 'Ajuda'}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}