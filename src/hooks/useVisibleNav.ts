import { useMemo } from 'react';
import { NAV_GROUPS, NAV_ITEMS } from '../lib/navigation';
import { allowedPaths } from '../lib/permissions';
import { useAppStore } from '../store/useAppStore';

export function useAllowedPaths() {
  const user = useAppStore((state) => state.user);
  const membros = useAppStore((state) => state.membros);
  return useMemo(() => allowedPaths(user, membros), [membros, user]);
}

export function useVisibleNav() {
  const allowed = useAllowedPaths();
  return useMemo(() => {
    if (!allowed) return { groups: NAV_GROUPS, items: NAV_ITEMS };
    const groups = NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.has(item.to)),
    })).filter((group) => group.items.length > 0);
    return { groups, items: groups.flatMap((group) => group.items) };
  }, [allowed]);
}
