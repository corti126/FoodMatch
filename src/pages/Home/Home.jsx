import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon/Icon.jsx'
import IngredientInput from '../../components/IngredientInput/IngredientInput.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { usePantry } from '../../hooks/usePantry.js'
import { useFavorites } from '../../hooks/useFavorites.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { APP_TAGLINE } from '../../config/app.js'
import './Home.css'

function greetingByHour() {
  const hour = new Date().getHours()
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function Home() {
  usePageTitle('Inicio')
  const { user } = useAuth()
  const { items: pantryItems, loading: pantryLoading } = usePantry()
  const { favorites } = useFavorites()
  const navigate = useNavigate()

  const [ingredients, setIngredients] = useState([])

  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || ''
  const hasIngredients = ingredients.length > 0

  const handleSearch = () => {
    if (!hasIngredients) return
    const query = new URLSearchParams({
      modo: 'ingredientes',
      ing: ingredients.join(','),
    })
    navigate(`/buscar?${query.toString()}`)
  }

  return (
    <div className="home">
      <section className="home__hero">
        <p className="home__greeting">
          {greetingByHour()}{name ? `, ${name}` : ''}
        </p>
        <h1 className="home__title">¿Qué podés cocinar hoy?</h1>
        <p className="home__subtitle">{APP_TAGLINE}</p>

        <div className="home__search card card-pad">
          <IngredientInput
            id="home-ingredients"
            label="¿Qué ingredientes tenés?"
            placeholder="Ej.: papa, palta, huevo… (separados por coma)"
            ingredients={ingredients}
            onChange={setIngredients}
          />
          <div className="home__search-actions">
            <p className="home__search-hint">
              {hasIngredients
                ? `${ingredients.length} ingrediente${ingredients.length > 1 ? 's' : ''} seleccionado${ingredients.length > 1 ? 's' : ''}.`
                : 'Agregá al menos un ingrediente para buscar recetas.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={!hasIngredients}
            >
              Buscar recetas
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="home__shortcuts" aria-label="Accesos rápidos">
        <Link to="/buscar" className="home__shortcut">
          <span className="home__shortcut-icon" aria-hidden="true">
            <Icon name="search" size={22} />
          </span>
          <div>
            <h2 className="home__shortcut-title">Quiero comer algo específico</h2>
            <p className="home__shortcut-text">
              Buscá por nombre y aplicá filtros avanzados.
            </p>
          </div>
          <Icon name="chevronRight" size={18} className="home__shortcut-arrow" />
        </Link>

        <Link to="/despensa" className="home__shortcut">
          <span className="home__shortcut-icon" aria-hidden="true">
            <Icon name="jar" size={22} />
          </span>
          <div>
            <h2 className="home__shortcut-title">Mi despensa</h2>
            <p className="home__shortcut-text">
              {pantryLoading
                ? 'Cargando ingredientes…'
                : pantryItems.length > 0
                  ? `${pantryItems.length} ingrediente${pantryItems.length > 1 ? 's' : ''} guardado${pantryItems.length > 1 ? 's' : ''}.`
                  : 'Todavía no cargaste ingredientes.'}
            </p>
          </div>
          <Icon name="chevronRight" size={18} className="home__shortcut-arrow" />
        </Link>

        <Link to="/favoritos" className="home__shortcut">
          <span className="home__shortcut-icon" aria-hidden="true">
            <Icon name="heart" size={22} />
          </span>
          <div>
            <h2 className="home__shortcut-title">Mis favoritas</h2>
            <p className="home__shortcut-text">
              {favorites.length > 0
                ? `${favorites.length} receta${favorites.length > 1 ? 's' : ''} guardada${favorites.length > 1 ? 's' : ''}.`
                : 'Guardá recetas para encontrarlas rápido.'}
            </p>
          </div>
          <Icon name="chevronRight" size={18} className="home__shortcut-arrow" />
        </Link>
      </section>

      {!pantryLoading && pantryItems.length === 0 && (
        <EmptyState
          icon="jar"
          title="Empezá por tu despensa"
          description="Cargá los ingredientes que tenés en casa y descubrí qué recetas podés preparar con ellos."
          action={
            <Link to="/despensa" className="btn btn-secondary btn-sm">
              Cargar mi despensa
            </Link>
          }
        />
      )}
    </div>
  )
}
