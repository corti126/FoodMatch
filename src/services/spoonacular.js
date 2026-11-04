/**
 * Servicio centralizado de Spoonacular Food API.
 * Todas las llamadas HTTP a la API pasan por este archivo.
 *
 * Documentación: https://spoonacular.com/food-api/docs
 *
 * NOTA DE SEGURIDAD: la clave (VITE_SPOONACULAR_API_KEY) se inyecta en el
 * bundle del navegador. Cualquier persona que inspeccione la aplicación
 * publicada podrá verla. Ver README.md ("Limitaciones de la API key").
 */

const BASE_URL = 'https://api.spoonacular.com'
const API_KEY = (import.meta.env.VITE_SPOONACULAR_API_KEY || '').trim()

/** Indica si la API key está configurada en el entorno. */
export function hasApiKey() {
  return API_KEY.length > 0
}

/** Error de la API con código y mensaje amigable en español. */
export class SpoonacularError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SpoonacularError'
    this.code = code
  }
}

const MESSAGES = {
  NO_API_KEY:
    'Falta la clave de Spoonacular. Creá el archivo .env.local a partir de .env.example y completá VITE_SPOONACULAR_API_KEY (se consigue gratis en spoonacular.com).',
  QUOTA:
    'Se agotó la cuota disponible de Spoonacular. Los límites se renuevan según el plan de tu cuenta: revisá tu panel de Spoonacular o volvé a intentar más tarde.',
  RATE_LIMIT:
    'Hay demasiadas consultas en poco tiempo. Esperá unos minutos y volvé a intentar.',
  NOT_FOUND: 'No encontramos esa receta. Puede que ya no esté disponible.',
  NETWORK:
    'No pudimos conectar con el servicio de recetas. Revisá tu conexión a internet.',
  HTTP: 'El servicio de recetas no está disponible en este momento. Probá de nuevo en unos minutos.',
}

/** Ejecuta una petición GET autenticada contra Spoonacular. */
async function request(path, params = {}) {
  if (!hasApiKey()) {
    throw new SpoonacularError('NO_API_KEY', MESSAGES.NO_API_KEY)
  }

  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('apiKey', API_KEY)

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new SpoonacularError('NETWORK', MESSAGES.NETWORK)
  }

  if (response.status === 402) throw new SpoonacularError('QUOTA', MESSAGES.QUOTA)
  if (response.status === 429) throw new SpoonacularError('RATE_LIMIT', MESSAGES.RATE_LIMIT)
  if (response.status === 404) throw new SpoonacularError('NOT_FOUND', MESSAGES.NOT_FOUND)
  if (!response.ok) throw new SpoonacularError('HTTP', MESSAGES.HTTP)

  return response.json()
}

/** true si el error corresponde a límites de uso (402 / 429). */
export function isQuotaError(error) {
  return error?.code === 'QUOTA' || error?.code === 'RATE_LIMIT'
}

/**
 * Búsqueda por ingredientes ("¿Qué puedo cocinar?").
 * @param {object} options
 * @param {string[]} options.ingredients ingredientes en inglés (ver utils/ingredientHelpers)
 * @param {number} options.number cantidad máxima de resultados (1–100)
 * @param {number} options.ranking 1 = maximizar ingredientes usados, 2 = minimizar faltantes
 * @param {boolean} options.ignorePantry ignora típicos ingredientes de despensa (sal, agua…)
 */
export async function findByIngredients({
  ingredients,
  number = 12,
  ranking = 1,
  ignorePantry = true,
}) {
  return request('/recipes/findByIngredients', {
    ingredients: ingredients.join(','),
    number,
    ranking,
    ignorePantry,
  })
}

/**
 * Búsqueda avanzada con filtros.
 * Parámetros validados contra la documentación vigente de Spoonacular.
 * @param {object} params
 */
export async function complexSearch(params = {}) {
  const {
    query = '',
    diets = [],
    intolerances = [],
    includeIngredients = [],
    excludeIngredients = [],
    cuisine = '',
    mealType = '',
    maxReadyTime,
    minServings,
    maxServings,
    minCalories,
    maxCalories,
    minProtein,
    maxProtein,
    minFat,
    maxFat,
    minCarbs,
    maxCarbs,
    sort = '',
    addRecipeInformation = true,
    number = 12,
    offset = 0,
  } = params

  return request('/recipes/complexSearch', {
    query: query || undefined,
    diet: diets.length ? diets.join(',') : undefined,
    intolerances: intolerances.length ? intolerances.join(',') : undefined,
    includeIngredients: includeIngredients.length
      ? includeIngredients.join(',')
      : undefined,
    excludeIngredients: excludeIngredients.length
      ? excludeIngredients.join(',')
      : undefined,
    cuisine: cuisine || undefined,
    type: mealType || undefined,
    maxReadyTime,
    minServings,
    maxServings,
    minCalories,
    maxCalories,
    minProtein,
    maxProtein,
    minFat,
    maxFat,
    minCarbs,
    maxCarbs,
    sort: sort || undefined,
    addRecipeInformation,
    number,
    offset,
  })
}

/**
 * Información completa de una receta (solo al abrirla).
 * La nutrición que devuelve es por porción (documentación de Spoonacular).
 */
export async function getRecipeInformation(id) {
  return request(`/recipes/${Number(id)}/information`, { includeNutrition: true })
}

/** Autocompletado de ingredientes (consumo mínimo, con debounce en el componente). */
export async function autocompleteIngredients(query, number = 8) {
  const results = await request('/food/ingredients/autocomplete', {
    query,
    number,
  })
  return (results || []).map((item) => ({ id: item.id, name: item.name }))
}
