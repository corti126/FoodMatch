import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../Brand/Brand.jsx'
import Icon from '../Icon/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { getSectionTitle } from '../../config/navigation.js'
import './Header.css'

/**
 * Encabezado: identidad (mobile), sección actual (desktop),
 * información del usuario y acceso al perfil / cierre de sesión.
 */
export default function Header() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Cierra el menú al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!menuOpen) return undefined

    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/ingresar', { replace: true })
  }

  const sectionTitle = getSectionTitle(pathname)
  const email = user?.email || ''
  const initial = (user?.displayName || email || '?').trim().charAt(0).toUpperCase()

  return (
    <header className="header">
      <div className="header__left">
        <span className="header__brand">
          <Brand compact />
        </span>
        <span className="header__section">{sectionTitle}</span>
      </div>

      <div className="header__right" ref={menuRef}>
        <button
          type="button"
          className="user-menu__button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menú de usuario"
        >
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="user-menu__email">{email}</span>
          <Icon name="chevronDown" size={16} />
        </button>

        {menuOpen && (
          <div className="user-menu__dropdown" role="menu">
            <p className="user-menu__account">
              <span className="user-menu__account-label">Sesión iniciada como</span>
              <span className="user-menu__account-email">{email}</span>
            </p>
            <Link
              to="/perfil"
              className="user-menu__item"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <Icon name="user" size={17} />
              Mi perfil
            </Link>
            <button
              type="button"
              className="user-menu__item user-menu__item--danger"
              role="menuitem"
              onClick={handleLogout}
            >
              <Icon name="logout" size={17} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
