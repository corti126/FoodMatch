/**
 * Diccionario de intolerancias y alergias: inglés → español.
 * Valores verificados contra la documentación de Spoonacular.
 */

export const INTOLERANCES = {
  dairy: 'Lácteos',
  egg: 'Huevo',
  gluten: 'Gluten',
  peanut: 'Maní',
  'tree nut': 'Frutos secos',
  soy: 'Soja',
  seafood: 'Pescado y mariscos',
  shellfish: 'Mariscos',
  wheat: 'Trigo',
  grain: 'Granos',
  sulfite: 'Sulfitos',
  sesame: 'Sésamo',
  fish: 'Pescado',
}

export function translateIntolerance(intolerance) {
  if (!intolerance || typeof intolerance !== 'string') return intolerance
  const key = intolerance.toLowerCase().trim().replace(/\s+/g, ' ')
  return INTOLERANCES[key] || intolerance
}
