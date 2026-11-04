import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { translateAuthError } from '../../services/auth.js'
import { hasErrors, validateRegister } from '../../utils/validators.js'
import './Register.css'

export default function Register() {
  usePageTitle('Crear cuenta')
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

    const validation = validateRegister(form)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSubmitting(true)
    try {
      await register(form.email, form.password, form.name)
      // Con la sesión creada, GuestRoutes redirige al inicio.
    } catch (error) {
      setFormError(translateAuthError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Crear tu cuenta</h1>
      <p className="auth-page__subtitle">
        Guardá tu despensa, favoritos y preferencias sincronizados en todos tus
        dispositivos.
      </p>

      {formError && <ErrorMessage title="No pudimos crear la cuenta" message={formError} />}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="label">Nombre (opcional)</span>
          <div className="auth-form__control">
            <Icon name="user" size={17} className="auth-form__icon" />
            <input
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Cómo querés que te llamemos"
              value={form.name}
              onChange={(event) => updateField({ name: event.target.value })}
            />
          </div>
        </label>

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
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
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

        <label className="field">
          <span className="label">Confirmar contraseña</span>
          <div className="auth-form__control">
            <Icon name="lock" size={17} className="auth-form__icon" />
            <input
              className={`input${errors.confirm ? ' has-error' : ''}`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repetí tu contraseña"
              value={form.confirm}
              onChange={(event) => updateField({ confirm: event.target.value })}
            />
          </div>
          {errors.confirm && <span className="field-error">{errors.confirm}</span>}
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth-page__footer">
        ¿Ya tenés cuenta?{' '}
        <Link to="/ingresar" className="auth-page__cta">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
