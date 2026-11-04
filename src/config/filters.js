// Opciones de filtros de búsqueda.
// Valores verificados en la documentación de Spoonacular
// (guías "Diets", "Intolerances", "Meal Types" y "Cuisines").

export const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetariana' },
  { value: 'vegan', label: 'Vegana' },
  { value: 'pescetarian', label: 'Pescetariana' },
  { value: 'gluten free', label: 'Sin gluten' },
]

export const INTOLERANCE_OPTIONS = [
  { value: 'dairy', label: 'Lácteos' },
  { value: 'egg', label: 'Huevo' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'peanut', label: 'Maní' },
  { value: 'tree nut', label: 'Frutos secos' },
  { value: 'soy', label: 'Soja' },
  { value: 'seafood', label: 'Pescado' },
  { value: 'shellfish', label: 'Mariscos' },
]

export const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'main course', label: 'Plato principal' },
  { value: 'side dish', label: 'Guarnición' },
  { value: 'dessert', label: 'Postre' },
  { value: 'appetizer', label: 'Aperitivo' },
  { value: 'salad', label: 'Ensalada' },
  { value: 'bread', label: 'Pan' },
  { value: 'soup', label: 'Sopa' },
  { value: 'snack', label: 'Snack / merienda' },
  { value: 'beverage', label: 'Bebida' },
  { value: 'drink', label: 'Trago' },
  { value: 'sauce', label: 'Salsa' },
  { value: 'marinade', label: 'Marinada' },
  { value: 'fingerfood', label: 'Picoteo' },
]

// "Argentina" no existe como cuisine en Spoonacular: se ofrece la más
// cercana (Latin American) junto a las principales gastronomías.
export const CUISINE_OPTIONS = [
  { value: 'Italian', label: 'Italiana' },
  { value: 'Mexican', label: 'Mexicana' },
  { value: 'Mediterranean', label: 'Mediterránea' },
  { value: 'American', label: 'Americana' },
  { value: 'Asian', label: 'Asiática' },
  { value: 'Chinese', label: 'China' },
  { value: 'Japanese', label: 'Japonesa' },
  { value: 'Indian', label: 'India' },
  { value: 'Thai', label: 'Tailandesa' },
  { value: 'Spanish', label: 'Española' },
  { value: 'French', label: 'Francesa' },
  { value: 'Greek', label: 'Griega' },
  { value: 'Latin American', label: 'Latinoamericana (la más cercana a lo argentino)' },
]

export const TIME_OPTIONS = [
  { value: '15', label: 'Hasta 15 minutos' },
  { value: '30', label: 'Hasta 30 minutos' },
  { value: '45', label: 'Hasta 45 minutos' },
  { value: '60', label: 'Hasta 1 hora' },
  { value: '90', label: 'Hasta 1 hora y media' },
  { value: '120', label: 'Hasta 2 horas' },
]

export const SERVINGS_OPTIONS = [
  { value: '1-2', label: '1 o 2 porciones' },
  { value: '3-4', label: '3 o 4 porciones' },
  { value: '5+', label: '5 o más porciones' },
]
