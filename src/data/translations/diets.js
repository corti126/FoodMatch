/**
 * Diccionario de dietas: inglés → español (rioplatense/argentino).
 * Valores verificados contra la documentación de Spoonacular.
 */

export const DIETS = {
  vegetarian: 'Vegetariana',
  vegan: 'Vegana',
  pescetarian: 'Pescetariana',
  'gluten free': 'Sin gluten',
  'dairy free': 'Sin lácteos',
  ketogenic: 'Cetogénica',
  paleo: 'Paleo',
  primal: 'Primal',
  'whole 30': 'Whole30',
  'lacto vegetarian': 'Vegetariana lacto',
  'ovo vegetarian': 'Vegetariana ovo',
  'low fodmap': 'Bajo en FODMAP',
  'grain free': 'Sin granos',
  'nut free': 'Sin frutos secos',
  'egg free': 'Sin huevo',
  'soy free': 'Sin soja',
  'sugar free': 'Sin azúcar',
  'low sodium': 'Bajo en sodio',
  'low carb': 'Bajo en carbohidratos',
  'high protein': 'Alta en proteínas',
  'whole grain': 'Grano entero',
  kosher: 'Kosher',
  halal: 'Halal',
  organic: 'Orgánico',
}

export function translateDiet(diet) {
  if (!diet || typeof diet !== 'string') return diet
  const key = diet.toLowerCase().trim().replace(/\s+/g, ' ')
  return DIETS[key] || diet
}
