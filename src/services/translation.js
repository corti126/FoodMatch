/**
 * Servicio centralizado de traducción al español (rioplatense/argentino).
 *
 * Arquitectura híbrida (prioridad):
 *  1. Diccionario exacto (rápido, sin dependencias, cobertura de vocabulario cerrado)
 *  2. Modelo local (Transformers.js / opus-mt-en-es) para texto dinámico no reconocido
 *  3. Normalización gastronómica argentina (regionalismos)
 *  4. Fallback controlado (devuelve texto original sin romper la UI)
 *
 * Nunca se traducen: IDs, URLs, cantidades numéricas, unidades de medida
 * (tienen diccionario propio), ni valores utilizados internamente para búsquedas.
 *
 * El modelo local se carga de forma perezosa y no bloqueante: la aplicación
 * sigue funcionando con solo diccionarios mientras se descarga.
 */

import {
  translateIngredientName,
} from '../data/translations/ingredients.js'
export { translateIngredientName }
import { translateUnit } from '../data/translations/units.js'
import { translateCuisine } from '../data/translations/cuisines.js'
import { translateMealType } from '../data/translations/mealTypes.js'
import { translateDiet } from '../data/translations/diets.js'
import { translateIntolerance } from '../data/translations/intolerances.js'
import { translateCategory } from '../data/translations/categories.js'
import { translateNutrient } from '../data/translations/nutrition.js'
import { translateCookingTerm } from '../data/translations/cookingTerms.js'

// ---------------------------------------------------------------------------
// Caché en memoria: evita traducir dos veces el mismo texto.
// ---------------------------------------------------------------------------
const translationCache = new Map()

function cacheGet(key) {
  return translationCache.get(key) ?? null
}

function cacheSet(key, value) {
  translationCache.set(key, value)
}

// ---------------------------------------------------------------------------
// Normalización de claves para búsqueda en diccionarios.
// ---------------------------------------------------------------------------
function normalizeKey(text) {
  if (!text || typeof text !== 'string') return ''
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

// ---------------------------------------------------------------------------
// Traducción de un término con diccionarios (prioridad 1).
// Intenta diccionarios de mayor especificidad primero.
// ---------------------------------------------------------------------------
function translateWithDictionaries(text) {
  if (!text || typeof text !== 'string') return text
  const key = normalizeKey(text)

  // 1. Ingrediente completo (más específico)
  const ingredient = translateIngredientName(key)
  if (ingredient !== key) return ingredient

  // 2. Unidad de medida
  const unit = translateUnit(key)
  if (unit !== key) return unit

  // 3. Cocina
  const cuisine = translateCuisine(key)
  if (cuisine !== key) return cuisine

  // 4. Dieta
  const diet = translateDiet(key)
  if (diet !== key) return diet

  // 5. Intolerancia
  const intolerance = translateIntolerance(key)
  if (intolerance !== key) return intolerance

  // 6. Tipo de comida
  const mealType = translateMealType(key)
  if (mealType !== key) return mealType

  // 7. Categoría
  const category = translateCategory(key)
  if (category !== key) return category

  // 8. Término culinario (modificador, menos específico)
  const cookingTerm = translateCookingTerm(key)
  if (cookingTerm !== key) return cookingTerm

  return text
}

// ---------------------------------------------------------------------------
// Modelo local (prioridad 2): carga perezosa y no bloqueante.
// ---------------------------------------------------------------------------
let translationModel = null
let modelLoadPromise = null
let modelFailed = false
let modelLoadError = null

const MODEL_LOAD_TIMEOUT = 60000 // 60 segundos máximo para cargar el modelo

async function ensureModelLoaded() {
  if (translationModel) return translationModel
  if (modelFailed) return null
  if (modelLoadPromise) return modelLoadPromise

  modelLoadPromise = (async () => {
    try {
      // Import dinámico: Vite lo maneja como chunk separado, no lo resuelve
      // en build time. Si @huggingface/transformers no está instalado,
      // falla aquí y se usa solo diccionarios.
      const mod = await import('@huggingface/transformers')
      const { pipeline } = mod

      // Cargar el modelo con timeout para no esperar indefinidamente
      const loadPromise = pipeline('translation', 'Xenova/opus-mt-en-es')
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout cargando modelo de traducción')), MODEL_LOAD_TIMEOUT)
      )

      translationModel = await Promise.race([loadPromise, timeoutPromise])
      return translationModel
    } catch (err) {
      modelFailed = true
      modelLoadError = err.message
      console.warn(
        '[translation] No se pudo cargar el modelo local de traducción. ' +
          'Se usará solo diccionarios. Detalle:',
        err.message,
      )
      return null
    }
  })()

  return modelLoadPromise
}

