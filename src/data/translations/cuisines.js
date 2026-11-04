/**
 * Diccionario de cocinas/gastronomías: inglés → español (rioplatense/argentino).
 * Valores verificados contra la documentación de Spoonacular.
 */

export const CUISINES = {
  italian: 'Italiana',
  mexican: 'Mexicana',
  mediterranean: 'Mediterránea',
  american: 'Americana',
  asian: 'Asiática',
  chinese: 'China',
  japanese: 'Japonesa',
  indian: 'India',
  thai: 'Tailandesa',
  spanish: 'Española',
  french: 'Francesa',
  greek: 'Griega',
  'latin american': 'Latinoamericana',
  british: 'Británica',
  german: 'Alemana',
  'middle eastern': 'Medio Oriente',
  caribbean: 'Caribe',
  cajun: 'Cajún',
  southern: 'Sureña',
  'eastern european': 'Europa del Este',
  nordic: 'Nórdica',
  vietnamese: 'Vietnamita',
  korean: 'Coreana',
  jewish: 'Judía',
  african: 'Africana',
}

export function translateCuisine(cuisine) {
  if (!cuisine || typeof cuisine !== 'string') return cuisine
  const key = cuisine.toLowerCase().trim().replace(/\s+/g, ' ')
  return CUISINES[key] || cuisine
}
