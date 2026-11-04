import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import {
  addPantryItem,
  deletePantryItem,
  subscribePantry,
  updatePantryItem,
} from '../services/pantry.js'

const PantryContext = createContext(null)

/**
 * Suscripción única a la despensa del usuario: se comparte entre páginas
 * (Inicio, Despensa y búsqueda con la despensa). El uid viaja junto a los
 * datos para derivar valores vacíos sin resetearlos en un efecto.
 */
export function PantryProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({ uid: null, items: [], error: null })

  useEffect(() => {
    if (!user) return undefined

    const uid = user.uid
    const unsubscribe = subscribePantry(
      uid,
      (items) => setState({ uid, items, error: null }),
      (error) => setState((current) => ({ ...current, uid, error })),
    )
    return unsubscribe
  }, [user])

  const active = Boolean(user) && state.uid === user.uid
  // Memoizado para que la referencia sea estable y no re-renderice el árbol.
  const items = useMemo(() => (active ? state.items : []), [active, state.items])
  const loading = user ? !active : false
  const error = active ? state.error : null

  const addItem = useCallback(
    (data) => {
      if (!user) return Promise.reject(new Error('Sesión requerida'))
      return addPantryItem(user.uid, data)
    },
    [user],
  )

  const updateItem = useCallback(
    (itemId, data) => {
      if (!user) return Promise.reject(new Error('Sesión requerida'))
      return updatePantryItem(user.uid, itemId, data)
    },
    [user],
  )

  const removeItem = useCallback(
    (itemId) => {
      if (!user) return Promise.reject(new Error('Sesión requerida'))
      return deletePantryItem(user.uid, itemId)
    },
    [user],
  )

  const value = useMemo(
    () => ({ items, loading, error, addItem, updateItem, removeItem }),
    [items, loading, error, addItem, updateItem, removeItem],
  )

  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>
}

export { PantryContext }
