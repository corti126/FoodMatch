/** Utilidades para presentar la información nutricional de Spoonacular. */

const NUTRIENT_LABELS = {
  Calories: 'Calorías',
  Protein: 'Proteínas',
  Fat: 'Grasas',
  Carbohydrates: 'Carbohidratos',
  Fiber: 'Fibra',
  Sugar: 'Azúcares',
  'Saturated Fat': 'Grasas saturadas',
  'Trans Fat': 'Grasas trans',
  'Mono Unsaturated Fat': 'Grasas monoinsaturadas',
  'Poly Unsaturated Fat': 'Grasas poliinsaturadas',
  Cholesterol: 'Colesterol',
  Sodium: 'Sodio',
  Potassium: 'Potasio',
  Calcium: 'Calcio',
  Iron: 'Hierro',
  'Vitamin A': 'Vitamina A',
  'Vitamin C': 'Vitamina C',
  'Vitamin D': 'Vitamina D',
  'Vitamin B1': 'Vitamina B1',
  'Vitamin B2': 'Vitamina B2',
  'Vitamin B3': 'Vitamina B3',
  'Vitamin B6': 'Vitamina B6',
  'Vitamin B12': 'Vitamina B12',
  'Vitamin E': 'Vitamina E',
  'Vitamin K': 'Vitamina K',
  Folate: 'Folato',
  Magnesium: 'Magnesio',
  Zinc: 'Zinc',
}

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

/** Nombre en español del nutriente (devuelve el original si no está traducido). */
export function translateNutrient(name) {
  return NUTRIENT_LABELS[name] || name
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
