import Icon from '../Icon/Icon.jsx'
import './EmptyState.css'

/**
 * Estado vacío reutilizable: explica qué ocurrió y qué hacer a continuación.
 */
export default function EmptyState({
  icon = 'info',
  title,
  description,
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
