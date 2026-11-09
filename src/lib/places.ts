const FAVORITES_KEY = 'havk-favorites';
const RECENTS_KEY = 'havk-recents';
export const PLACES_EVENT = 'havk-places';

function read(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function write(key: string, values: string[]) {
  localStorage.setItem(key, JSON.stringify(values));
  window.dispatchEvent(new Event(PLACES_EVENT));
}

export function favorites() {
  return read(FAVORITES_KEY);
}

export function recents() {
  return read(RECENTS_KEY);
}

export function isFavorite(path: string) {
  return favorites().includes(path);
}

export function toggleFavorite(path: string) {
  const current = favorites();
  write(
    FAVORITES_KEY,
    current.includes(path) ? current.filter((item) => item !== path) : [path, ...current].slice(0, 12)
  );
}

export function rememberPlace(path: string) {
  if (!path || path.startsWith('/login') || path.startsWith('/signup')) return;
  write(RECENTS_KEY, [path, ...recents().filter((item) => item !== path)].slice(0, 8));
}
