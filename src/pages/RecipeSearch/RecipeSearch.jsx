import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import IngredientInput from '../../components/IngredientInput/IngredientInput.jsx'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import RecipeFilters from '../../components/RecipeFilters/RecipeFilters.jsx'
import RecipeGrid from '../../components/RecipeGrid/RecipeGrid.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { logSearch } from '../../services/searchHistory.js'
import { getErrorMessage, searchAdvanced, searchByIngredients } from '../../services/recipes.js'
import { dedupeIngredients } from '../../utils/ingredientHelpers.js'
import { SPOONACULAR_ATTRIBUTION } from '../../config/app.js'
import './RecipeSearch.css'

const RESULT_OPTIONS = [10, 20, 30]
const PAGE_SIZE = 12

const EMPTY_FILTERS = {
  diets: [],
  intolerances: [],
  includeIngredients: [],
  excludeIngredients: [],
  nutrition: {
    minCalories: '',
    maxCalories: '',
    minProtein: '',
    maxProtein: '',
    minFat: '',
    maxFat: '',
    minCarbs: '',
    maxCarbs: '',
  },
  maxReadyTime: '',
  mealType: '',
  cuisine: '',
  servings: '',
}

const RANKING_OPTIONS = [
  {
    value: 1,
    title: 'Priorizar lo que ya tengo',
    description: 'Recetas que usan la mayor cantidad posible de tus ingredientes.',
  },
  {
    value: 2,
    title: 'Priorizar pocos faltantes',
    description: 'Recetas que necesitan la menor cantidad de ingredientes extra.',
  },
]

const QUICK_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'listas', label: 'Puedo prepararlas' },
  { value: 'falta1', label: 'Falta 1 ingrediente' },
  { value: 'pocos', label: 'Faltan pocas' },
]

const SORT_OPTIONS = [
  { value: 'api', label: 'Orden de la búsqueda' },
  { value: 'match', label: 'Mayor coincidencia' },
  { value: 'faltantes', label: 'Menos ingredientes faltantes' },
]

function errorTitleFor(error) {
  if (error?.code === 'NO_API_KEY') return 'Falta configurar la API key'
  if (error?.code === 'QUOTA' || error?.code === 'RATE_LIMIT')
    return 'Alcanzaste el límite de consultas'
  return 'No pudimos buscar recetas'
}

