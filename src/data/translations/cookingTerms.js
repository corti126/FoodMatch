/**
 * Diccionario de términos culinarios: inglés → español (rioplatense/argentino).
 * Se usa para traducir modificadores dentro de nombres de ingredientes
 * y descripciones cortas. No se aplica de forma indiscriminada a oraciones
 * completas; se usa como respaldo cuando el diccionario de ingredientes
 * no tiene la entrada completa.
 */

export const COOKING_TERMS = {
  // Estado y presentación
  'all-purpose': 'de uso general',
  boneless: 'sin hueso',
  skinless: 'sin piel',
  ground: 'molido',
  chopped: 'picado',
  diced: 'en cubos',
  sliced: 'en rodajas',
  minced: 'picado fino',
  grated: 'rallado',
  shredded: 'desmenuzado',
  crumbled: 'desmenuzado',
  fresh: 'fresco',
  dried: 'seco',
  frozen: 'congelado',
  canned: 'enlatado',
  cooked: 'cocido',
  raw: 'crudo',
  boiled: 'hervido',
  roasted: 'asado',
  grilled: 'a la parrilla',
  baked: 'horneado',
  fried: 'frito',
  'sautéed': 'salteado',
  steamed: 'al vapor',
  braised: 'estofado',
  stewed: 'guisado',
  simmered: 'a fuego lento',
  poached: 'escalfado',
  blanched: 'escaldado',
  toasted: 'tostado',
  whole: 'entero',
  halved: 'partido por la mitad',
  quartered: 'en cuartos',
  'finely chopped': 'finamente picado',
  'roughly chopped': 'gruesamente picado',

  // Calidades y variantes
  'low-fat': 'bajo en grasa',
  'non-fat': 'sin grasa',
  'fat-free': 'sin grasa',
  'sugar-free': 'sin azúcar',
  'gluten-free': 'sin gluten',
  'dairy-free': 'sin lácteos',
  unsalted: 'sin sal',
  salted: 'con sal',
  sweetened: 'endulzado',
  unsweetened: 'sin endulzar',
  organic: 'orgánico',
  natural: 'natural',
  artificial: 'artificial',
  imitation: 'imitación',

  // Sabor y condimentos
  flavor: 'sabor',
  flavored: 'con sabor',
  seasoned: 'sazonado',
  spiced: 'especiado',
  herb: 'hierba',
  herbs: 'hierbas',
  spice: 'especia',
  spices: 'especias',
  condiment: 'condimento',
}

export function translateCookingTerm(term) {
  if (!term || typeof term !== 'string') return term
  const key = term.toLowerCase().trim().replace(/\s+/g, ' ')
  return COOKING_TERMS[key] || term
}