// ---------------------------------------------------------------------------
// Protección de cantidades y números en texto libre.
// ---------------------------------------------------------------------------
const QTY_REGEX =
  /(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)\s*(cups?|tablespoons?|teaspoons?|ounces?|pounds?|grams?|kilograms?|milliliters?|liters?|ml|l|oz|lb|lbs|kg|g|pieces?|slices?|cloves?|pinches?|dashes?|cans?|bottles?|jars?|packages?|bags?)/gi

function protectQuantities(text) {
  const placeholders = []
  const qtyProtected = text.replace(QTY_REGEX, (match) => {
    const ph = `__QTY${placeholders.length}__`
    placeholders.push(match)
    return ph
  })
  return { protected: qtyProtected, placeholders }
}

function restoreQuantities(text, placeholders) {
  return text.replace(/__QTY(\d+)__/g, (_, index) => placeholders[Number(index)])
}

const NUMBER_REGEX = /\b\d+(?:\.\d+)?\b/g

function protectNumbers(text) {
  const placeholders = []
  const numsProtected = text.replace(NUMBER_REGEX, (match) => {
    const ph = `__NUM${placeholders.length}__`
    placeholders.push(match)
    return ph
  })
  return { protected: numsProtected, placeholders }
}

function restoreNumbers(text, placeholders) {
  return text.replace(/__NUM(\d+)__/g, (_, index) => placeholders[Number(index)])
}

// ---------------------------------------------------------------------------
// Traducción de texto libre (títulos, descripciones, instrucciones).
// ---------------------------------------------------------------------------
async function translateFreeText(text) {
  if (!text || typeof text !== 'string') return text
  const trimmed = text.trim()
  if (!trimmed) return text

  const cacheKey = `free:${trimmed}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // Paso 1: diccionario exacto (frases hechas)
  const dictResult = translateWithDictionaries(trimmed)
  if (dictResult !== trimmed) {
    cacheSet(cacheKey, dictResult)
    return dictResult
  }

  // Paso 2: modelo local para texto dinámico
  const model = await ensureModelLoaded()
  if (model) {
    try {
      const sentences = splitSentences(trimmed)
      const translatedSentences = await Promise.all(
        sentences.map(async (sentence) => {
          if (!sentence.trim()) return sentence
          const { protected: protectedText, placeholders } =
            protectQuantities(sentence)
          const { protected: protectedNums, placeholders: numPlaceholders } =
            protectNumbers(protectedText)

          const result = await model(protectedNums, {
            max_length: 512,
          })
          let translated = result[0]?.translation_text || protectedNums
          translated = restoreNumbers(translated, numPlaceholders)
          translated = restoreQuantities(translated, placeholders)
          return translated
        }),
      )

      const translated = translatedSentences.join(' ')
      cacheSet(cacheKey, translated)
      return translated
    } catch (err) {
      console.warn('[translation] Error traduciendo texto libre:', err.message)
    }
  }

  // Paso 3: fallback — devolver texto original (sin romper la UI)
  cacheSet(cacheKey, trimmed)
  return trimmed
}

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Traducción de un ingrediente individual (nombre, unidad, meta).
// ---------------------------------------------------------------------------
export function translateIngredient(ingredient) {
  if (!ingredient || typeof ingredient !== 'object') return ingredient

  const cacheKey = `ing:${ingredient.id ?? ingredient.name}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const translated = {
    ...ingredient,
    unit: translateUnit(ingredient.unit) || ingredient.unit,
    name: translateIngredientName(ingredient.name),
    meta: (ingredient.meta || []).map((m) => translateCookingTerm(m) || m),
  }

  cacheSet(cacheKey, translated)
  return translated
}

