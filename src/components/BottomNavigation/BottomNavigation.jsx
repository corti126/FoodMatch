import { NavLink } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'
import { NAV_ITEMS } from '../../config/navigation.js'
import './BottomNavigation.css'

/** Barra de navegación inferior (solo mobile), con área segura para iPhone. */
export default function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            isActive ? 'bottom-nav__link bottom-nav__link--active' : 'bottom-nav__link'
          }
        >
          <Icon name={item.icon} size={21} />
          <span>{item.shortLabel}</span>
        </NavLink>
      ))}
    </nav>
  )
}
