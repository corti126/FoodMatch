import { useContext } from 'react'
import { FavoritesContext } from '../context/FavoritesContext.jsx'

/** Acceso a los favoritos del usuario (lista compartida, un solo listener). */
export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>')
  }
  return context
}