// ---------------------------------------------------------------------------
// Traducción de una receta de búsqueda (resultado de tarjeta).
// ---------------------------------------------------------------------------
export async function translateRecipeResult(rawRecipe) {
  if (!rawRecipe) return null

  const cacheKey = `recipe:${rawRecipe.id}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const translated = {
    ...rawRecipe,
    title: await translateFreeText(rawRecipe.title),
    usedIngredients: (rawRecipe.usedIngredients || []).map(translateIngredient),
    missingIngredients: (rawRecipe.missingIngredients || []).map(
      translateIngredient,
    ),
    cuisines: (rawRecipe.cuisines || []).map((c) => translateCuisine(c)),
    diets: (rawRecipe.diets || []).map((d) => translateDiet(d)),
  }

  cacheSet(cacheKey, translated)
  return translated
}

// ---------------------------------------------------------------------------
// Traducción de una receta completa (detalle).
// ---------------------------------------------------------------------------
export async function translateRecipeDetail(rawDetail) {
  if (!rawDetail) return null

  const cacheKey = `detail:${rawDetail.id}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const extendedIngredients = (rawDetail.extendedIngredients || []).map(
    translateIngredient,
  )

  let analyzedInstructions = null
  if (rawDetail.analyzedInstructions) {
    analyzedInstructions = await Promise.all(
      rawDetail.analyzedInstructions.map(async (section) => {
        return {
          ...section,
          steps: await Promise.all(
            (section.steps || []).map(async (step) => {
              return {
                ...step,
                step: await translateFreeText(step.step),
              }
            }),
          ),
        }
      }),
    )
  }

  let instructions = null
  if (rawDetail.instructions) {
    instructions = await translateFreeText(rawDetail.instructions)
  }

  let summary = null
  if (rawDetail.summary) {
    summary = await translateFreeText(rawDetail.summary)
  }

  const translated = {
    ...rawDetail,
    title: await translateFreeText(rawDetail.title),
    summary,
    extendedIngredients,
    analyzedInstructions,
    instructions,
    cuisines: (rawDetail.cuisines || []).map((c) => translateCuisine(c)),
    diets: (rawDetail.diets || []).map((d) => translateDiet(d)),
  }

  cacheSet(cacheKey, translated)
  return translated
}

// ---------------------------------------------------------------------------
// Utilidades expuestas.
// ---------------------------------------------------------------------------

export function translateNutrientName(name) {
  return translateNutrient(name)
}

export function translateIntolerances(list = []) {
  return list.map((i) => translateIntolerance(i))
}

export function translateDiets(list = []) {
  return list.map((d) => translateDiet(d))
}

export function translateCuisines(list = []) {
  return list.map((c) => translateCuisine(c))
}

export function clearTranslationCache() {
  translationCache.clear()
}

export function findUntranslatedTexts(recipes = []) {
  const untranslated = new Set()
  const englishLike = /[a-zA-Z]{4,}/

  for (const recipe of recipes) {
    if (recipe.title && englishLike.test(recipe.title)) {
      untranslated.add(recipe.title)
    }
    if (recipe.summary && englishLike.test(recipe.summary)) {
      untranslated.add(recipe.summary.slice(0, 120))
    }
  }

  return Array.from(untranslated)
}

export function isModelAvailable() {
  return Boolean(translationModel)
}

export function isModelLoading() {
  return Boolean(modelLoadPromise) && !translationModel
}

export function getModelLoadError() {
  return modelLoadError
}
