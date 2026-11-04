import { Link } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import './NotFound.css'

export default function NotFound() {
  usePageTitle('Página no encontrada')

  return (
    <div className="not-found">
      <span className="not-found__icon" aria-hidden="true">
        <Icon name="search" size={28} />
      </span>
      <h1 className="not-found__title">No encontramos esa página</h1>
      <p className="not-found__text">
        El enlace puede estar desactualizado o la receta ya no está disponible.
      </p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  )
}
