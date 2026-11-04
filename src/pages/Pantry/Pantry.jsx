import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import Skeleton from '../../components/Skeleton/Skeleton.jsx'
import { usePantry } from '../../hooks/usePantry.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { hasErrors, validatePantryItem } from '../../utils/validators.js'
import './Pantry.css'

const CATEGORIES = [
  'Frutas y verduras',
  'Carnes',
  'Lácteos',
  'Huevos',
  'Cereales y harinas',
  'Legumbres',
  'Condimentos',
  'Bebidas',
  'Otros',
]

const UNITS = [
  'unidad',
  'docena',
  'g',
  'kg',
  'ml',
  'l',
  'cucharada',
  'taza',
  'paquete',
  'bandeja',
  'otro',
]

const EMPTY_FORM = {
  name: '',
  quantity: '',
  unit: 'unidad',
  category: 'Frutas y verduras',
  notes: '',
  expiresAt: '',
}

function formatExpiry(dateString) {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24))

  const label = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  if (diffDays < 0) return { label: `Vencido · ${label}`, tone: 'expired' }
  if (diffDays <= 3) return { label: `Vence pronto · ${label}`, tone: 'soon' }
  return { label: `Vence: ${label}`, tone: 'normal' }
}

export default function Pantry() {
  usePageTitle('Mi despensa')
  const navigate = useNavigate()
  const { items, loading, error, addItem, updateItem, removeItem } = usePantry()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term),
    )
  }, [items, search])

  const grouped = useMemo(() => {
    const groups = new Map()
    for (const item of filtered) {
      const category = CATEGORIES.includes(item.category)
        ? item.category
        : 'Otros'
      if (!groups.has(category)) groups.set(category, [])
      groups.get(category).push(item)
    }
    return CATEGORIES.filter((category) => groups.has(category)).map(
      (category) => [category, groups.get(category)],
    )
  }, [filtered])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setActionError(null)
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name || '',
      quantity: item.quantity ?? '',
      unit: item.unit || 'unidad',
      category: CATEGORIES.includes(item.category) ? item.category : 'Otros',
      notes: item.notes || '',
      expiresAt: item.expiresAt || '',
    })
    setFormErrors({})
    setActionError(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setFormErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setActionError(null)

    const validation = validatePantryItem(form)
    setFormErrors(validation)
    if (hasErrors(validation)) return

    setSaving(true)
    try {
      if (editingId) await updateItem(editingId, form)
      else await addItem(form)
      closeForm()
    } catch {
      setActionError(
        'No se pudo guardar el ingrediente. Verificá tu conexión e intentá de nuevo.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (itemId) => {
    setActionError(null)
    try {
      await removeItem(itemId)
      setPendingDeleteId(null)
    } catch {
      setActionError('No se pudo eliminar el ingrediente. Intentá de nuevo.')
      setPendingDeleteId(null)
    }
  }

  const handleSearchRecipes = () => {
    const names = items.map((item) => item.name).filter(Boolean)
    if (names.length === 0) return
    navigate(
      `/buscar?modo=ingredientes&ing=${encodeURIComponent(names.join(','))}`,
    )
  }

  const updateField = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setFormErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }

  return (
    <div className="pantry">
      <header className="page-header">
        <div className="pantry__header-row">
          <div>
            <h1 className="page-title">Mi despensa</h1>
            <p className="page-subtitle">
              Lo que tenés en casa, organizado y sincronizado en todos tus
              dispositivos.
            </p>
          </div>

          <div className="pantry__header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSearchRecipes}
              disabled={items.length === 0}
            >
              <Icon name="search" size={16} />
              Buscar recetas con esto
            </button>
            <button type="button" className="btn btn-secondary" onClick={openCreate}>
              <Icon name="plus" size={16} />
              Agregar ingrediente
            </button>
          </div>
        </div>
      </header>

      {actionError && (
        <ErrorMessage title="No pudimos completar la operación" message={actionError} />
      )}

      {/* ---------- Formulario ---------- */}
      {formOpen && (
        <form className="pantry-form card card-pad" onSubmit={handleSubmit} noValidate>
          <div className="pantry-form__head">
            <h2 className="section-title">
              {editingId ? 'Editar ingrediente' : 'Nuevo ingrediente'}
            </h2>
            <button
              type="button"
              className="btn-icon"
              onClick={closeForm}
              aria-label="Cerrar formulario"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="pantry-form__grid">
            <label className="field">
              <span className="label">Nombre *</span>
              <input
                className={`input${formErrors.name ? ' has-error' : ''}`}
                type="text"
                placeholder="Ej.: tomate"
                value={form.name}
                onChange={(event) => updateField({ name: event.target.value })}
                autoFocus
              />
              {formErrors.name && (
                <span className="field-error">{formErrors.name}</span>
              )}
            </label>

            <div className="pantry-form__row">
              <label className="field">
                <span className="label">Cantidad (opcional)</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Ej.: 500"
                  value={form.quantity}
                  onChange={(event) => updateField({ quantity: event.target.value })}
                />
              </label>

              <label className="field">
                <span className="label">Unidad</span>
                <select
                  className="select"
                  value={form.unit}
                  onChange={(event) => updateField({ unit: event.target.value })}
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit === 'unidad' ? 'unidades' : unit}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span className="label">Categoría</span>
              <select
                className="select"
                value={form.category}
                onChange={(event) => updateField({ category: event.target.value })}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="label">Fecha de vencimiento (opcional)</span>
              <input
                className="input"
                type="date"
                value={form.expiresAt}
                onChange={(event) => updateField({ expiresAt: event.target.value })}
              />
            </label>

            <label className="field">
              <span className="label">Observaciones (opcional)</span>
              <input
                className="input"
                type="text"
                placeholder="Ej.: abierto, usar esta semana…"
                value={form.notes}
                onChange={(event) => updateField({ notes: event.target.value })}
              />
            </label>
          </div>

          <div className="pantry-form__actions">
            <button type="button" className="btn btn-secondary" onClick={closeForm}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      {/* ---------- Contenido ---------- */}
      {loading ? (
        <div className="pantry__loading" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height={72} radius="var(--radius)" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          title="No pudimos cargar tu despensa"
          message="Revisá tu conexión a internet e intentá de nuevo."
          onRetry={() => window.location.reload()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="jar"
          title="Tu despensa está vacía"
          description="Cargá los ingredientes que tenés en casa para descubrir qué recetas podés preparar hoy."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Icon name="plus" size={15} />
              Agregar mi primer ingrediente
            </button>
          }
        />
      ) : (
        <>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar en mi despensa…"
            label="Buscar en la despensa"
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="Sin coincidencias"
              description={`No hay ingredientes que coincidan con “${search}”.`}
              action={
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearch('')}
                >
                  Limpiar búsqueda
                </button>
              }
            />
          ) : (
            <div className="pantry__groups">
              {grouped.map(([category, categoryItems]) => (
                <section key={category} className="pantry__group">
                  <h2 className="pantry__group-title">
                    {category}
                    <span className="pantry__group-count">{categoryItems.length}</span>
                  </h2>

                  <ul className="pantry__list">
                    {categoryItems.map((item) => {
                      const expiry = formatExpiry(item.expiresAt)
                      const isDeleting = pendingDeleteId === item.id

                      return (
                        <li key={item.id} className="pantry-item">
                          <div className="pantry-item__info">
                            <div className="pantry-item__title-row">
                              <span className="pantry-item__name">{item.name}</span>
                              {item.quantity !== null && item.quantity !== undefined && (
                                <span className="pantry-item__quantity">
                                  {item.quantity} {item.unit}
                                </span>
                              )}
                            </div>

                            <div className="pantry-item__meta">
                              {expiry && (
                                <span
                                  className={`pantry-item__expiry pantry-item__expiry--${expiry.tone}`}
                                >
                                  <Icon name="calendar" size={13} />
                                  {expiry.label}
                                </span>
                              )}
                              {item.notes && (
                                <span className="pantry-item__notes">{item.notes}</span>
                              )}
                            </div>
                          </div>

                          {isDeleting ? (
                            <div className="pantry-item__confirm">
                              <span>¿Eliminar?</span>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(item.id)}
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setPendingDeleteId(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="pantry-item__actions">
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => openEdit(item)}
                                aria-label={`Editar ${item.name}`}
                              >
                                <Icon name="pencil" size={16} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon pantry-item__delete"
                                onClick={() => setPendingDeleteId(item.id)}
                                aria-label={`Eliminar ${item.name}`}
                              >
                                <Icon name="trash" size={16} />
                              </button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
