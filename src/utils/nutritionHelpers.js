/** Utilidades para presentar la información nutricional de Spoonacular. */

import { translateNutrientName } from '../services/translation.js'

// Orden en que se muestran los nutrientes principales.
const MAIN_ORDER = [
  'Calories',
  'Protein',
  'Fat',
  'Carbohydrates',
  'Fiber',
  'Sugar',
  'Saturated Fat',
  'Sodium',
]

// Nutrientes secundarios que se muestran si están disponibles.
const SECONDARY = [
  'Cholesterol',
  'Potassium',
  'Calcium',
  'Iron',
  'Vitamin A',
  'Vitamin C',
]

/** Nombre en español del nutriente (usa el diccionario centralizado de traducción). */
export function translateNutrient(name) {
  return translateNutrientName(name) || name
}

/** Selecciona y ordena los nutrientes a mostrar, sin inventar datos. */
export function selectMainNutrients(nutrients = []) {
  if (!Array.isArray(nutrients)) return []
  const byName = new Map(nutrients.map((n) => [n.name, n]))

  const main = MAIN_ORDER.map((name) => byName.get(name)).filter(Boolean)
  const secondary = SECONDARY.map((name) => byName.get(name)).filter(Boolean)
  const known = new Set([...MAIN_ORDER, ...SECONDARY])
  const extras = nutrients.filter((n) => !known.has(n.name))

  return [...main, ...secondary, ...extras]
}

/** Formatea un valor numérico sin inventar precisión. */
export function formatAmount(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

/** Etiqueta de referencia diaria cuando Spoonacular la envía. */
export function dailyValuePercent(nutrient) {
  const percent = nutrient?.percentOfDailyNeeds
  if (typeof percent !== 'number' || !Number.isFinite(percent)) return null
  return Math.round(percent)
}
