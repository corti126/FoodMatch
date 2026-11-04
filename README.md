# La Carta de Hoy

App web de recetas: buscá recetas por ingredientes o por filtros, guardá favoritos
y organizá tu despensa. Todo con presupuesto USD 0 (servicios gratuitos).

## Stack

- **React 19 + Vite + JavaScript** (sin TypeScript)
- **Firebase**: Auth (correo/contraseña), Firestore y Hosting (plan Spark gratis)
- **Spoonacular API** para recetas
- **GitHub Actions** para CI (lint + build)
- CSS tradicional por componente, sin frameworks

## Requisitos

- Node.js 20 o superior
- Una cuenta gratuita de [Spoonacular](https://spoonacular.com/food-api)
- Un proyecto de Firebase (ya creado: `foodmatch-6e80a`, sitio `lacartadehoy`)

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

| Variable | Descripción |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Clave web del proyecto Firebase (pública por diseño de Firebase) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de auth de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto (`foodmatch-6e80a`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID de mensajería |
| `VITE_FIREBASE_APP_ID` | ID de la app web |
| `VITE_SPOONACULAR_API_KEY` | Clave de Spoonacular (la app muestra un aviso si falta) |

> ⚠️ Las variables `VITE_*` se **embeben en el bundle** que se sirve desde el
> navegador: cualquier persona puede leerlas. La clave de Spoonacular queda
> expuesta por eso. Para este proyecto (presupuesto 0, uso personal/demo) es
> aceptable, pero monitorizá el consumo y no la subas a un repo público.

`.env.local` está en `.gitignore` y nunca se commitea.

## Setup

```bash
npm install
npm run dev      # desarrollo con HMR
npm run build    # build de producción en dist/
npm run lint     # ESLint
npm run preview  # sirve el build de dist/
```

## Configuración manual en Firebase Console

1. **Authentication → Método de inicio de sesión**: habilitar
   **Correo/contraseña** y desactivar **Google** y **Acceso anónimo**
   (la app solo soporta correo/contraseña).
2. **Firestore Database**: crear la base de datos en región
   `southamerica-east1`.
3. **Reglas de Firestore**: el archivo `firestore.rules` del repo valida por
   usuario (`users/{uid}/...`) con deny por defecto. Desplegar con:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. **Hosting**: ya asociado al sitio `lacartadehoy`
   (`https://lacartadehoy.web.app`). Desplegar con `npm run build && firebase deploy --only hosting`.

## Estructura

```
src/
  components/   Componentes reutilizables (con su CSS por carpeta)
  config/       Nombre de la app, navegación y opciones de filtros
  context/      AuthContext, FavoritesContext, PantryContext
  hooks/        useAuth, useFavorites, usePantry, usePreferences, usePageTitle
  pages/        Login, Register, Home, RecipeSearch, RecipeDetail,
                Pantry, Favorites, Profile, NotFound
  services/     firebase, auth, recipes, pantry, favorites, profile,
                searchHistory y spoonacular (única capa HTTP a la API)
  styles/       variables.css (design tokens) y global.css
  utils/        cache, ingredientHelpers (diccionario ES→EN), validators
```

## Reglas de datos (Firestore)

| Colección | Uso |
| --- | --- |
| `users/{uid}/preferences/data` | Preferencias de búsqueda |
| `users/{uid}/pantry` | Ingredientes de la despensa |
| `users/{uid}/favorites` | Favoritos (datos mínimos) |
| `users/{uid}/searchHistory` | Historial de búsquedas (máx. 20) |

Cada usuario solo lee/escribe sus propias subcolecciones (validado en reglas
server-side).

## Atribución

Recetas provistas por [Spoonacular](https://spoonacular.com/food-api). El
nombre de la atribución vive en `src/config/app.js`.
