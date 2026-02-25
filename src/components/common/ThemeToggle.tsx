import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn'; // caminho correto (ajuste se necessário)

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Claro' },
    { value: 'dark' as const, icon: Moon, label: 'Escuro' },
    { value: 'system' as const, icon: Monitor, label: 'Sistema' },
    { value: 'gray' as const, icon: Monitor, label: 'Cinza' }, // adicionado gray conforme seu pedido
  ];

  return (
    <div className="flex items-center bg-zinc-800 rounded-lg p-1 border border-zinc-700 shadow-sm">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            theme === value
              ? 'bg-zinc-700 text-zinc-100 shadow-inner'
              : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 hover:shadow-sm'
          )}
          aria-label={`Alternar para tema ${label}`}
          title={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}