import Icon from '../Icon/Icon.jsx'
import './ErrorMessage.css'

/**
 * Mensaje de error amigable en español: explica qué pasó y cómo continuar.
 * Nunca expone detalles técnicos crudos al usuario.
 */
export default function ErrorMessage({
  title = 'No pudimos completar la operación',
  message,
  onRetry,
}) {
  return (
    <div className="error-message" role="alert">
      <span className="error-message__icon" aria-hidden="true">
        <Icon name="alert" size={22} />
      </span>
      <div className="error-message__body">
        <p className="error-message__title">{title}</p>
        {message && <p className="error-message__text">{message}</p>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Reintentar
        </button>
      )}
    </div>
  )
}
