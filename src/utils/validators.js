/** Validaciones de formularios (mensajes en español). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? '').trim())
}

export function validateLogin({ email, password }) {
  const errors = {}
  const cleanEmail = String(email ?? '').trim()

  if (!cleanEmail) errors.email = 'Ingresá tu correo electrónico.'
  else if (!isValidEmail(cleanEmail)) errors.email = 'Ingresá un correo electrónico válido.'

  if (!password) errors.password = 'Ingresá tu contraseña.'

  return errors
}

export function validateRegister({ email, password, confirm }) {
  const errors = validateLogin({ email, password })
  const cleanPassword = String(password ?? '')

  if (cleanPassword && cleanPassword.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (confirm !== undefined && cleanPassword !== String(confirm ?? '')) {
    errors.confirm = 'Las contraseñas no coinciden.'
  }

  return errors
}

export function validateReset({ email }) {
  const errors = {}
  const cleanEmail = String(email ?? '').trim()

  if (!cleanEmail) errors.email = 'Ingresá tu correo electrónico.'
  else if (!isValidEmail(cleanEmail)) errors.email = 'Ingresá un correo electrónico válido.'

  return errors
}

/** Ingredientes de despensa: nombre obligatorio. */
export function validatePantryItem({ name }) {
  const errors = {}
  const cleanName = String(name ?? '').trim()
  if (!cleanName) errors.name = 'Ingresá el nombre del ingrediente.'
  else if (cleanName.length > 120) errors.name = 'El nombre es demasiado largo.'
  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}
