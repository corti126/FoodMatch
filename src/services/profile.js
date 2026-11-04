/** Preferencias del usuario en Cloud Firestore (users/{uid}/preferences/data). */

import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

const preferencesRef = (uid) => doc(db, 'users', uid, 'preferences', 'data')

export const DEFAULT_PREFERENCES = {
  diets: [], // valores de Spoonacular: vegetarian, vegan, pescetarian, gluten free
  intolerances: [], // dairy, egg, gluten, peanut, tree nut, soy, seafood, shellfish
  nutrition: {
    minProtein: null, // gramos por porción
    maxCalories: null, // calorías por porción
  },
  units: 'metrico', // 'metrico' | 'imperial'
  applyToSearch: true, // aplicar preferencias automáticamente al buscar
}

const numOrNull = (value) => {
  const n = Number(value)
  return Number.isFinite(n) && value !== '' && value !== null && value !== undefined
    ? n
    : null
}

/** Suscripción reactiva a las preferencias (con valores por defecto). */
export function subscribePreferences(uid, onData, onError) {
  return onSnapshot(
    preferencesRef(uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData({ ...DEFAULT_PREFERENCES })
        return
      }
      const data = snapshot.data()
      onData({
        ...DEFAULT_PREFERENCES,
        ...data,
        nutrition: {
          ...DEFAULT_PREFERENCES.nutrition,
          ...(data.nutrition || {}),
        },
      })
    },
    (error) => {
      console.warn('[Preferencias] Error al escuchar cambios:', error)
      onError?.(error)
    },
  )
}

/** Guarda las preferencias del usuario. */
export async function savePreferences(uid, prefs) {
  await setDoc(
    preferencesRef(uid),
    {
      diets: Array.isArray(prefs.diets) ? prefs.diets : [],
      intolerances: Array.isArray(prefs.intolerances) ? prefs.intolerances : [],
      nutrition: {
        minProtein: numOrNull(prefs.nutrition?.minProtein),
        maxCalories: numOrNull(prefs.nutrition?.maxCalories),
      },
      units: prefs.units === 'imperial' ? 'imperial' : 'metrico',
      applyToSearch: Boolean(prefs.applyToSearch),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
