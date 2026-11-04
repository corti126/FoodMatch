import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'
import { useFavorites } from '../../hooks/useFavorites.js'
import './RecipeCard.css'

const MAX_CHIPS = 3

/**
 * Tarjeta de receta. Muestra imagen, nombre, tiempo, coincidencia de
 * ingredientes (solo cuando la API la informa) y acciones:
 * ver receta y agregar/quitar de favoritos.
 */
export default function RecipeCard({ recipe }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [actionError, setActionError] = useState(null)

  const favorite = isFavorite(recipe.id)
  const used = recipe.usedIngredients || []
  const missing = recipe.missingIngredients || []
  const hasMatch = typeof recipe.matchPercent === 'number'
  const totalIngredients = used.length + missing.length

  const handleToggleFavorite = async () => {
    setActionError(null)
    try {
      await toggleFavorite(recipe)
    } catch {
      setActionError('No se pudo actualizar el favorito. Intentá de nuevo.')
    }
  }

  return (
    <article className="recipe-card">
      <Link
        to={`/receta/${recipe.id}`}
        className="recipe-card__media"
        aria-label={`Ver receta: ${recipe.title}`}
      >
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            decoding="async"
            className="recipe-card__image"
          />
        ) : (
          <span className="recipe-card__image recipe-card__image--placeholder">
            <Icon name="image" size={28} />
          </span>
        )}
        {typeof recipe.readyInMinutes === 'number' && (
          <span className="recipe-card__time">
            <Icon name="clock" size={13} />
            {recipe.readyInMinutes} min
          </span>
        )}
      </Link>

      <div className="recipe-card__body">
        <h3 className="recipe-card__title">
          <Link to={`/receta/${recipe.id}`}>{recipe.title}</Link>
        </h3>

        {hasMatch && (
          <div className="recipe-card__match">
            <div className="recipe-card__match-bar" aria-hidden="true">
              <span style={{ width: `${recipe.matchPercent}%` }} />
            </div>
            <span className="recipe-card__match-text">
              Tengo {used.length} de {totalIngredients} ingredientes
              <strong> · {recipe.matchPercent}%</strong>
            </span>
          </div>
        )}

        {hasMatch && (
          <div className="recipe-card__ingredients">
            {used.length > 0 && (
              <div className="recipe-card__ingredient-group">
                <span className="recipe-card__ingredient-label">
                  <Icon name="check" size={13} /> Tenés
                </span>
                <div className="recipe-card__chips">
                  {used.slice(0, MAX_CHIPS).map((item) => (
                    <span key={item.id} className="recipe-card__chip">
                      {item.name}
                    </span>
                  ))}
                  {used.length > MAX_CHIPS && (
                    <span className="recipe-card__chip recipe-card__chip--more">
                      +{used.length - MAX_CHIPS}
                    </span>
                  )}
                </div>
              </div>
            )}

            {missing.length > 0 && (
              <div className="recipe-card__ingredient-group">
                <span className="recipe-card__ingredient-label recipe-card__ingredient-label--missing">
                  <Icon name="x" size={13} /> Faltan
                </span>
                <div className="recipe-card__chips">
                  {missing.slice(0, MAX_CHIPS).map((item) => (
                    <span key={item.id} className="recipe-card__chip recipe-card__chip--missing">
                      {item.name}
                    </span>
                  ))}
                  {missing.length > MAX_CHIPS && (
                    <span className="recipe-card__chip recipe-card__chip--missing recipe-card__chip--more">
                      +{missing.length - MAX_CHIPS}
                    </span>
                  )}
                </div>
              </div>
            )}

            {missing.length === 0 && (
              <span className="recipe-card__ready">
                <Icon name="checkCircle" size={14} /> Podés prepararla con lo que tenés
              </span>
            )}
          </div>
        )}

        {actionError && (
          <p className="recipe-card__error" role="alert">
            {actionError}
          </p>
        )}

        <div className="recipe-card__actions">
          <Link to={`/receta/${recipe.id}`} className="btn btn-primary btn-sm">
            Ver receta
          </Link>
          <button
            type="button"
            className={`recipe-card__fav${favorite ? ' recipe-card__fav--active' : ''}`}
            onClick={handleToggleFavorite}
            aria-pressed={favorite}
            aria-label={
              favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
            }
            title={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Icon name="heart" size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}
