import { Outlet } from 'react-router-dom'
import Brand from '../Brand/Brand.jsx'
import { APP_TAGLINE } from '../../config/app.js'
import './AuthLayout.css'

/** Estructura de las páginas públicas (inicio de sesión y registro). */
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__intro">
        <Brand />
        <p className="auth-layout__tagline">{APP_TAGLINE}</p>
      </div>

      <div className="auth-layout__card">
        <Outlet />
      </div>

      <p className="auth-layout__footer">
        Tus datos se guardan de forma privada en tu cuenta. Nadie más puede verlos.
      </p>
    </div>
  )
}
