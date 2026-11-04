import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase.js'

// Mensajes de error en español para los códigos habituales de Firebase Auth.
const AUTH_MESSAGES = {
  'auth/email-already-in-use': 'Ya existe una cuenta registrada con ese correo electrónico.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/missing-email': 'Ingresá tu correo electrónico.',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo electrónico.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
  'auth/invalid-login-credentials': 'El correo o la contraseña son incorrectos.',
  'auth/too-many-requests':
    'Demasiados intentos seguidos. Esperá unos minutos y volvé a intentar.',
  'auth/network-request-failed':
    'No pudimos conectar. Revisá tu conexión a internet e intentá de nuevo.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
  'auth/operation-not-allowed':
    'La autenticación por correo no está habilitada en Firebase Console.',
  'auth/invalid-action-code':
    'El enlace de recuperación expiró o ya fue usado. Solicitá uno nuevo.',
  'auth/expired-action-code': 'El enlace de recuperación expiró. Solicitá uno nuevo.',
  'auth/requires-recent-login':
    'Por seguridad, volvé a iniciar sesión antes de continuar.',
}

/** Traduce un error de Firebase Auth a un mensaje amigable en español. */
export function translateAuthError(error) {
  const code = error?.code || ''
  return (
    AUTH_MESSAGES[code] ||
    'Ocurrió un error inesperado. Volvé a intentar en unos momentos.'
  )
}

/**
 * Crea el documento del usuario en Firestore (privado, reglas por UID).
 * Si falla (por ejemplo, reglas aún desplegadas), no bloquea el registro:
 * el documento se intentará crear de nuevo en el próximo inicio de sesión.
 */
export async function ensureUserProfile(user, { isNew = false } = {}) {
  const data = {
    email: user.email || '',
    displayName: user.displayName || '',
    updatedAt: serverTimestamp(),
  }
  if (isNew) data.createdAt = serverTimestamp()
  await setDoc(doc(db, 'users', user.uid), data, { merge: true })
}

/** Registro con correo y contraseña. No usa autenticación anónima ni Google. */
export async function signUp(email, password, displayName = '') {
  const cleanEmail = String(email).trim()
  const cleanName = String(displayName ?? '').trim()

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password)

  if (cleanName) {
    try {
      await updateProfile(credential.user, { displayName: cleanName })
    } catch (error) {
      console.warn('[Auth] No se pudo guardar el nombre de perfil:', error)
    }
  }

  try {
    await ensureUserProfile(credential.user, { isNew: true })
  } catch (error) {
    console.warn('[Auth] No se pudo crear el documento de usuario:', error)
  }

  return credential.user
}

/** Inicio de sesión con correo y contraseña. */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    String(email).trim(),
    password,
  )

  // Mejora best-effort del perfil (no bloquea el inicio de sesión).
  try {
    await ensureUserProfile(credential.user)
  } catch (error) {
    console.warn('[Auth] No se pudo actualizar el documento de usuario:', error)
  }

  return credential.user
}

/** Cierre de sesión. */
export async function signOutUser() {
  await signOut(auth)
}

/** Envía un enlace de recuperación de contraseña por correo. */
export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, String(email).trim())
}
