/**
 * Valida que las variables de entorno críticas estén definidas antes del build.
 *
 * Las variables VITE_* se incrustan en el bundle en tiempo de build.
 * Firebase es obligatorio: sin él la aplicación no inicializa.
 * Spoonacular es opcional: sin ella la búsqueda muestra un aviso honesto pero
 * la app no se rompe.
 *
 * En CI lee de process.env (GitHub Secrets). En desarrollo local lee
 * .env.local como fallback. Nunca imprime los valores de los secretos.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const REQUIRED_FIREBASE = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const OPTIONAL_SPOONACULAR = ['VITE_SPOONACULAR_API_KEY']

// Carga variables de .env.local si existen (fallback para desarrollo local).
const envFromFile = {}
const envFilePath = resolve(process.cwd(), '.env.local')
if (existsSync(envFilePath)) {
  const lines = readFileSync(envFilePath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (key && !(key in envFromFile)) {
      envFromFile[key] = value
    }
  }
}

function getValue(name) {
  return process.env[name] ?? envFromFile[name] ?? undefined
}

const missingFirebase = REQUIRED_FIREBASE.filter((name) => {
  const value = getValue(name)
  return value === undefined || value === ''
})

const missingSpoonacular = OPTIONAL_SPOONACULAR.filter((name) => {
  const value = getValue(name)
  return value === undefined || value === ''
})

if (missingFirebase.length > 0) {
  console.error(
    '[build] Faltan variables de entorno de Firebase obligatorias: ' +
      missingFirebase.join(', ') +
      '. Configurá los GitHub Secrets correspondientes (o .env.local en desarrollo).',
  )
  process.exit(1)
}

if (missingSpoonacular.length > 0) {
  console.warn(
    '[build] Advertencia: VITE_SPOONACULAR_API_KEY no está definida. ' +
      'Las búsquedas mostrarán un aviso de "falta configurar la API key". ' +
      'Agregá el secreto en GitHub Actions o .env.local para habilitar búsquedas.',
  )
}

console.log('[build] Variables de entorno validadas correctamente.')
