import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import NutritionInfo from '../../components/NutritionInfo/NutritionInfo.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import Skeleton from '../../components/Skeleton/Skeleton.jsx'
import { useFavorites } from '../../hooks/useFavorites.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import {
  getErrorMessage,
  getIngredientMatch,
  getRecipeDetail,
} from '../../services/recipes.js'
import { SPOONACULAR_ATTRIBUTION } from '../../config/app.js'
import './RecipeDetail.css'

// Etiquetas de dietas de Spoonacular traducidas para mostrar en la interfaz.
const DIET_LABELS = {
  vegetarian: 'Vegetariana',
  vegan: 'Vegana',
  pescetarian: 'Pescetariana',
  'gluten free': 'Sin gluten',
  'dairy free': 'Sin lácteos',
  ketogenic: 'Cetogénica',
  paleo: 'Paleo',
  primal: 'Primal',
  'whole 30': 'Whole30',
  'lacto vegetarian': 'Vegetariana lacto',
  'ovo vegetarian': 'Vegetariana ovo',
  'low fodmap': 'Bajo en FODMAP',
}

/** Convierte HTML de Spoonacular a texto plano seguro (sin ejecutar HTML). */
function htmlToPlainText(html) {
  return String(html)
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Escala una cantidad según las porciones elegidas. */
function scaleAmount(amount, factor) {
  const value = Number(amount) * factor
  if (!Number.isFinite(value)) return null
  if (Number.isInteger(value)) return String(value)
  return value
    .toFixed(value < 1 ? 2 : 1)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')
}

export default function RecipeDetail() {
  const { id } = useParams()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [reloadKey, setReloadKey] = useState(0)
  // El resultado se asocia a la clave de la petición (id + intento): así el
  // estado de carga y los datos se derivan sin resetearlos en un efecto.
  const requestKey = `${id}:${reloadKey}`
  const [result, setResult] = useState({ key: null, detail: null, error: null })
  const [servingsState, setServingsState] = useState({ id: null, value: null })
  const [favError, setFavError] = useState(null)

  const loading = result.key !== requestKey
  const detail = loading ? null : result.detail
  const error = loading ? null : result.error

  usePageTitle(detail?.title || 'Receta')

  useEffect(() => {
    let cancelled = false
    const key = `${id}:${reloadKey}`

    getRecipeDetail(id)
      .then((data) => {
        if (cancelled) return
        setResult({ key, detail: data, error: null })
      })
      .catch((detailError) => {
        if (cancelled) return
        setResult({
          key,
          detail: null,
          error: {
            code: detailError.code,
            message: getErrorMessage(detailError),
          },
        })
      })

    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  // Contexto de la última búsqueda por ingredientes (si la hay).
  const ingredientMatch = useMemo(() => getIngredientMatch(id), [id])

  const originalServings = detail?.servings
  // Porciones elegidas por el usuario: se descartan al cambiar de receta.
  const servings =
    servingsState.id === id ? servingsState.value : (originalServings ?? null)
  const setServings = (updater) =>
    setServingsState((current) => {
      const base = current.id === id ? current.value : (originalServings ?? null)
      const next = typeof updater === 'function' ? updater(base) : updater
      return { id, value: next }
    })

  const factor =
    originalServings && servings ? servings / originalServings : 1
  const isScaled = Math.abs(factor - 1) > 0.0001

  const steps = useMemo(() => {
    if (!detail) return []

    const analyzed = Array.isArray(detail.analyzedInstructions)
      ? detail.analyzedInstructions
      : []
    const structured = []
    for (const section of analyzed) {
      for (const step of section.steps || []) {
        structured.push({ number: step.number, text: step.step })
      }
    }
    if (structured.length > 0) return structured

    if (typeof detail.instructions === 'string' && detail.instructions.trim()) {
      const text = htmlToPlainText(detail.instructions)
      return text
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => ({ number: index + 1, text: paragraph }))
    }

    return []
  }, [detail])

  const summary = useMemo(
    () => (detail?.summary ? htmlToPlainText(detail.summary) : ''),
    [detail],
  )

  const handleToggleFavorite = async () => {
    setFavError(null)
    try {
      await toggleFavorite({
        id: detail.id,
        title: detail.title,
        image: detail.image,
        readyInMinutes: detail.readyInMinutes,
      })
    } catch {
      setFavError('No se pudo actualizar el favorito. Intentá de nuevo.')
    }
  }

  // ---------- Estados ----------

  if (loading) {
    return (
      <div className="detail">
        <div className="detail__hero">
          <Skeleton className="detail__skeleton-media" />
          <div className="detail__intro">
            <Skeleton width="30%" height={16} />
            <Skeleton width="85%" height={34} />
            <Skeleton width="100%" height={60} />
          </div>
        </div>
        <div className="detail__section">
          <Skeleton width="40%" height={22} />
          <Skeleton height={180} />
        </div>
      </div>
    )
  }

  if (error) {
    const titles = {
      NO_API_KEY: 'Falta configurar la API key',
      NOT_FOUND: 'Receta no encontrada',
      QUOTA: 'Alcanzaste el límite de consultas',
      RATE_LIMIT: 'Demasiadas consultas seguidas',
    }
    return (
      <ErrorMessage
        title={titles[error.code] || 'No pudimos cargar la receta'}
        message={error.message}
        onRetry={
          error.code === 'NO_API_KEY'
            ? undefined
            : () => setReloadKey((key) => key + 1)
        }
      />
    )
  }

  if (!detail) return null

  const favorite = isFavorite(detail.id)
  const tags = [
    ...(detail.diets || []).map((diet) => DIET_LABELS[diet] || diet),
    ...(detail.cuisines || []),
  ]
  const nutrients = detail.nutrition?.nutrients || []

  return (
    <div className="detail">
      <Link to="/buscar" className="detail__back">
        <Icon name="arrowLeft" size={16} />
        Volver a buscar
      </Link>

      {/* ---------- Encabezado ---------- */}
      <header className="detail__hero">
        <div className="detail__media">
          {detail.image ? (
            <img src={detail.image} alt={detail.title} className="detail__image" />
          ) : (
            <span className="detail__image detail__image--placeholder">
              <Icon name="image" size={34} />
            </span>
          )}
        </div>

        <div className="detail__intro">
          <div className="detail__meta">
            {typeof detail.readyInMinutes === 'number' && (
              <span className="badge">
                <Icon name="clock" size={13} />
                {detail.readyInMinutes} minutos
              </span>
            )}
            {typeof detail.servings === 'number' && (
              <span className="badge">
                <Icon name="users" size={13} />
                {detail.servings} porcion{detail.servings === 1 ? '' : 'es'}
              </span>
            )}
            {typeof detail.readyInMinutes !== 'number' && (
              <span className="badge badge-muted">Tiempo no informado</span>
            )}
          </div>

          <h1 className="detail__title">{detail.title}</h1>

          {tags.length > 0 && (
            <div className="detail__tags">
              {tags.slice(0, 8).map((tag) => (
                <span key={tag} className="chip chip-plain">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {summary && <p className="detail__summary">{summary}</p>}

          <div className="detail__actions">
            <button
              type="button"
              className={`btn ${favorite ? 'btn-danger' : 'btn-secondary'}`}
              onClick={handleToggleFavorite}
              aria-pressed={favorite}
            >
              <Icon name="heart" size={17} />
              {favorite ? 'Guardada en favoritos' : 'Agregar a favoritos'}
            </button>

            {detail.sourceUrl && (
              <a
                className="btn btn-ghost"
                href={detail.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="external" size={16} />
                Ver fuente original{detail.sourceName ? `: ${detail.sourceName}` : ''}
              </a>
            )}
          </div>

          {favError && (
            <p className="detail__fav-error" role="alert">
              {favError}
            </p>
          )}
        </div>
      </header>

      {/* ---------- Ingredientes ---------- */}
      <section className="detail__section card card-pad">
        <div className="detail__section-head">
          <h2 className="section-title">Ingredientes</h2>

          {typeof detail.servings === 'number' && detail.servings > 0 && (
            <div className="detail__servings">
              <span className="detail__servings-label">Porciones:</span>
              <button
                type="button"
                className="detail__servings-btn"
                onClick={() => setServings((current) => Math.max(1, (current || 1) - 1))}
                aria-label="Menos porciones"
              >
                −
              </button>
              <strong className="detail__servings-value">{servings}</strong>
              <button
                type="button"
                className="detail__servings-btn"
                onClick={() => setServings((current) => Math.min(50, (current || 1) + 1))}
                aria-label="Más porciones"
              >
                +
              </button>
            </div>
          )}
        </div>

        {isScaled && (
          <p className="detail__scaled-note">
            <Icon name="info" size={15} />
            Cálculo proporcional: las cantidades se escalaron de{' '}
            {originalServings} a {servings} porciones.
          </p>
        )}

        {Array.isArray(detail.extendedIngredients) &&
        detail.extendedIngredients.length > 0 ? (
          <ul className="detail__ingredients">
            {detail.extendedIngredients.map((ingredient, index) => {
              const hasContext = Boolean(ingredientMatch)
              const owned =
                hasContext && ingredientMatch.usedIds.has(ingredient.id)
              const missing =
                hasContext && ingredientMatch.missingIds.has(ingredient.id)

              return (
                <li key={`${ingredient.id}-${index}`} className="detail__ingredient">
                  {hasContext && (
                    <span
                      className={`detail__ingredient-state${
                        owned ? ' detail__ingredient-state--owned' : ''
                      }${missing ? ' detail__ingredient-state--missing' : ''}`}
                    >
                      {owned ? 'Tenés' : missing ? 'Falta' : '—'}
                    </span>
                  )}

                  <span className="detail__ingredient-amount">
                    {(() => {
                      const scaled = scaleAmount(ingredient.amount, factor)
                      return scaled ? `${scaled} ${ingredient.unit || ''}`.trim() : 'Cantidad no informada'
                    })()}
                  </span>

                  <span className="detail__ingredient-name">
                    {ingredient.name}
                    {ingredient.meta?.length > 0 && (
                      <small> ({ingredient.meta.join(', ')})</small>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail__missing">Esta receta no incluye ingredientes detallados.</p>
        )}
      </section>

      {/* ---------- Preparación ---------- */}
      <section className="detail__section card card-pad">
        <h2 className="section-title">Preparación</h2>
        {steps.length > 0 ? (
          <ol className="detail__steps">
            {steps.map((step) => (
              <li key={`${step.number}-${step.text.slice(0, 24)}`} className="detail__step">
                <span className="detail__step-number">{step.number}</span>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="detail__missing">
            Esta receta no incluye instrucciones de preparación. Podés ver el
            detalle original en el enlace de la fuente.
          </p>
        )}
      </section>

      {/* ---------- Nutrición ---------- */}
      <section className="detail__section card card-pad">
        <h2 className="section-title">Información nutricional</h2>
        {nutrients.length > 0 ? (
          <NutritionInfo nutrients={nutrients} scope="porcion" />
        ) : (
          <p className="detail__missing">
            Esta receta no incluye información nutricional.
          </p>
        )}
      </section>

      {/* ---------- Fuente y atribución ---------- */}
      <footer className="detail__footer">
        <p>
          {detail.spoonacularSourceUrl && (
            <>
              Página original:{' '}
              <a
                href={detail.spoonacularSourceUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                {detail.title}
              </a>
              <br />
            </>
          )}
          <a href={SPOONACULAR_ATTRIBUTION.url} target="_blank" rel="noreferrer noopener">
            {SPOONACULAR_ATTRIBUTION.text}
          </a>
          {detail.license && <span> · Licencia: {detail.license}</span>}
        </p>
      </footer>
    </div>
  )
}
