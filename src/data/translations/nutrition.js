/**
 * Diccionario de nutrientes: inglés → español.
 * Complementa lo ya definido en src/utils/nutritionHelpers.js.
 * Se conservan los valores numéricos y las unidades originales.
 */

export const NUTRIENTS = {
  Calories: 'Calorías',
  Protein: 'Proteínas',
  Fat: 'Grasas',
  Carbohydrates: 'Carbohidratos',
  Fiber: 'Fibra',
  Sugar: 'Azúcares',
  'Saturated Fat': 'Grasas saturadas',
  'Trans Fat': 'Grasas trans',
  'Mono Unsaturated Fat': 'Grasas monoinsaturadas',
  'Poly Unsaturated Fat': 'Grasas poliinsaturadas',
  Cholesterol: 'Colesterol',
  Sodium: 'Sodio',
  Potassium: 'Potasio',
  Calcium: 'Calcio',
  Iron: 'Hierro',
  'Vitamin A': 'Vitamina A',
  'Vitamin C': 'Vitamina C',
  'Vitamin D': 'Vitamina D',
  'Vitamin B1': 'Vitamina B1',
  'Vitamin B2': 'Vitamina B2',
  'Vitamin B3': 'Vitamina B3',
  'Vitamin B6': 'Vitamina B6',
  'Vitamin B12': 'Vitamina B12',
  'Vitamin E': 'Vitamina E',
  'Vitamin K': 'Vitamina K',
  Folate: 'Folato',
  Magnesium: 'Magnesio',
  Zinc: 'Zinc',
}

export function translateNutrient(name) {
  if (!name || typeof name !== 'string') return name
  return NUTRIENTS[name] || name
}
