import { useAppStore } from '../store/useAppStore';
import ptBR from './translations/pt-BR';
import en from './translations/en';

const translations = {
  'pt-BR': ptBR,
  en: en,
};

export const useTranslation = () => {
  const { language, translateContent } = useAppStore();

  const t = (key: string, params?: Record<string, any>): string => {
    const dict = translations[language] || translations['pt-BR'];
    let text = dict[key as keyof typeof dict] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    return text;
  };

  const translateUserContent = (text: string | undefined): string => {
    if (!text) return '';
    return translateContent(text, language);
  };

  return { t, translateUserContent, language };
};