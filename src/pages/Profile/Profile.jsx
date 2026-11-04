import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import Skeleton from '../../components/Skeleton/Skeleton.jsx'
import { DIET_OPTIONS, INTOLERANCE_OPTIONS } from '../../config/filters.js'
import { useAuth } from '../../hooks/useAuth.js'
import { usePreferences } from '../../hooks/usePreferences.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { savePreferences } from '../../services/profile.js'
import {
  clearSearchHistory,
  subscribeSearchHistory,
} from '../../services/searchHistory.js'
import './Profile.css'

function formatDate(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return ''
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Profile() {
  usePageTitle('Mi perfil')
  const { user, logout } = useAuth()
  const { preferences } = usePreferences()
  const navigate = useNavigate()

  // --- Preferencias ---
  // `draft` queda en null mientras el usuario no edite nada: así el
  // formulario refleja lo guardado en vivo, sin sincronizarlo en efectos.
  const [draft, setDraft] = useState(null)
  const form = draft ?? preferences
  const setForm = (updater) =>
    setDraft((current) => {
      const base = current ?? preferences
      return typeof updater === 'function' ? updater(base) : { ...base, ...updater }
    })
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState(null)
  const [saveError, setSaveError] = useState(null)

  // --- Historial ---
  // El uid viaja junto a los datos para derivar el estado sin resetearlo
  // en un efecto cuando no hay sesión.
  const [historyState, setHistoryState] = useState({
    uid: null,
    entries: [],
    error: null,
  })
  const [confirmClear, setConfirmClear] = useState(false)

  const historyActive = Boolean(user) && historyState.uid === user.uid
  const history = historyActive ? historyState.entries : []
  const historyLoading = user ? !historyActive : false
  const historyError = historyActive ? historyState.error : null

  useEffect(() => {
    if (!user) return undefined

    const uid = user.uid
    const unsubscribe = subscribeSearchHistory(
      uid,
      (entries) => setHistoryState({ uid, entries, error: null }),
      (error) => setHistoryState((current) => ({ ...current, uid, error })),
    )
    return unsubscribe
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/ingresar', { replace: true })
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSavedMessage(null)
    setSaveError(null)

    try {
      await savePreferences(user.uid, form)
      setSavedMessage('Preferencias guardadas correctamente.')
      setTimeout(() => setSavedMessage(null), 4000)
    } catch {
      setSaveError(
        'No se pudieron guardar las preferencias. Revisá tu conexión e intentá de nuevo.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleClearHistory = async () => {
    if (!user?.uid) {
      setHistoryState((current) => ({
        ...current,
        error: new Error('Sesión requerida'),
      }))
      return
    }

    try {
      await clearSearchHistory(user.uid)
      // Resetear inmediatamente para que la UI refleje el borrado sin esperar
      // al listener de Firestore.
      setHistoryState({ uid: user.uid, entries: [], error: null })
      setConfirmClear(false)
    } catch {
      setHistoryState((current) => ({
        ...current,
        error: new Error('No se pudo borrar el historial. Intentá de nuevo.'),
      }))
    }
  }

  const handleRepeat = (entry) => {
    if (
      entry.type === 'ingredientes' &&
      Array.isArray(entry.params?.ingredients) &&
      entry.params.ingredients.length > 0
    ) {
      navigate(
        `/buscar?modo=ingredientes&ing=${encodeURIComponent(
          entry.params.ingredients.join(','),
        )}`,
      )
      return
    }
    if (entry.term) {
      navigate(`/buscar?modo=avanzada&q=${encodeURIComponent(entry.term)}`)
      return
    }
    navigate('/buscar')
  }

  const toggleListValue = (list, value) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value]

  const initial = (user?.displayName || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <div className="profile">
      <header className="page-header">
        <h1 className="page-title">Mi perfil</h1>
        <p className="page-subtitle">
          Tu cuenta, tus preferencias y tu historial de búsquedas.
        </p>
      </header>

      {/* ---------- Cuenta ---------- */}
      <section className="card card-pad profile__account">
        <span className="profile__avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="profile__account-info">
          <h2 className="section-title">
            {user?.displayName || 'Tu cuenta'}
          </h2>
          <p className="profile__email">{user?.email}</p>
        </div>
        <button type="button" className="btn btn-danger" onClick={handleLogout}>
          <Icon name="logout" size={16} />
          Cerrar sesión
        </button>
      </section>

      {/* ---------- Preferencias ---------- */}
      {form && (
        <form className="card card-pad profile__preferences" onSubmit={handleSave}>
          <div className="profile__section-head">
            <h2 className="section-title">Preferencias alimentarias</h2>
            <p className="profile__section-hint">
              Se aplican automáticamente al buscar; siempre podés modificarlas
              para una búsqueda puntual.
            </p>
          </div>

          {savedMessage && (
            <div className="alert alert-info" role="status">
              <Icon name="checkCircle" size={18} />
              <p>{savedMessage}</p>
            </div>
          )}
          {saveError && (
            <ErrorMessage title="No se pudieron guardar" message={saveError} />
          )}

          <fieldset className="profile__fieldset">
            <legend className="label">Tipo de alimentación</legend>
            <div className="profile__chips">
              {DIET_OPTIONS.map((option) => {
                const active = form.diets.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className={`filter-chip${active ? ' filter-chip--active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          diets: toggleListValue(current.diets, option.value),
                        }))
                      }
                    />
                    {option.label}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="profile__fieldset">
            <legend className="label">Intolerancias y alergias</legend>
            <div className="profile__chips">
              {INTOLERANCE_OPTIONS.map((option) => {
                const active = form.intolerances.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className={`filter-chip${active ? ' filter-chip--active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          intolerances: toggleListValue(
                            current.intolerances,
                            option.value,
                          ),
                        }))
                      }
                    />
                    {option.label}
                  </label>
                )
              })}
            </div>

            {form.intolerances.length > 0 && (
              <div className="alert alert-warning" role="note">
                <Icon name="alert" size={18} />
                <div>
                  <p className="alert-title">Advertencia</p>
                  <p>
                    Estos filtros se basan en los datos de Spoonacular. No son
                    una garantía médica ni reemplazan la verificación de
                    ingredientes ni la lectura de etiquetas.
                  </p>
                </div>
              </div>
            )}
          </fieldset>

          <fieldset className="profile__fieldset">
            <legend className="label">Preferencias nutricionales</legend>
            <div className="profile__nutrition">
              <label className="field">
                <span className="label">Proteínas mínimas (g por porción)</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Sin mínimo"
                  value={form.nutrition.minProtein ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nutrition: {
                        ...current.nutrition,
                        minProtein: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="label">Calorías máximas (kcal por porción)</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Sin máximo"
                  value={form.nutrition.maxCalories ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nutrition: {
                        ...current.nutrition,
                        maxCalories: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="profile__fieldset">
            <legend className="label">Unidades de medida</legend>
            <div className="profile__radio-group">
              <label className="profile__radio">
                <input
                  type="radio"
                  name="units"
                  checked={form.units === 'metrico'}
                  onChange={() =>
                    setForm((current) => ({ ...current, units: 'metrico' }))
                  }
                />
                Métrico (gramos, mililitros)
              </label>
              <label className="profile__radio">
                <input
                  type="radio"
                  name="units"
                  checked={form.units === 'imperial'}
                  onChange={() =>
                    setForm((current) => ({ ...current, units: 'imperial' }))
                  }
                />
                Imperial (tazas, onzas)
              </label>
            </div>
          </fieldset>

          <label className="profile__toggle">
            <input
              type="checkbox"
              checked={form.applyToSearch}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  applyToSearch: event.target.checked,
                }))
              }
            />
            <span>
              Aplicar mis preferencias automáticamente al buscar
              <small>
                Si está desactivado, los filtros se cargan vacíos y los
                configurás en cada búsqueda.
              </small>
            </span>
          </label>

          <div className="profile__save-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar preferencias'}
            </button>
          </div>
        </form>
      )}

      {/* ---------- Historial ---------- */}
      <section className="card card-pad profile__history">
        <div className="profile__section-head profile__section-head--row">
          <div>
            <h2 className="section-title">Historial de búsquedas</h2>
            <p className="profile__section-hint">
              Tus últimas 20 búsquedas. Se guardan solo en tu cuenta.
            </p>
          </div>

          {history.length > 0 &&
            (confirmClear ? (
              <div className="profile__confirm">
                <span>¿Borrar todo?</span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleClearHistory}
                >
                  Sí, borrar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmClear(true)}
              >
                <Icon name="trash" size={15} />
                Borrar historial
              </button>
            ))}
        </div>

        {historyError && (
          <ErrorMessage
            title="No pudimos cargar el historial"
            message="Revisá tu conexión e intentá de nuevo."
          />
        )}

        {historyLoading ? (
          <div className="profile__history-loading" aria-hidden="true">
            <Skeleton height={54} radius="var(--radius)" />
            <Skeleton height={54} radius="var(--radius)" />
            <Skeleton height={54} radius="var(--radius)" />
          </div>
        ) : !historyError && history.length === 0 ? (
          <p className="profile__history-empty">
            Todavía no hay búsquedas guardadas. Cuando busques recetas, van a
            aparecer acá.
          </p>
        ) : (
          <ul className="profile__history-list">
            {history.map((entry) => (
              <li key={entry.id} className="profile__history-item">
                <span
                  className={`profile__history-icon profile__history-icon--${entry.type}`}
                  aria-hidden="true"
                >
                  <Icon name={entry.type === 'avanzada' ? 'search' : 'leaf'} size={16} />
                </span>

                <div className="profile__history-info">
                  <span className="profile__history-term">
                    {entry.term || 'Búsqueda con filtros'}
                  </span>
                  <span className="profile__history-meta">
                    {formatDate(entry.createdAt)}
                    {entry.summary ? ` · ${entry.summary}` : ''}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRepeat(entry)}
                >
                  Repetir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Privacidad ---------- */}
      <p className="profile__privacy">
        <Icon name="shield" size={15} />
        Tus datos (despensa, favoritos, preferencias e historial) son privados:
        solo tu cuenta puede verlos. Verificable en las reglas de Firestore del
        proyecto.
      </p>
    </div>
  )
}
