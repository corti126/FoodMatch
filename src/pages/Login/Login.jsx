import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { translateAuthError } from '../../services/auth.js'
import { hasErrors, validateLogin, validateReset } from '../../utils/validators.js'
import './Login.css'

export default function Login() {
  usePageTitle('Iniciar sesión')
  const { login, resetPassword } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from
  const fromLabel = from ? ` para volver a "${from.pathname}"` : ''

  const updateField = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    setInfo(null)

    const validation = validateLogin(form)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSubmitting(true)
    try {
      await login(form.email, form.password)
      // La redirección la resuelve GuestRoutes al detectar la sesión.
    } catch (error) {
      setFormError(translateAuthError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    setFormError(null)
    setInfo(null)

    const validation = validateReset({ email: form.email })
    setErrors(validation)
    if (hasErrors(validation)) return

    setSubmitting(true)
    try {
      await resetPassword(form.email)
      setInfo(
        'Te enviamos un correo con las instrucciones para restablecer tu contraseña. Revisá también la carpeta de spam.',
      )
    } catch (error) {
      setFormError(translateAuthError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">
        {mode === 'login' ? 'Iniciar sesión' : 'Recuperar contraseña'}
      </h1>
      <p className="auth-page__subtitle">
        {mode === 'login'
          ? `Ingresá con tu correo y contraseña${fromLabel}.`
          : 'Ingresá tu correo y te enviaremos un enlace para crear una nueva contraseña.'}
      </p>

      {formError && <ErrorMessage title="No pudimos continuar" message={formError} />}
      {info && (
        <div className="alert alert-info" role="status">
          <Icon name="checkCircle" size={18} />
          <p>{info}</p>
        </div>
      )}

      {mode === 'login' ? (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="label">Correo electrónico</span>
            <div className="auth-form__control">
              <Icon name="mail" size={17} className="auth-form__icon" />
              <input
                className={`input${errors.email ? ' has-error' : ''}`}
                type="email"
                autoComplete="email"
                placeholder="vos@ejemplo.com"
                value={form.email}
                onChange={(event) => updateField({ email: event.target.value })}
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label className="field">
            <span className="label">Contraseña</span>
            <div className="auth-form__control">
              <Icon name="lock" size={17} className="auth-form__icon" />
              <input
                className={`input${errors.password ? ' has-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={form.password}
                onChange={(event) => updateField({ password: event.target.value })}
              />
              <button
                type="button"
                className="auth-form__toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Iniciar sesión'}
          </button>

          <button
            type="button"
            className="auth-form__link"
            onClick={() => {
              setMode('reset')
              setErrors({})
              setFormError(null)
              setInfo(null)
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleReset} noValidate>
          <label className="field">
            <span className="label">Correo electrónico</span>
            <div className="auth-form__control">
              <Icon name="mail" size={17} className="auth-form__icon" />
              <input
                className={`input${errors.email ? ' has-error' : ''}`}
                type="email"
                autoComplete="email"
                placeholder="vos@ejemplo.com"
                value={form.email}
                onChange={(event) => updateField({ email: event.target.value })}
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </button>

          <button
            type="button"
            className="auth-form__link"
            onClick={() => {
              setMode('login')
              setErrors({})
              setFormError(null)
              setInfo(null)
            }}
          >
            Volver a iniciar sesión
          </button>
        </form>
      )}

      {mode === 'login' && (
        <p className="auth-page__footer">
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/registro" className="auth-page__cta">
            Creá una acá
          </Link>
        </p>
      )}
    </div>
  )
}
