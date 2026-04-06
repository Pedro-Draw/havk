import { useAppStore } from '../store/useAppStore';
import ptBR from './translations/pt-BR';
import en from './translations/en';

const translations: Record<string, any> = {
  'pt-BR': ptBR,
  en: en,
};

// Resolve chaves aninhadas como "sidebar.dashboard" ou "footer.copyright"
function getNestedValue(obj: any, key: string): string | undefined {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export const useTranslation = () => {
  const { language, translateContent } = useAppStore();

  const t = (key: string, params?: Record<string, any>): string => {
    const dict = translations[language] || translations['pt-BR'];

    // Tenta chave aninhada primeiro (ex: "sidebar.dashboard")
    let text = getNestedValue(dict, key);

    // Fallback para chave plana
    if (text === undefined) {
      const flat = dict[key as keyof typeof dict];
      text = typeof flat === 'string' ? flat : undefined;
    }

    // Fallback para pt-BR se não encontrou na língua atual
    if (text === undefined && language !== 'pt-BR') {
      const fallbackDict = translations['pt-BR'];
      text = getNestedValue(fallbackDict, key);
      if (text === undefined) {
        const flat = fallbackDict[key as keyof typeof fallbackDict];
        text = typeof flat === 'string' ? flat : undefined;
      }
    }

    // Último fallback: retorna a própria chave
    let result = text ?? key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    return result;
  };

  const translateUserContent = (text: string | undefined): string => {
    if (!text) return '';
    return translateContent(text, language);
  };

  const i18n = {
    changeLanguage: (lang: 'pt-BR' | 'en') => {
      useAppStore.getState().setLanguage(lang);
    },
  };

  return { t, translateUserContent, language, i18n };
};
