/** Historial de búsquedas del usuario en Cloud Firestore. */

import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

const historyCollection = (uid) => collection(db, 'users', uid, 'searchHistory')

/** Suscripción a las últimas búsquedas (máximo 20).
 * No usa orderBy en Firebase para evitar requerir un índice compuesto;
 * se ordena en el cliente por createdAt descendente.
 */
export function subscribeSearchHistory(uid, onData, onError) {
  if (!uid) {
    onError?.(new Error('UID requerido'))
    return () => {}
  }
  const q = query(historyCollection(uid), limit(50))
  return onSnapshot(
    q,
    (snapshot) => {
      try {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        docs.sort(
          (a, b) => {
            const aTime = a.createdAt?.seconds ?? 0
            const bTime = b.createdAt?.seconds ?? 0
            if (bTime !== aTime) return bTime - aTime
            return (b.createdAt?.nanoseconds ?? 0) - (a.createdAt?.nanoseconds ?? 0)
          },
        )
        onData(docs.slice(0, 20))
      } catch (err) {
        onError?.(err)
      }
    },
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
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}
