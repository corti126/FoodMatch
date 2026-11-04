import { createContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase.js'
import {
  ensureUserProfile,
  sendPasswordReset,
  signIn,
  signOutUser,
  signUp,
} from '../services/auth.js'
import { clearCache } from '../utils/cache.js'

export const AuthContext = createContext(null)

/**
 * Estado global de autenticación (Firebase Authentication con correo y
 * contraseña). La sesión persiste entre visitas según la configuración
 * por defecto de Firebase; no se usa LocalStorage como identidad.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      register: (email, password, displayName) =>
        signUp(email, password, displayName),
      login: (email, password) => signIn(email, password),
      logout: async () => {
        await signOutUser()
        clearCache() // la caché de recetas no debe cruzar cuentas
      },
      resetPassword: (email) => sendPasswordReset(email),
      refreshProfile: () => (user ? ensureUserProfile(user) : Promise.resolve()),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
