// Caché en memoria (solo dura la sesión): reutiliza respuestas recientes
// de Spoonacular sin persistir datos de recetas en disco ni en Firestore.

const store = new Map()
const MAX_ENTRIES = 80

/**
 * Devuelve el valor cacheado si existe y no expiró.
 * @param {string} key
 * @param {number} ttlMs vida útil en milisegundos
 */
export function getCached(key, ttlMs = 5 * 60 * 1000) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.at > ttlMs) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

/** Guarda un valor en la caché (siempre reemplaza la clave existente). */
export function setCached(key, value) {
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value
    store.delete(oldestKey)
  }
  store.set(key, { value, at: Date.now() })
}

/** Vacía la caché (por ejemplo, al cerrar sesión). */
export function clearCache() {
  store.clear()
}
