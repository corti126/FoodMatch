import RecipeCard from '../RecipeCard/RecipeCard.jsx'
import Skeleton from '../Skeleton/Skeleton.jsx'
import './RecipeGrid.css'

function CardSkeleton() {
  return (
    <div className="recipe-card recipe-card--skeleton" aria-hidden="true">
      <Skeleton height={0} className="recipe-card__skeleton-media" />
      <div className="recipe-card__skeleton-body">
        <Skeleton width="85%" height={18} />
        <Skeleton width="60%" height={14} />
        <Skeleton width="100%" height={34} />
      </div>
    </div>
  )
}

/**
 * Grilla responsiva de recetas con estado de carga (skeletons).
 * Si no hay resultados, se muestra `emptyState` (lo define la página).
 */
export default function RecipeGrid({ recipes = [], loading = false, emptyState = null }) {
  if (loading) {
    return (
      <div className="recipe-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (recipes.length === 0) return emptyState

  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
