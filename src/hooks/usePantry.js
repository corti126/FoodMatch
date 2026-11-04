import { useContext } from 'react'
import { PantryContext } from '../context/PantryContext.jsx'

/** Acceso a la despensa del usuario (lista compartida, un solo listener). */
export function usePantry() {
  const context = useContext(PantryContext)
  if (!context) {
    throw new Error('usePantry debe usarse dentro de <PantryProvider>')
  }
  return context
}
