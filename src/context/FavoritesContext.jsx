import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { addFavorite, removeFavorite, subscribeFavorites } from '../services/favorites.js'

const FavoritesContext = createContext(null)

/**
 * Suscripción única a los favoritos del usuario: todos los componentes
 * comparten la misma lista en lugar de abrir listeners duplicados.
 * El uid viaja junto a los datos; si cambia la cuenta (o no hay sesión),
 * los valores expuestos se derivan vacíos sin resetearlos en un efecto.
 */
export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({ uid: null, items: [], error: null })

  useEffect(() => {
    if (!user) return undefined

    const uid = user.uid
    const unsubscribe = subscribeFavorites(
      uid,
      (items) => setState({ uid, items, error: null }),
      (error) => setState((current) => ({ ...current, uid, error })),
    )
    return unsubscribe
  }, [user])

  const active = Boolean(user) && state.uid === user.uid
  // Memoizado para que la referencia sea estable y no re-renderice el árbol.
  const favorites = useMemo(
    () => (active ? state.items : []),
    [active, state.items],
  )
  const loading = user ? !active : false
  const error = active ? state.error : null

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => Number(item.id))),
    [favorites],
  )

  const isFavorite = useCallback(
    (recipeId) => favoriteIds.has(Number(recipeId)),
    [favoriteIds],
  )

  /** Agrega o quita una receta de favoritos. Lanza error si falla la escritura. */
  const toggleFavorite = useCallback(
    async (recipe) => {
      if (!user) throw new Error('Sesión requerida')
      if (favoriteIds.has(Number(recipe.id))) {
        await removeFavorite(user.uid, recipe.id)
      } else {
        await addFavorite(user.uid, recipe)
      }
    },
    [user, favoriteIds],
  )

  const value = useMemo(
    () => ({ favorites, loading, error, isFavorite, toggleFavorite }),
    [favorites, loading, error, isFavorite, toggleFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export { FavoritesContext }
