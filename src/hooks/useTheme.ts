import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const useTheme = () => {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    // Aplica o tema inicial e monitora mudanças do sistema
    const applyTheme = () => {
      document.documentElement.classList.remove('light', 'dark', 'gray');

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.classList.add(theme);
      }
    };

    applyTheme();

    // Listener para mudanças no prefers-color-scheme (quando theme = system)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return {
    theme,
    setTheme,
  };
};