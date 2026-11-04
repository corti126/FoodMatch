/**
 * Índice central de diccionarios de traducción.
 * Cada módulo exporta su diccionario y una función de traducción unitaria.
 */

export { INGREDIENTS, translateIngredientName } from './ingredients.js'
export { UNITS, translateUnit } from './units.js'
export { CUISINES, translateCuisine } from './cuisines.js'
export { MEAL_TYPES, translateMealType } from './mealTypes.js'
export { DIETS, translateDiet } from './diets.js'
export { INTOLERANCES, translateIntolerance } from './intolerances.js'
export { CATEGORIES, translateCategory } from './categories.js'
export { NUTRIENTS, translateNutrient } from './nutrition.js'
export { COOKING_TERMS, translateCookingTerm } from './cookingTerms.js'
