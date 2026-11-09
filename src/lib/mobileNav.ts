export const MOBILE_MENU_EVENT = 'mobile-menu-state'

export function setMobileMenuOpen(open: boolean) {
  window.dispatchEvent(new CustomEvent<boolean>(MOBILE_MENU_EVENT, { detail: open }))
}

export const PRIMARY_ROUTES = new Set([
  '/',
  '/inbox',
  '/demandas',
  '/projetos',
  '/kanban',
  '/calendario',
  '/gantt',
  '/tempo',
  '/ia',
  '/notas',
  '/templates',
  '/objetivos',
  '/relatorios',
  '/equipe',
  '/empresas',
  '/chat',
  '/configuracoes',
])

export function screenParent(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  parts.pop()
  return parts.length ? `/${parts.join('/')}` : '/'
}
