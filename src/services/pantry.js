/** Persistencia de la despensa en Cloud Firestore (privada por usuario). */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase.js'

const pantryCollection = (uid) => collection(db, 'users', uid, 'pantry')

/** Normaliza los campos antes de enviarlos a Firestore. */
function sanitize(data) {
  const quantity = Number(data.quantity)
  return {
    name: String(data.name ?? '').trim(),
    quantity: Number.isFinite(quantity) && data.quantity !== '' && data.quantity !== null
      ? quantity
      : null,
    unit: String(data.unit ?? '').trim(),
    category: String(data.category ?? 'Otros').trim() || 'Otros',
    notes: String(data.notes ?? '').trim(),
    expiresAt: data.expiresAt ? String(data.expiresAt) : null,
  }
}

/**
 * Suscripción reactiva a la despensa del usuario.
 * Devuelve la función de desuscripción (limpiar al desmontar).
 */
export function subscribePantry(uid, onData, onError) {
  return onSnapshot(
    pantryCollection(uid),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Orden: más recientes primero (sin requerir índice compuesto).
      items.sort(
        (a, b) =>
          (b.addedAt?.toMillis?.() ?? 0) - (a.addedAt?.toMillis?.() ?? 0),
      )
      onData(items)
    },
    (error) => {
      console.warn('[Despensa] Error al escuchar cambios:', error)
      onError?.(error)
    },
  )
}

/** Agrega un ingrediente a la despensa. */
export async function addPantryItem(uid, data) {
  const payload = sanitize(data)
  payload.addedAt = serverTimestamp()
  const reference = await addDoc(pantryCollection(uid), payload)
  return reference.id
}

/** Actualiza un ingrediente existente (no modifica la fecha de ingreso). */
export async function updatePantryItem(uid, itemId, data) {
  await updateDoc(doc(db, 'users', uid, 'pantry', itemId), sanitize(data))
}

/** Elimina un ingrediente de la despensa. */
export async function deletePantryItem(uid, itemId) {
  await deleteDoc(doc(db, 'users', uid, 'pantry', itemId))
}
