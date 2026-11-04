import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RecipeGrid from '../../components/RecipeGrid/RecipeGrid.jsx'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import { useFavorites } from '../../hooks/useFavorites.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import './Favorites.css'

export default function Favorites() {
  usePageTitle('Favoritos')
  const { favorites, loading } = useFavorites()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return favorites
    return favorites.filter((item) =>
      String(item.title || '').toLowerCase().includes(term),
    )
  }, [favorites, search])

  const renderEmpty = () => {
    if (loading) return null

    if (search.trim()) {
      return (
        <EmptyState
          icon="search"
          title="Sin coincidencias"
          description={`No encontramos favoritos que coincidan con “${search}”.`}
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
      )
    }

    return (
      <EmptyState
        icon="heart"
        title="Todavía no guardaste recetas"
        description="Cuando encuentres algo rico, tocá el corazón para guardarlo acá y encontrarlo rápido."
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/buscar')}
          >
            Buscar recetas
          </button>
        }
      />
    )
  }

  return (
    <div className="favorites">
      <header className="page-header">
        <h1 className="page-title">Mis favoritas</h1>
        <p className="page-subtitle">
          Las recetas que guardaste, para volver a cocinarlas cuando quieras.
        </p>
      </header>

      {!loading && favorites.length > 0 && (
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar entre mis favoritas…"
          label="Buscar entre mis favoritas"
        />
      )}

      <RecipeGrid
        recipes={filtered}
        loading={loading}
        emptyState={renderEmpty()}
      />
    </div>
  )
}
