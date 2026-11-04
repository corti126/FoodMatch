import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import IngredientChip from '../IngredientChip/IngredientChip.jsx'
import { normalizeIngredientName } from '../../utils/ingredientHelpers.js'
import { autocompleteIngredients, hasApiKey } from '../../services/spoonacular.js'
import { translateIngredientName } from '../../services/translation.js'
import './IngredientInput.css'

const DEBOUNCE_MS = 350

/**
 * Campo para agregar ingredientes: escritura libre, sugerencias con
 * autocompletado (debounce) y chips eliminables.
 *
 * `ingredients` es un array de strings (nombres normalizados en español).
 */
export default function IngredientInput({
  ingredients = [],
  onChange,
  placeholder = 'Ej.: papa, tomate, huevo…',
  label = 'Agregá ingredientes',
  autoFocus = false,
  id = 'ingredient-input',
}) {
  const [query, setQuery] = useState('')
  // La respuesta se guarda asociada a la consulta que la produjo: los
  // valores visibles se derivan de ahí, sin setState sincrónico en efectos.
  const [suggestionState, setSuggestionState] = useState({ query: '', items: [] })
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)

  const wrapRef = useRef(null)
  const debounceRef = useRef(null)
  const requestRef = useRef(0)
  const answeredRef = useRef('')

  const trimmed = query.trim()
  const suggestions =
    suggestionState.query === trimmed ? suggestionState.items : []
  const loadingSuggestions =
    hasApiKey() && trimmed.length >= 2 && suggestionState.query !== trimmed

  // Autocompletado con debounce: nunca se consulta por cada tecla.
  useEffect(() => {
    const value = query.trim()
    if (value.length < 2 || !hasApiKey()) return undefined
    if (answeredRef.current === value) return undefined // ya respondida

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestRef.current
      try {
        const items = await autocompleteIngredients(value, 6)
        if (requestId !== requestRef.current) return // respuesta vieja: se ignora
        answeredRef.current = value
        setSuggestionState({ query: value, items })
        setHighlight(-1)
      } catch {
        if (requestId === requestRef.current) {
          setSuggestionState({ query: value, items: [] })
        }
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Cierra las sugerencias al hacer clic fuera del campo.
  useEffect(() => {
    const handleOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const addIngredient = (raw) => {
    const name = normalizeIngredientName(raw)
    if (!name) return

    const exists = ingredients.some(
      (item) => normalizeIngredientName(item) === name,
    )
    if (!exists) onChange([...ingredients, name])

    setQuery('')
    setSuggestionState({ query: '', items: [] })
    answeredRef.current = ''
    setOpen(false)
    setHighlight(-1)
  }

  const removeIngredient = (name) => {
    onChange(ingredients.filter((item) => item !== name))
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (highlight >= 0 && suggestions[highlight]) {
        addIngredient(translateIngredientName(suggestions[highlight].name))
      } else {
        addIngredient(query)
      }
      return
    }
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault()
      setOpen(true)
      setHighlight((prev) => (prev + 1) % suggestions.length)
      return
    }
    if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault()
      setHighlight((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setHighlight(-1)
    }
  }

  const showSuggestions = open && (suggestions.length > 0 || loadingSuggestions)

  return (
    <div className="ingredient-input" ref={wrapRef}>
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <div className="ingredient-input__field">
        <Icon name="search" size={17} className="ingredient-input__icon" />
        <input
          id={id}
          className="input ingredient-input__control"
          type="text"
          value={query}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={`${id}-suggestions`}
          aria-autocomplete="list"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
        />
        {query && (
          <button
            type="button"
            className="ingredient-input__clear"
            onClick={() => {
              setQuery('')
              setSuggestionState({ query: '', items: [] })
              answeredRef.current = ''
              setOpen(false)
            }}
            aria-label="Limpiar texto"
          >
            <Icon name="x" size={15} />
          </button>
        )}
      </div>

      {showSuggestions && (
        <ul className="ingredient-input__suggestions" id={`${id}-suggestions`} role="listbox">
          {loadingSuggestions && suggestions.length === 0 && (
            <li className="ingredient-input__suggestion ingredient-input__suggestion--muted">
              Buscando sugerencias…
            </li>
          )}
          {suggestions.map((item, index) => (
            <li key={item.name}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={
                  index === highlight
                    ? 'ingredient-input__suggestion ingredient-input__suggestion--active'
                    : 'ingredient-input__suggestion'
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addIngredient(translateIngredientName(item.name))}
              >
                <Icon name="plus" size={15} />
                <span>{translateIngredientName(item.name)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {ingredients.length > 0 && (
        <div className="ingredient-input__chips">
          {ingredients.map((name) => (
            <IngredientChip
              key={name}
              name={name}
              onRemove={() => removeIngredient(name)}
            />
          ))}
          <button
            type="button"
            className="ingredient-input__clear-all"
            onClick={() => onChange([])}
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  )
}