function countActiveFilters(filters) {
  let count = 0
  if (filters.diets.length) count += 1
  if (filters.intolerances.length) count += 1
  if (filters.includeIngredients.length) count += 1
  if (filters.excludeIngredients.length) count += 1
  if (filters.maxReadyTime) count += 1
  if (filters.mealType) count += 1
  if (filters.cuisine) count += 1
  if (filters.servings) count += 1
  count += Object.values(filters.nutrition).filter((v) => v !== '').length
  return count
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function servingsRange(value) {
  if (value === '1-2') return { minServings: 1, maxServings: 2 }
  if (value === '3-4') return { minServings: 3, maxServings: 4 }
  if (value === '5+') return { minServings: 5 }
  return {}
}

/** Lee los parámetros de la URL (?modo=…&ing=… / ?q=…) al montar. */
function readInitialParams(searchParams) {
  const modo = searchParams.get('modo')
  const ing = searchParams.get('ing')
  const q = searchParams.get('q')

  if (modo === 'ingredientes' && ing) {
    const list = dedupeIngredients(ing.split(',').map((s) => s.trim()))
    if (list.length > 0) {
      return { mode: 'ingredientes', ingredients: list, query: '' }
    }
  }
  if (q) return { mode: 'avanzada', ingredients: [], query: q }
  return { mode: 'ingredientes', ingredients: [], query: '' }
}

/**
 * Filtros iniciales según las preferencias guardadas del usuario.
 * Si activó «aplicar automáticamente», se precargan dietas, intolerancias
 * y objetivos nutricionales; si no, filtros vacíos.
 */
function filtersFromPreferences(preferences) {
  if (!preferences?.applyToSearch) return EMPTY_FILTERS
  return {
    ...EMPTY_FILTERS,
    diets: preferences.diets.length ? preferences.diets : EMPTY_FILTERS.diets,
    intolerances: preferences.intolerances.length
      ? preferences.intolerances
      : EMPTY_FILTERS.intolerances,
    nutrition: {
      ...EMPTY_FILTERS.nutrition,
      minProtein:
        preferences.nutrition.minProtein ?? EMPTY_FILTERS.nutrition.minProtein,
      maxCalories:
        preferences.nutrition.maxCalories ?? EMPTY_FILTERS.nutrition.maxCalories,
    },
  }
}

export default function RecipeSearch() {
  usePageTitle('Buscar recetas')
  const { user } = useAuth()
  const { preferences } = usePreferences()
  const [searchParams] = useSearchParams()

  // Estado inicial tomado de la URL: al entrar desde otra página, la ruta
  // se remonta con los parámetros y la URL queda como fuente de verdad.
  const [initialParams] = useState(() => readInitialParams(searchParams))

  // --- Estado por modo ---
  const [mode, setMode] = useState(initialParams.mode)

  // Modo "¿Qué puedo cocinar?"
  const [ingredients, setIngredients] = useState(initialParams.ingredients)
  const [ranking, setRanking] = useState(1)
  const [resultCount, setResultCount] = useState(10)

  // Modo "algo específico"
  const [query, setQuery] = useState(initialParams.query)
  // Filtros: mientras el usuario no edite nada se derivan de las
  // preferencias guardadas; al editar, de un borrador local. Evita
  // sincronizar el formulario en un efecto.
  const [filtersDraft, setFiltersDraft] = useState(null)
  const filters = filtersDraft ?? filtersFromPreferences(preferences)
  const setFilters = (updater) =>
    setFiltersDraft((current) => {
      const base = current ?? filtersFromPreferences(preferences)
      return typeof updater === 'function'
        ? updater(base)
        : { ...base, ...updater }
    })
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Resultados
  const [results, setResults] = useState([])
  const [totalResults, setTotalResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Orden y filtros visuales (solo modo ingredientes)
  const [sort, setSort] = useState('api')
  const [quickFilter, setQuickFilter] = useState('todos')

  const lastSearchRef = useRef(null)
  const [canRetry, setCanRetry] = useState(false)

  // --- Búsqueda por ingredientes ---
  const runIngredientSearch = useCallback(
    async (options = {}) => {
      const list = options.ingredients ?? ingredients
      const rankingValue = options.ranking ?? ranking
      const numberValue = options.number ?? resultCount

      if (list.length === 0) {
        setError({ message: 'Agregá al menos un ingrediente para buscar recetas.' })
        return
      }

      setLoading(true)
      setError(null)
      setHasSearched(true)
      lastSearchRef.current = { kind: 'ingredientes', options }
      setCanRetry(true)

      try {
        const items = await searchByIngredients({
          ingredients: list,
          ranking: rankingValue,
          number: numberValue,
        })
        setResults(items)
        setTotalResults(null)
        logSearch(user?.uid, {
          type: 'ingredientes',
          term: list.join(', '),
          summary: `${items.length} recetas encontradas`,
          params: { ingredients: list, ranking: rankingValue },
        })
      } catch (searchError) {
        setResults([])
        setError({ code: searchError.code, message: getErrorMessage(searchError) })
      } finally {
        setLoading(false)
      }
    },
    [ingredients, ranking, resultCount, user],
  )

  // --- Búsqueda avanzada ---
  const buildAdvancedParams = useCallback(
    (offset, queryValue) => {
      const nutrition = {
        minCalories: numberOrNull(filters.nutrition.minCalories),
        maxCalories: numberOrNull(filters.nutrition.maxCalories),
        minProtein: numberOrNull(filters.nutrition.minProtein),
        maxProtein: numberOrNull(filters.nutrition.maxProtein),
        minFat: numberOrNull(filters.nutrition.minFat),
        maxFat: numberOrNull(filters.nutrition.maxFat),
        minCarbs: numberOrNull(filters.nutrition.minCarbs),
        maxCarbs: numberOrNull(filters.nutrition.maxCarbs),
      }

      return {
        query: queryValue,
        diets: filters.diets,
        intolerances: filters.intolerances,
        includeIngredients: filters.includeIngredients,
        excludeIngredients: filters.excludeIngredients,
        cuisine: filters.cuisine,
        mealType: filters.mealType,
        maxReadyTime: numberOrNull(filters.maxReadyTime),
        ...servingsRange(filters.servings),
        ...nutrition,
        number: PAGE_SIZE,
        offset,
      }
    },
    [filters],
  )

  const runAdvancedSearch = useCallback(
    async (append = false, queryOverride) => {
      const queryValue = (queryOverride ?? query).trim()
      const offset = append ? results.length : 0
      const hasAnyFilter =
        queryValue.length > 0 || countActiveFilters(filters) > 0

      if (!hasAnyFilter) {
        setError({
          message:
            'Escribí algo para buscar o aplicá al menos un filtro para ver resultados.',
        })
        return
      }

      if (append) setLoadingMore(true)
      else {
        setLoading(true)
        setHasSearched(true)
      }
      setError(null)
      lastSearchRef.current = { kind: 'avanzada' }
      setCanRetry(true)

      try {
        const payload = await searchAdvanced(buildAdvancedParams(offset, queryValue))
        setResults((current) =>
          append ? [...current, ...payload.results] : payload.results,
        )
        setTotalResults(payload.totalResults)

        if (!append) {
          logSearch(user?.uid, {
            type: 'avanzada',
            term: queryValue,
            summary: `${payload.results.length} recetas encontradas`,
            params: { query: queryValue, filters },
          })
        }
      } catch (searchError) {
        if (!append) setResults([])
        setError({ code: searchError.code, message: getErrorMessage(searchError) })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [buildAdvancedParams, filters, query, results.length, user],
  )

  // --- Entrada desde otras páginas (?modo=ingredientes&ing=… / ?q=…) ---
  // El estado inicial ya viene de la URL; acá solo se dispara la búsqueda
  // automática (los cambios de estado viven en respuestas/manejadores).
  const processedParamsRef = useRef(null)
  useEffect(() => {
    const key = searchParams.toString()
    if (!key || processedParamsRef.current === key) return undefined

    const modo = searchParams.get('modo')
    const ing = searchParams.get('ing')
    const q = searchParams.get('q')

    // La búsqueda se lanza en el próximo tick: así el efecto no encadena
    // renders sincrónicos (regla react-hooks/set-state-in-effect).
    const timer = setTimeout(() => {
      processedParamsRef.current = key
      if (modo === 'ingredientes' && ing) {
        const list = dedupeIngredients(ing.split(',').map((s) => s.trim()))
        if (list.length > 0) runIngredientSearch({ ingredients: list })
      } else if (q) {
        runAdvancedSearch(false, q)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [searchParams, runIngredientSearch, runAdvancedSearch])

  // --- Resultados visibles (orden y filtros visuales) ---
  const visibleResults = useMemo(() => {
    if (mode !== 'ingredientes') return results

    let list = [...results]
    if (quickFilter === 'listas') list = list.filter((r) => r.missingCount === 0)
    else if (quickFilter === 'falta1') list = list.filter((r) => r.missingCount === 1)
    else if (quickFilter === 'pocos') list = list.filter((r) => r.missingCount <= 2)

    if (sort === 'match') {
      list.sort((a, b) => (b.matchPercent ?? -1) - (a.matchPercent ?? -1))
    } else if (sort === 'faltantes') {
      list.sort((a, b) => (a.missingCount ?? 0) - (b.missingCount ?? 0))
    }

    return list
  }, [results, mode, quickFilter, sort])

  const canLoadMore =
    mode === 'avanzada' &&
    totalResults !== null &&
    results.length < totalResults &&
    results.length > 0

  const activeFilterCount = countActiveFilters(filters)

  const switchMode = (nextMode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    setResults([])
    setTotalResults(null)
    setHasSearched(false)
    setError(null)
    lastSearchRef.current = null
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setError(null)
  }

  const retryLastSearch = () => {
    const last = lastSearchRef.current
    if (last?.kind === 'avanzada') runAdvancedSearch(false)
    else if (last?.kind === 'ingredientes') runIngredientSearch(last.options || {})
  }

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <EmptyState
          icon={mode === 'ingredientes' ? 'leaf' : 'search'}
          title={
            mode === 'ingredientes'
              ? 'Contame qué tenés en casa'
              : '¿Qué te gustaría comer?'
          }
          description={
            mode === 'ingredientes'
              ? 'Agregá tus ingredientes y encontrá recetas que podés preparar con ellos.'
              : 'Escribí el nombre de una receta, un plato o un ingrediente y aplicá los filtros que quieras.'
          }
        />
      )
    }

    if (quickFilter !== 'todos' && results.length > 0) {
      return (
        <EmptyState
          icon="filter"
          title="Ninguna receta cumple este filtro"
          description="Probá con otro filtro visual para ver más resultados."
          action={
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setQuickFilter('todos')}
            >
              Ver todos los resultados
            </button>
          }
        />
      )
    }

    return (
      <EmptyState
        icon="search"
        title="No encontramos recetas"
        description={
          mode === 'ingredientes'
            ? 'Probá con otros ingredientes o con nombres más generales (por ejemplo, “pollo” en vez de “pechuga de pollo”).'
            : 'Probá con otros términos o sacá alguno de los filtros aplicados.'
        }
      />
    )
  }

  return (
    <div className="search-page">
      <header className="page-header">
        <h1 className="page-title">Buscar recetas</h1>
        <p className="page-subtitle">
          Dos formas de encontrar algo rico: con los ingredientes que tenés o
          buscando un plato concreto con filtros.
        </p>
      </header>

      {/* --- Selector de modo --- */}
      <div className="search-page__tabs" role="tablist" aria-label="Modo de búsqueda">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'ingredientes'}
          className={`search-page__tab${mode === 'ingredientes' ? ' search-page__tab--active' : ''}`}
          onClick={() => switchMode('ingredientes')}
        >
          <Icon name="leaf" size={16} />
          ¿Qué puedo cocinar?
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'avanzada'}
          className={`search-page__tab${mode === 'avanzada' ? ' search-page__tab--active' : ''}`}
          onClick={() => switchMode('avanzada')}
        >
          <Icon name="search" size={16} />
          Quiero comer algo específico
        </button>
      </div>

      {/* --- Panel de búsqueda --- */}
      <div className="search-page__panel card card-pad">
        {mode === 'ingredientes' ? (
          <>
            <IngredientInput
              id="search-ingredients"
              label="Ingredientes disponibles"
              placeholder="Ej.: papa, tomate, huevo…"
              ingredients={ingredients}
              onChange={setIngredients}
            />

            <div className="search-page__options">
              <fieldset className="search-page__ranking">
                <legend className="label">¿Cómo querés que ordene los resultados?</legend>
                <div className="search-page__ranking-options">
                  {RANKING_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`ranking-option${ranking === option.value ? ' ranking-option--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="ranking"
                        value={option.value}
                        checked={ranking === option.value}
                        onChange={() => setRanking(option.value)}
                      />
                      <span className="ranking-option__title">{option.title}</span>
                      <span className="ranking-option__desc">{option.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="search-page__options-row">
                <label className="field search-page__count">
                  <span className="label">Cantidad de resultados</span>
                  <select
                    className="select"
                    value={resultCount}
                    onChange={(event) => setResultCount(Number(event.target.value))}
                  >
                    {RESULT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} recetas
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => runIngredientSearch()}
                  disabled={loading}
                >
                  <Icon name="search" size={16} />
                  {loading ? 'Buscando…' : 'Buscar recetas'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="search-page__advanced">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={() => runAdvancedSearch(false)}
              placeholder="Ej.: milanesa de pollo, pasta con salsa blanca, ensalada…"
              label="Buscar receta por nombre"
            />

            <button
              type="button"
              className="btn btn-secondary search-page__filters-toggle"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              <Icon name="sliders" size={16} />
              Filtros avanzados
              {activeFilterCount > 0 && (
                <span className="badge badge-success">{activeFilterCount}</span>
              )}
              <Icon name={filtersOpen ? 'chevronDown' : 'chevronRight'} size={15} />
            </button>

            {filtersOpen && (
              <div className="search-page__filters">
                <RecipeFilters
                  filters={filters}
                  onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
                  onApply={() => runAdvancedSearch(false)}
                  onReset={resetFilters}
                />
              </div>
            )}

            <div className="search-page__options-row">
              <p className="search-page__hint">
                Buscá por nombre solo o combiná con filtros.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => runAdvancedSearch(false)}
                disabled={loading}
              >
                <Icon name="search" size={16} />
                {loading ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Errores --- */}
      {error && (
        <ErrorMessage
          title={errorTitleFor({ code: error.code })}
          message={error.message}
          onRetry={
            canRetry && error.code !== 'NO_API_KEY'
              ? retryLastSearch
              : undefined
          }
        />
      )}

      {/* --- Barra de resultados --- */}
      {hasSearched && !loading && !error && results.length > 0 && (
        <div className="search-page__results-bar">
          <p className="search-page__results-count">
            {mode === 'avanzada' && totalResults !== null
              ? `${results.length} de ${totalResults} recetas`
              : `${visibleResults.length} receta${visibleResults.length === 1 ? '' : 's'}`}
            {mode === 'ingredientes' && visibleResults.length !== results.length
              ? ` (de ${results.length} en total)`
              : ''}
          </p>

          {mode === 'ingredientes' && (
            <div className="search-page__results-controls">
              <div className="search-page__quick-filters" role="group" aria-label="Filtrar resultados">
                {QUICK_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-chip${quickFilter === option.value ? ' filter-chip--active' : ''}`}
                    onClick={() => setQuickFilter(option.value)}
                    aria-pressed={quickFilter === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="search-page__sort">
                <span className="sr-only">Ordenar resultados</span>
                <Icon name="sort" size={15} />
                <select
                  className="select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}

      {/* --- Resultados --- */}
      <RecipeGrid
        recipes={visibleResults}
        loading={loading}
        emptyState={error ? null : renderEmptyState()}
      />

      {canLoadMore && (
        <div className="search-page__more">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => runAdvancedSearch(true)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Cargando…' : 'Cargar más recetas'}
          </button>
        </div>
      )}

      {/* --- Atribución --- */}
      <footer className="search-page__attribution">
        <a href={SPOONACULAR_ATTRIBUTION.url} target="_blank" rel="noreferrer noopener">
          {SPOONACULAR_ATTRIBUTION.text}
        </a>
        <span> · Los resultados se obtienen al buscar y no se guardan en tu cuenta.</span>
      </footer>
    </div>
  )
}
