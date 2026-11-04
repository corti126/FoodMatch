/** Historial de búsquedas del usuario en Cloud Firestore. */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

const historyCollection = (uid) => collection(db, 'users', uid, 'searchHistory')

/** Suscripción a las últimas búsquedas (máximo 20). */
export function subscribeSearchHistory(uid, onData, onError) {
  const q = query(historyCollection(uid), orderBy('createdAt', 'desc'), limit(20))
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => {
      console.warn('[Historial] Error al escuchar cambios:', error)
      onError?.(error)
    },
  )
}

/**
 * Registra una búsqueda. Nunca falla la operación principal:
 * si el registro no se puede guardar, solo se avisa por consola.
 */
export async function logSearch(uid, entry) {
  if (!uid) return
  try {
    await addDoc(historyCollection(uid), {
      type: entry.type === 'avanzada' ? 'avanzada' : 'ingredientes',
      term: String(entry.term ?? '').slice(0, 200),
      summary: String(entry.summary ?? '').slice(0, 300),
      params:
        entry.params && typeof entry.params === 'object'
          ? JSON.parse(JSON.stringify(entry.params))
          : null,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.warn('[Historial] No se pudo registrar la búsqueda:', error)
  }
}

/** Elimina todo el historial de búsquedas del usuario. */
export async function clearSearchHistory(uid) {
  const snapshot = await getDocs(historyCollection(uid))
  await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(d.ref))))
}
