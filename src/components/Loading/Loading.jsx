import './Loading.css'

/**
 * Indicador de carga reutilizable.
 * `fullScreen` se usa como fallback de rutas lazy y de autenticación.
 */
export default function Loading({ label = 'Cargando...', fullScreen = false }) {
  return (
    <div
      className={fullScreen ? 'loading loading--fullscreen' : 'loading'}
      role="status"
      aria-live="polite"
    >
      <span className="loading__spinner" aria-hidden="true" />
      <span className="loading__label">{label}</span>
    </div>
  )
}
