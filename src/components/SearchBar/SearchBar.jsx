import Icon from '../Icon/Icon.jsx'
import './SearchBar.css'

/**
 * Barra de búsqueda de texto. No dispara la búsqueda por tecla:
 * el envío lo controla la página mediante `onSubmit` (Enter o botón).
 */
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar…',
  label = 'Buscar',
  autoFocus = false,
}) {
  return (
    <form
      className="search-bar"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      <Icon name="search" size={18} className="search-bar__icon" />
      <input
        className="search-bar__input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
        >
          <Icon name="x" size={15} />
        </button>
      ) : (
        <kbd className="search-bar__kbd" aria-hidden="true">
          Enter
        </kbd>
      )}
    </form>
  )
}
