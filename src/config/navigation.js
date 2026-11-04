// Secciones principales de la aplicación.
// Compartidas por Sidebar (desktop) y BottomNavigation (mobile).
export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', shortLabel: 'Inicio', icon: 'home' },
  { to: '/buscar', label: 'Buscar recetas', shortLabel: 'Buscar', icon: 'search' },
  { to: '/despensa', label: 'Mi despensa', shortLabel: 'Despensa', icon: 'jar' },
  { to: '/favoritos', label: 'Favoritos', shortLabel: 'Favoritos', icon: 'heart' },
  { to: '/perfil', label: 'Mi perfil', shortLabel: 'Perfil', icon: 'user' },
]

/** Título de sección para el encabezado, según la ruta. */
export function getSectionTitle(pathname) {
  if (pathname.startsWith('/receta/')) return 'Receta'
  const item = NAV_ITEMS.find(
    (nav) => nav.to === '/' ? pathname === '/' : pathname.startsWith(nav.to),
  )
  return item ? item.label : ''
}
