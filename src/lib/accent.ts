export const ACCENTS = [
  { id: 'violet', label: 'Violeta', color: '#8B5CF6', ink: '#5B21B6' },
  { id: 'indigo', label: 'Índigo', color: '#6366F1', ink: '#3730A3' },
  { id: 'blue', label: 'Azul', color: '#3B82F6', ink: '#1D4ED8' },
  { id: 'cyan', label: 'Ciano', color: '#06B6D4', ink: '#0E7490' },
  { id: 'emerald', label: 'Esmeralda', color: '#10B981', ink: '#047857' },
  { id: 'amber', label: 'Âmbar', color: '#F59E0B', ink: '#B45309' },
  { id: 'rose', label: 'Rosa', color: '#F43F5E', ink: '#BE123C' },
  { id: 'slate', label: 'Grafite', color: '#A1A1AA', ink: '#3F3F46' },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];

const STORAGE_KEY = 'havk-accent';

export function readAccent(): AccentId {
  const saved = localStorage.getItem(STORAGE_KEY);
  return ACCENTS.some((item) => item.id === saved) ? (saved as AccentId) : 'violet';
}

export function applyAccent(id: AccentId) {
  const accent = ACCENTS.find((item) => item.id === id) || ACCENTS[0];
  const root = document.documentElement;
  root.dataset.accent = accent.id;
  root.style.setProperty('--primary', accent.color);
  root.style.setProperty('--primary-ink', accent.ink);
}

export function saveAccent(id: AccentId) {
  localStorage.setItem(STORAGE_KEY, id);
  applyAccent(id);
}

applyAccent(readAccent());
