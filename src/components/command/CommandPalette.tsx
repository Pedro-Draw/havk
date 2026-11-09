import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { NAV_ITEMS, OPEN_COMMAND_EVENT } from '../../lib/navigation';
import { useVisibleNav } from '../../hooks/useVisibleNav';
import { PLACES_EVENT, favorites, recents, toggleFavorite } from '../../lib/places';

interface CommandItem {
  id: string;
  label: string;
  hint: string;
  path?: string;
  run?: () => void;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState({ favorite: favorites(), recent: recents() });
  const demandas = useAppStore((state) => state.demandas);
  const projetos = useAppStore((state) => state.projetos);
  const notas = useAppStore((state) => state.notas);
  const templates = useAppStore((state) => state.templates);
  const membros = useAppStore((state) => state.membros);
  const empresas = useAppStore((state) => state.empresas);
  const { items: pagesNav } = useVisibleNav();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    const onPlaces = () => setPlaces({ favorite: favorites(), recent: recents() });
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
    window.addEventListener(PLACES_EVENT, onPlaces);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
      window.removeEventListener(PLACES_EVENT, onPlaces);
    };
  }, []);

  const items = useMemo<CommandItem[]>(() => {
    const term = query.trim().toLowerCase();
    const visible = new Set(pagesNav.map((item) => item.to));
    const canOpen = (path: string) => !NAV_ITEMS.some((item) => item.to === path) || visible.has(path);
    const labelFor = (path: string) => pagesNav.find((item) => item.to === path)?.label || NAV_ITEMS.find((item) => item.to === path)?.label || path;
    const pinned: CommandItem[] = [
      ...places.favorite.filter(canOpen).map((path) => ({ id: `fav-${path}`, label: labelFor(path), hint: 'Favorito', path })),
      ...places.recent.filter((path) => !places.favorite.includes(path) && canOpen(path)).map((path) => ({ id: `recent-${path}`, label: labelFor(path), hint: 'Recente', path })),
    ];
    const pages: CommandItem[] = pagesNav.map((item) => ({
      id: `page-${item.to}`,
      label: item.label,
      hint: 'Página',
      path: item.to,
    }));
    const favorite = places.favorite.includes(location.pathname);
    const actions: CommandItem[] = [
      { id: 'fav-page', label: favorite ? 'Remover dos favoritos' : 'Favoritar esta página', hint: 'Ação', run: () => toggleFavorite(location.pathname) },
      { id: 'new-demanda', label: 'Criar demanda', hint: 'Ação', path: '/demandas/nova' },
      { id: 'new-projeto', label: 'Criar projeto', hint: 'Ação', path: '/projetos' },
      { id: 'new-nota', label: 'Criar nota', hint: 'Ação', path: '/notas' },
    ];
    const records: CommandItem[] = [
      ...demandas.map((item) => ({ id: `d-${item.id}`, label: item.title || 'Demanda', hint: 'Demanda', path: `/demandas/${item.id}` })),
      ...projetos.map((item) => ({ id: `p-${item.id}`, label: item.name || 'Projeto', hint: 'Projeto', path: '/projetos' })),
      ...notas.map((item) => ({ id: `n-${item.id}`, label: item.title || 'Nota', hint: 'Nota', path: '/notas' })),
      ...templates.map((item) => ({ id: `t-${item.id}`, label: item.name || 'Template', hint: 'Template', path: '/templates' })),
      ...membros.map((item) => ({ id: `m-${item.id}`, label: item.name || item.email, hint: 'Pessoa', path: '/equipe' })),
      ...empresas.map((item) => ({ id: `e-${item.id}`, label: item.name, hint: 'Empresa', path: '/empresas' })),
    ];

    return [...pinned, ...actions, ...pages, ...records]
      .filter((item) => !term || `${item.label} ${item.hint}`.toLowerCase().includes(term))
      .slice(0, 12);
  }, [demandas, empresas, location.pathname, membros, notas, pagesNav, places.favorite, places.recent, projetos, query, templates]);

  if (!open) return null;

  return (
    <div data-havk-overlay className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 px-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        className="glass-popover w-full max-w-xl overflow-hidden rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar páginas, demandas, projetos, pessoas..."
          className="havk-field rounded-none border-0 bg-transparent px-4 py-4 text-base"
        />
        <div className="overlay-scroll max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">Nenhum resultado</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[var(--hover)]"
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                  if (item.run) item.run();
                  else if (item.path) navigate(item.path);
                }}
              >
                <span className="truncate text-sm">{item.label}</span>
                <span className="ml-3 shrink-0 text-xs text-[var(--text-muted)]">{item.hint}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
