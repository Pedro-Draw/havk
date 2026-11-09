import { useId, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function useResponsaveis() {
  const membros = useAppStore((state) => state.membros);
  const user = useAppStore((state) => state.user);
  return useMemo(() => {
    const names = new Map<string, string>();
    const add = (name?: string) => {
      const clean = (name || '').trim();
      if (clean) names.set(clean.toLowerCase(), clean);
    };
    add(user?.name);
    membros.forEach((member) => add(member.name));
    return [...names.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [membros, user?.name]);
}

export default function ResponsavelField({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const listId = useId();
  const names = useResponsaveis();

  return (
    <>
      <input
        className={className}
        list={listId}
        value={value}
        placeholder="Escreva ou escolha uma pessoa"
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {names.map((name) => <option key={name} value={name} />)}
      </datalist>
    </>
  );
}
