/**
 * Diccionario de categorías y términos varias: inglés → español.
 */

export const CATEGORIES = {
  // Usado para agrupar o etiquetar cuando Spoonacional envía categorías
  'main dish': 'Plato principal',
  'main course': 'Plato principal',
  'side dish': 'Guarnición',
  soup: 'Sopa',
  salad: 'Ensalada',
  dessert: 'Postre',
  breakfast: 'Desayuno',
  snack: 'Merienda',
  beverage: 'Bebida',
  sauce: 'Salsa',
}

export function translateCategory(category) {
  if (!category || typeof category !== 'string') return category
  const key = category.toLowerCase().trim().replace(/\s+/g, ' ')
  return CATEGORIES[key] || category
}
