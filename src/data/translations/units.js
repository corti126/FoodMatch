/**
 * Diccionario de unidades de medida: inglés → español (rioplatense/argentino).
 * Se traduce solo la unidad, nunca la cantidad numérica que la acompaña.
 */

export const UNITS = {
  // Volumen (cocina)
  cup: 'taza',
  cups: 'tazas',
  tablespoon: 'cucharada',
  tablespoons: 'cucharadas',
  teaspoon: 'cucharadita',
  teaspoons: 'cucharaditas',
  // Volumen (métrico)
  milliliter: 'mililitro',
  milliliters: 'mililitros',
  ml: 'ml',
  liter: 'litro',
  liters: 'litros',
  l: 'l',
  // Peso/masa
  ounce: 'onza',
  ounces: 'onzas',
  oz: 'oz',
  pound: 'libra',
  pounds: 'libras',
  lb: 'lb',
  lbs: 'libras',
  gram: 'gramo',
  grams: 'gramos',
  g: 'g',
  kilogram: 'kilogramo',
  kilograms: 'kilogramos',
  kg: 'kg',
  // Unidades discretas
  piece: 'trozos',
  pieces: 'trozos',
  slice: 'rebanada',
  slices: 'rebanadas',
  clove: 'diente',
  cloves: 'dientes',
  pinch: 'pizca',
  pinches: 'pizcas',
  dash: 'chorrito',
  dashes: 'chorritos',
  can: 'lata',
  cans: 'latas',
  bottle: 'botella',
  bottles: 'botellas',
  jar: 'frasco',
  jars: 'frascos',
  package: 'paquete',
  packages: 'paquetes',
  bag: 'bolsa',
  bags: 'bolsas',
  // Sin unidad
  'to taste': 'al gusto',
}

export function translateUnit(unit) {
  if (!unit || typeof unit !== 'string') return unit
  const key = unit.toLowerCase().trim().replace(/\s+/g, ' ')
  return UNITS[key] || unit
}
