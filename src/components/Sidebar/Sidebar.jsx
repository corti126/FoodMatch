import { NavLink } from 'react-router-dom'
import Brand from '../Brand/Brand.jsx'
import Icon from '../Icon/Icon.jsx'
import { NAV_ITEMS } from '../../config/navigation.js'
import { SPOONACULAR_ATTRIBUTION } from '../../config/app.js'
import './Sidebar.css'

/** Navegación lateral fija (solo desktop). */
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Brand />

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <footer className="sidebar__footer">
        <a
          href={SPOONACULAR_ATTRIBUTION.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          {SPOONACULAR_ATTRIBUTION.text}
        </a>
      </footer>
    </aside>
  )
}
