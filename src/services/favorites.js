/**
 * Favoritos en Cloud Firestore.
 * Se guarda solo lo mínimo necesario (id, título, imagen, tiempo),
 * según las condiciones de almacenamiento de Spoonacular.
 */

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase.js'

const favoriteRef = (uid, recipeId) =>
  doc(db, 'users', uid, 'favorites', String(recipeId))

/** Suscripción reactiva a los favoritos del usuario. */
export function subscribeFavorites(uid, onData, onError) {
  return onSnapshot(
    collection(db, 'users', uid, 'favorites'),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort(
        (a, b) => (b.savedAt?.toMillis?.() ?? 0) - (a.savedAt?.toMillis?.() ?? 0),
      )
      onData(items)
    },
    (error) => {
      console.warn('[Favoritos] Error al escuchar cambios:', error)
      onError?.(error)
    },
  )
}

/** Guarda una receta como favorita (datos mínimos). */
export async function addFavorite(uid, recipe) {
  await setDoc(favoriteRef(uid, recipe.id), {
    id: Number(recipe.id),
    title: String(recipe.title ?? '').slice(0, 300),
    image: recipe.image ? String(recipe.image) : null,
    readyInMinutes:
      typeof recipe.readyInMinutes === 'number' ? recipe.readyInMinutes : null,
    savedAt: serverTimestamp(),
  })
}

/** Quita una receta de favoritos. */
export async function removeFavorite(uid, recipeId) {
  await deleteDoc(favoriteRef(uid, recipeId))
}
