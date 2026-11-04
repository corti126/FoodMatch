import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

/** Hook de acceso al estado de autenticación. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}
