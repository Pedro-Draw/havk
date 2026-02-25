import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';

export const useLanguage = () => {
  const { language, setLanguage } = useAppStore();
  const { t, translateUserContent } = useTranslation();

  const changeLanguage = async (newLang: 'pt-BR' | 'en') => {
    if (newLang !== language) {
      await setLanguage(newLang);
      // Força re-render se necessário (Zustand já cuida disso)
      document.documentElement.lang = newLang;
    }
  };

  return {
    language,
    changeLanguage,
    t,
    translateUserContent,
  };
};