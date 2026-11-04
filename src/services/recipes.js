/**
 * Orquestación de recetas: normaliza las respuestas de Spoonacular,
 * aplica caché en memoria y conserva en memoria el contexto de la última
 * búsqueda por ingredientes (para marcar en el detalle qué se tiene o falta).
 *
 * No se persisten datos de recetas fuera de la sesión en curso.
 */

import * as api from './spoonacular.js'
import { getCached, setCached } from '../utils/cache.js'
import { toApiIngredient } from '../utils/ingredientHelpers.js'

const SEARCH_TTL = 5 * 60 * 1000 // 5 minutos
const DETAIL_TTL = 10 * 60 * 1000 // 10 minutos

/** Última búsqueda por ingredientes: recipeId → { usedIds, missingIds }. */
const ingredientMatches = new Map()

/** Convierte la respuesta de findByIngredients en un resultado de tarjeta. */
function mapIngredientResult(raw) {
  const used = Array.isArray(raw.usedIngredients) ? raw.usedIngredients : []
  const missing = Array.isArray(raw.missedIngredients) ? raw.missedIngredients : []
  const total = used.length + missing.length

  return {
    id: raw.id,
    title: raw.title,
    image: raw.image || null,
    usedIngredients: used,
    missingIngredients: missing,
    usedCount: used.length,
    missingCount: missing.length,
    // Coincidencia calculada a partir de los datos que devuelve la API:
    // ingredientes disponibles / ingredientes totales de la receta.
    matchPercent: total > 0 ? Math.round((used.length / total) * 100) : null,
    readyInMinutes: null, // este endpoint no informa tiempos
    diets: [],
  }
}

/**
 * Busca recetas según los ingredientes disponibles.
 * @param {object} options
 * @param {string[]} options.ingredients ingredientes en español (se traducen acá)
 */
export async function searchByIngredients({
  ingredients,
  ranking = 1,
  number = 12,
  ignorePantry = true,
}) {
  const apiIngredients = ingredients.map(toApiIngredient).filter(Boolean)
  if (apiIngredients.length === 0) return []

  const cacheKey = `byIng|${apiIngredients.join(',')}|${ranking}|${number}|${ignorePantry}`
  const cached = getCached(cacheKey, SEARCH_TTL)
  if (cached) return cached

  const data = await api.findByIngredients({
    ingredients: apiIngredients,
    number,
    ranking,
    ignorePantry,
  })

  const results = (data || []).map(mapIngredientResult)

  // Guarda qué ingredientes se tenían o faltaban para cada receta (en memoria).
  for (const recipe of results) {
    ingredientMatches.set(Number(recipe.id), {
      usedIds: new Set(recipe.usedIngredients.map((i) => i.id)),
      missingIds: new Set(recipe.missingIngredients.map((i) => i.id)),
    })
  }

  setCached(cacheKey, results)
  return results
}

/**
 * Búsqueda avanzada con filtros (pagina con offset).
 * @returns {Promise<{results: Array, totalResults: number|null, offset: number, number: number}>}
 */
export async function searchAdvanced(filters = {}) {
  const { number = 12, offset = 0 } = filters
  const cacheKey = `adv|${JSON.stringify({ ...filters, number, offset })}`
  const cached = getCached(cacheKey, SEARCH_TTL)
  if (cached) return cached

  const data = await api.complexSearch({ ...filters, number, offset })

  const results = (data.results || []).map((raw) => ({
    id: raw.id,
    title: raw.title,
    image: raw.image || null,
    readyInMinutes: typeof raw.readyInMinutes === 'number' ? raw.readyInMinutes : null,
    diets: Array.isArray(raw.diets) ? raw.diets : [],
    cuisines: Array.isArray(raw.cuisines) ? raw.cuisines : [],
    usedIngredients: [],
    missingIngredients: [],
    usedCount: null,
    missingCount: null,
    // La búsqueda avanzada no informa ingredientes usados/faltantes:
    // no se muestra ninguna coincidencia para no inventar datos.
    matchPercent: null,
  }))

  const payload = {
    results,
    totalResults: typeof data.totalResults === 'number' ? data.totalResults : null,
    offset: typeof data.offset === 'number' ? data.offset : offset,
    number: typeof data.number === 'number' ? data.number : number,
  }

  setCached(cacheKey, payload)
  return payload
}

/**
 * Información completa de una receta (solo al abrirla).
 * Se cachea en memoria para no repetir la consulta dentro de la sesión.
 */
export async function getRecipeDetail(id) {
  const cacheKey = `detail|${Number(id)}`
  const cached = getCached(cacheKey, DETAIL_TTL)
  if (cached) return cached

  const data = await api.getRecipeInformation(id)
  setCached(cacheKey, data)
  return data
}

/**
 * Devuelve el contexto de ingredientes de la última búsqueda por ingredientes
 * para esta receta, o null si no hay contexto (búsqueda avanzada, reciente, etc.).
 */
export function getIngredientMatch(recipeId) {
  return ingredientMatches.get(Number(recipeId)) || null
}

/** Traduce un error de la API a un mensaje listo para mostrar. */
export function getErrorMessage(error) {
  return error?.message || 'No pudimos completar la búsqueda. Volvé a intentar.'
}
