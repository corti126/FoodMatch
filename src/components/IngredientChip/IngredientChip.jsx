import Icon from '../Icon/Icon.jsx'
import './IngredientChip.css'

/**
 * Etiqueta visual de un ingrediente seleccionado.
 * `variant` permite distinguir "tenido" de "faltante" en resultados.
 */
export default function IngredientChip({
  name,
  onRemove,
  variant = 'default',
  title,
}) {
  const variantClass =
    variant === 'missing'
      ? 'ingredient-chip ingredient-chip--missing'
      : variant === 'plain'
        ? 'ingredient-chip ingredient-chip--plain'
        : 'ingredient-chip'

  return (
    <span className={variantClass} title={title || name}>
      <span className="ingredient-chip__label">{name}</span>
      {onRemove && (
        <button
          type="button"
          className="ingredient-chip__remove"
          onClick={onRemove}
          aria-label={`Quitar ${name}`}
        >
          <Icon name="x" size={13} />
        </button>
      )}
    </span>
  )
}
