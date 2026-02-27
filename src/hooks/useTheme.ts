import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const useTheme = () => {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    const applyTheme = () => {
      // Remove todas as classes anteriores
      document.documentElement.classList.remove('light', 'dark', 'gray', 'system');

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.classList.add(theme);
      }

      // Garante que o body reflita o tema
      document.body.className = theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : theme;
    };

    applyTheme();

    // Listener para mudanças no tema do sistema (quando theme = system)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  return {
    theme,
    setTheme,
  };
};