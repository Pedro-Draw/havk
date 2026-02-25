import { useAppStore } from '../store/useAppStore';
import ptBR from './translations/pt-BR';
import en from './translations/en';

const translations = {
  'pt-BR': ptBR,
  en: en,
};

export const useTranslation = () => {
  const { language, translateContent } = useAppStore();

  const t = (key: string): string => {
    const dict = translations[language] || translations['pt-BR'];
    return dict[key as keyof typeof dict] || key;
  };

  const translateUserContent = (text: string) => {
    return translateContent(text, language);
  };

  return { t, translateUserContent, language };
};