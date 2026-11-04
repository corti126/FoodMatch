import {
  dailyValuePercent,
  formatAmount,
  selectMainNutrients,
  translateNutrient,
} from '../../utils/nutritionHelpers.js'
import './NutritionInfo.css'

/**
 * Información nutricional a partir de los datos de Spoonacular.
 * No inventa valores: si no hay datos, el padre muestra un mensaje.
 *
 * @param {Array} nutrients nutrientes devueltos por la API
 * @param {string} scope 'porcion' | 'receta' — aclara a qué corresponde
 */
export default function NutritionInfo({ nutrients = [], scope = 'porcion' }) {
  const items = selectMainNutrients(nutrients)
  if (items.length === 0) return null

  return (
    <div className="nutrition">
      <p className="nutrition__scope">
        {scope === 'porcion'
          ? 'Valores por porción (según Spoonacular). Para la receta completa, multiplicá por la cantidad de porciones.'
          : 'Valores de la receta completa.'}
      </p>

      <div className="nutrition__grid">
        {items.map((nutrient) => {
          const dv = dailyValuePercent(nutrient)
          return (
            <div
              key={nutrient.name}
              className={`nutrition__item${
                nutrient.name === 'Calories' ? ' nutrition__item--highlight' : ''
              }`}
            >
              <span className="nutrition__label">{translateNutrient(nutrient.name)}</span>
              <span className="nutrition__value">
                {formatAmount(nutrient.amount)}
                <small>{nutrient.unit}</small>
              </span>
              {dv !== null && dv > 0 && (
                <span className="nutrition__dv">{dv}% de la necesidad diaria</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
