import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/app.js'
import './Brand.css'

/**
 * Identidad de la aplicación. El nombre se centraliza en config/app.js (APP_NAME)
 * para poder cambiarlo en un solo lugar.
 */
export default function Brand({ compact = false }) {
  return (
    <Link to="/" className={compact ? 'brand brand--compact' : 'brand'} aria-label={`${APP_NAME} — Inicio`}>
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M16 9c4 2.5 5.5 6 5.5 9a5.5 5.5 0 0 1-11 0c0-3 1.5-6.5 5.5-9z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="brand__name">{APP_NAME}</span>
    </Link>
  )
}
