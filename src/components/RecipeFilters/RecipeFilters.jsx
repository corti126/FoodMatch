import Icon from '../Icon/Icon.jsx'
import IngredientInput from '../IngredientInput/IngredientInput.jsx'
import {
  CUISINE_OPTIONS,
  DIET_OPTIONS,
  INTOLERANCE_OPTIONS,
  MEAL_TYPE_OPTIONS,
  SERVINGS_OPTIONS,
  TIME_OPTIONS,
} from '../../config/filters.js'
import './RecipeFilters.css'

const NUTRITION_FIELDS = [
  { key: 'calories', label: 'Calorías', unit: 'kcal' },
  { key: 'protein', label: 'Proteínas', unit: 'g' },
  { key: 'fat', label: 'Grasas', unit: 'g' },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g' },
]

function toggleInList(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

/**
 * Panel de filtros avanzados. Solo muestra filtros que Spoonacular soporta
 * (verificado contra su documentación). El estado lo controla la página.
 */
export default function RecipeFilters({ filters, onChange, onApply, onReset }) {
  const set = (patch) => onChange(patch)
  const setNutrition = (key, range, value) =>
    onChange({ nutrition: { ...filters.nutrition, [`${range}${key}`]: value } })

  const hasAllergyFilters = filters.intolerances.length > 0

  return (
    <div className="recipe-filters">
      {/* --- Ingredientes --- */}
      <section className="recipe-filters__section">
        <h3 className="recipe-filters__title">Ingredientes</h3>
        <div className="recipe-filters__grid">
          <IngredientInput
            id="filter-include"
            label="Debe incluir"
            placeholder="Ej.: tomate, pollo…"
            ingredients={filters.includeIngredients}
            onChange={(next) => set({ includeIngredients: next })}
          />
          <IngredientInput
            id="filter-exclude"
            label="No debe incluir"
            placeholder="Ej.: huevo, frutos secos…"
            ingredients={filters.excludeIngredients}
            onChange={(next) => set({ excludeIngredients: next })}
          />
        </div>
      </section>

      {/* --- Tipo de alimentación --- */}
      <section className="recipe-filters__section">
        <h3 className="recipe-filters__title">Tipo de alimentación</h3>
        <div className="recipe-filters__chips">
          {DIET_OPTIONS.map((option) => {
            const active = filters.diets.includes(option.value)
            return (
              <label
                key={option.value}
                className={`filter-chip${active ? ' filter-chip--active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => set({ diets: toggleInList(filters.diets, option.value) })}
                />
                {option.label}
              </label>
            )
          })}
        </div>
        <p className="recipe-filters__hint">
          Las opciones se combinan entre sí (se debe cumplir todas las elegidas).
        </p>
      </section>

      {/* --- Intolerancias y alergias --- */}
      <section className="recipe-filters__section">
        <h3 className="recipe-filters__title">Intolerancias y alergias</h3>
        <div className="recipe-filters__chips">
          {INTOLERANCE_OPTIONS.map((option) => {
            const active = filters.intolerances.includes(option.value)
            return (
              <label
                key={option.value}
                className={`filter-chip${active ? ' filter-chip--active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    set({
                      intolerances: toggleInList(filters.intolerances, option.value),
                    })
                  }
                />
                {option.label}
              </label>
            )
          })}
        </div>
        <p className="recipe-filters__hint">
          “Sin lácteos” se aplica desde esta sección: es así como lo soporta
          Spoonacular.
        </p>

        {hasAllergyFilters && (
          <div className="alert alert-warning" role="note">
            <Icon name="alert" size={18} />
            <div>
              <p className="alert-title">Advertencia importante</p>
              <p>
                Estos filtros se basan en los datos de Spoonacular. No reemplazan
                la verificación de ingredientes ni garantizan ausencia de
                contaminación cruzada. Si tenés una alergia grave, revisá siempre
                la lista completa de ingredientes antes de cocinar.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* --- Nutrición --- */}
      <section className="recipe-filters__section">
        <h3 className="recipe-filters__title">Nutrición (por porción)</h3>
        <div className="recipe-filters__nutrition">
          {NUTRITION_FIELDS.map((field) => (
            <div className="recipe-filters__nutrition-row" key={field.key}>
              <span className="recipe-filters__nutrition-label">
                {field.label} <small>({field.unit})</small>
              </span>
              <div className="recipe-filters__nutrition-inputs">
                <label className="field">
                  <span className="sr-only">Mínimo de {field.label}</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Mín."
                    value={filters.nutrition[`min${capitalize(field.key)}`]}
                    onChange={(e) => setNutrition(field.key, 'min', e.target.value)}
                  />
                </label>
                <span className="recipe-filters__dash" aria-hidden="true">
                  –
                </span>
                <label className="field">
                  <span className="sr-only">Máximo de {field.label}</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Máx."
                    value={filters.nutrition[`max${capitalize(field.key)}`]}
                    onChange={(e) => setNutrition(field.key, 'max', e.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Tiempo, tipo de comida, gastronomía y porciones --- */}
      <section className="recipe-filters__section">
        <h3 className="recipe-filters__title">Tiempo, tipo y gastronomía</h3>
        <div className="recipe-filters__grid">
          <label className="field">
            <span className="label">Tiempo máximo de preparación</span>
            <select
              className="select"
              value={filters.maxReadyTime}
              onChange={(e) => set({ maxReadyTime: e.target.value })}
            >
              <option value="">Sin límite</option>
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Tipo de comida</span>
            <select
              className="select"
              value={filters.mealType}
              onChange={(e) => set({ mealType: e.target.value })}
            >
              <option value="">Cualquiera</option>
              {MEAL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Gastronomía</span>
            <select
              className="select"
              value={filters.cuisine}
              onChange={(e) => set({ cuisine: e.target.value })}
            >
              <option value="">Cualquiera</option>
              {CUISINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Porciones</span>
            <select
              className="select"
              value={filters.servings}
              onChange={(e) => set({ servings: e.target.value })}
            >
              <option value="">Cualquiera</option>
              {SERVINGS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* --- Acciones --- */}
      <div className="recipe-filters__actions">
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          Limpiar filtros
        </button>
        <button type="button" className="btn btn-primary" onClick={onApply}>
          <Icon name="search" size={16} />
          Aplicar y buscar
        </button>
      </div>
    </div>
  )
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
