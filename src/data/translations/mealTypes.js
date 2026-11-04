/**
 * Diccionario de tipos de comida (meal types): inglés → español.
 * Valores verificados contra la documentación de Spoonacular.
 */

export const MEAL_TYPES = {
  breakfast: 'Desayuno',
  'main course': 'Plato principal',
  'side dish': 'Guarnición',
  dessert: 'Postre',
  appetizer: 'Aperitivo',
  salad: 'Ensalada',
  bread: 'Pan',
  soup: 'Sopa',
  snack: 'Merienda / snack',
  beverage: 'Bebida',
  drink: 'Bebida',
  sauce: 'Salsa',
  marinade: 'Marinada',
  fingerfood: 'Picoteo',
}

export function translateMealType(mealType) {
  if (!mealType || typeof mealType !== 'string') return mealType
  const key = mealType.toLowerCase().trim().replace(/\s+/g, ' ')
  return MEAL_TYPES[key] || mealType
}
