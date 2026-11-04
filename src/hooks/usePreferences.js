import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import {
  DEFAULT_PREFERENCES,
  subscribePreferences,
} from '../services/profile.js'

/**
 * Preferencias del usuario (dietas, intolerancias, nutrición, unidades).
 * Se suscribe solo cuando hay sesión y se limpia al desmontar.
 * El uid viaja junto a los datos: sin sesión se exponen los valores por
 * defecto, sin resetear el estado en un efecto.
 */
export function usePreferences() {
  const { user } = useAuth()
  const [state, setState] = useState({
    uid: null,
    preferences: null,
    error: null,
  })

  useEffect(() => {
    if (!user) return undefined

    const uid = user.uid
    const unsubscribe = subscribePreferences(
      uid,
      (data) => setState({ uid, preferences: data, error: null }),
      (error) => setState((current) => ({ ...current, uid, error })),
    )
    return unsubscribe
  }, [user])

  const active = Boolean(user) && state.uid === user.uid

  return {
    preferences: active ? state.preferences : DEFAULT_PREFERENCES,
    loading: user ? !active : false,
    error: active ? state.error : null,
  }
}
