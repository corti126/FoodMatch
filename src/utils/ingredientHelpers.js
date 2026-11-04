/**
 * Normalización de ingredientes en español (uso argentino) y equivalencias
 * hacia los nombres en inglés que reconoce Spoonacular.
 *
 * No se traduce de forma automática cualquier palabra: solo se mapean
 * equivalencias conocidas. Si no hay equivalencia, se envía el nombre
 * tal como lo escribió el usuario.
 */

const stripAccents = (text) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Construye un diccionario con claves sin acentos ni mayúsculas. */
function buildMap(entries) {
  const map = new Map()
  for (const [key, value] of Object.entries(entries)) {
    map.set(stripAccents(key.toLowerCase()), value)
  }
  return map
}

// Variantes regionales → nombre canónico en español (para mostrar y deduplicar).
const REGIONAL_SYNONYMS = buildMap({
  patata: 'papa',
  patatas: 'papa',
  papas: 'papa',
  aguacate: 'palta',
  aguacates: 'palta',
  fresa: 'frutilla',
  fresas: 'frutilla',
  pimiento: 'morrón',
  pimientos: 'morrón',
  'pimiento rojo': 'morrón',
  'pimientos rojos': 'morrón',
  'calabacín': 'zapallito',
  'calabacines': 'zapallito',
  maíz: 'choclo',
  choclos: 'choclo',
  alubias: 'poroto',
  frijoles: 'poroto',
  porotos: 'poroto',
  tomates: 'tomate',
  cebollas: 'cebolla',
  huevos: 'huevo',
  limones: 'limón',
  naranjas: 'naranja',
  manzanas: 'manzana',
  zanahorias: 'zanahoria',
  lechugas: 'lechuga',
  espinacas: 'espinaca',
  acelgas: 'acelga',
  berenjenas: 'berenjena',
  zapallitos: 'zapallito',
  calabazas: 'calabaza',
  champiñones: 'champiñón',
  hongos: 'champiñón',
  guisos: 'guiso',
  'carne molida': 'carne picada',
  'carne picada': 'carne picada',
})

// Nombre canónico en español → término que espera la API de Spoonacular.
const ES_TO_API = buildMap({
  // Verduras y frutas
  papa: 'potato',
  batata: 'sweet potato',
  tomate: 'tomato',
  cebolla: 'onion',
  'cebolla de verdeo': 'green onion',
  verdeo: 'green onion',
  ajo: 'garlic',
  morrón: 'bell pepper',
  zanahoria: 'carrot',
  lechuga: 'lettuce',
  palta: 'avocado',
  limón: 'lemon',
  lima: 'lime',
  naranja: 'orange',
  manzana: 'apple',
  banana: 'banana',
  pera: 'pear',
  uva: 'grape',
  frutilla: 'strawberry',
  melón: 'melon',
  sandía: 'watermelon',
  calabaza: 'pumpkin',
  zapallito: 'zucchini',
  berenjena: 'eggplant',
  pepino: 'cucumber',
  acelga: 'chard',
  espinaca: 'spinach',
  repollo: 'cabbage',
  brócoli: 'broccoli',
  coliflor: 'cauliflower',
  rabanito: 'radish',
  champiñón: 'mushroom',
  choclo: 'corn',
  perejil: 'parsley',
  albahaca: 'basil',
  orégano: 'oregano',
  romero: 'rosemary',
  tomillo: 'thyme',
  laurel: 'bay leaf',
  comino: 'cumin',
  pimentón: 'paprika',
  'ají molido': 'chili powder',
  ají: 'chili pepper',
  'nuez moscada': 'nutmeg',
  pimienta: 'black pepper',
  sal: 'salt',

  // Carnes y pescados
  carne: 'beef',
  ternera: 'beef',
  bife: 'steak',
  'carne picada': 'ground beef',
  pollo: 'chicken',
  'pechuga de pollo': 'chicken breast',
  'muslo de pollo': 'chicken thigh',
  cerdo: 'pork',
  cordero: 'lamb',
  chorizo: 'sausage',
  jamón: 'ham',
  pescado: 'fish',
  salmón: 'salmon',
  atún: 'tuna',
  camarón: 'shrimp',
  langostino: 'shrimp',
  merluza: 'fish',

  // Lácteos y huevos
  leche: 'milk',
  queso: 'cheese',
  manteca: 'butter',
  crema: 'cream',
  yogur: 'yogurt',
  huevo: 'egg',

  // Cereales, legumbres y almacén
  harina: 'flour',
  azúcar: 'sugar',
  arroz: 'rice',
  fideos: 'pasta',
  pasta: 'pasta',
  pan: 'bread',
  avena: 'oats',
  levadura: 'yeast',
  bicarbonato: 'baking soda',
  maicena: 'cornstarch',
  polenta: 'polenta',
  poroto: 'beans',
  lenteja: 'lentil',
  garbanzo: 'chickpea',
  chocolate: 'chocolate',
  cacao: 'cocoa powder',
  miel: 'honey',
  aceite: 'oil',
  'aceite de oliva': 'olive oil',
  agua: 'water',
  caldo: 'broth',
  'caldo de verduras': 'vegetable broth',
  nuez: 'walnut',
  almendra: 'almond',
  avellana: 'hazelnut',
  maní: 'peanut',
})

/**
 * Normaliza un ingrediente escrito por el usuario:
 * minúsculas, espacios simples, sin duplicar por variantes regionales.
 * @returns {string} nombre canónico en español
 */
export function normalizeIngredientName(raw) {
  if (typeof raw !== 'string') return ''
  const cleaned = raw.toLowerCase().trim().replace(/\s+/g, ' ')
  if (!cleaned) return ''
  const key = stripAccents(cleaned)
  return REGIONAL_SYNONYMS.get(key) || cleaned
}

/**
 * Traduce un ingrediente canónico en español al término que espera
 * Spoonacular. Si no hay equivalencia conocida, devuelve el mismo texto.
 */
export function toApiIngredient(name) {
  const canonical = normalizeIngredientName(name)
  if (!canonical) return ''
  return ES_TO_API.get(stripAccents(canonical)) || canonical
}

/** Quita duplicados respetando la normalización. */
export function dedupeIngredients(list) {
  const seen = new Set()
  const result = []
  for (const item of Array.isArray(list) ? list : []) {
    const canonical = normalizeIngredientName(item)
    if (!canonical || seen.has(canonical)) continue
    seen.add(canonical)
    result.push(canonical)
  }
  return result
}
