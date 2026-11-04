import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './hooks/useAuth.js'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { PantryProvider } from './context/PantryContext.jsx'
import AppLayout from './components/AppLayout/AppLayout.jsx'
import AuthLayout from './components/AuthLayout/AuthLayout.jsx'
import Loading from './components/Loading/Loading.jsx'
import { APP_NAME } from './config/app.js'
import './styles/variables.css'
import './styles/global.css'

// Lazy loading de páginas: se cargan solo cuando se necesitan.
const Home = lazy(() => import('./pages/Home/Home.jsx'))
const RecipeSearch = lazy(() => import('./pages/RecipeSearch/RecipeSearch.jsx'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail/RecipeDetail.jsx'))
const Pantry = lazy(() => import('./pages/Pantry/Pantry.jsx'))
const Favorites = lazy(() => import('./pages/Favorites/Favorites.jsx'))
const Profile = lazy(() => import('./pages/Profile/Profile.jsx'))
const Login = lazy(() => import('./pages/Login/Login.jsx'))
const Register = lazy(() => import('./pages/Register/Register.jsx'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound.jsx'))

/** Rutas privadas: requieren sesión iniciada. */
function ProtectedRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading fullScreen label="Cargando tu cuenta..." />
  if (!user) return <Navigate to="/ingresar" replace state={{ from: location }} />
  return <Outlet />
}

function GuestRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading fullScreen label="Cargando..." />
  if (user) {
    const from = location.state?.from
    const target = from ? `${from.pathname}${from.search || ''}` : '/'
    return <Navigate to={target} replace />
  }
  return <Outlet />
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading fullScreen label="Cargando..." />}>
      <Routes>
        <Route element={<GuestRoutes />}>
          <Route element={<AuthLayout />}>
            <Route path="/ingresar" element={<Login />} />
            <Route path="/registro" element={<Register />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoutes />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/buscar" element={<RecipeSearch />} />
            <Route path="/receta/:id" element={<RecipeDetail />} />
            <Route path="/despensa" element={<Pantry />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  useEffect(() => {
    document.title = APP_NAME
  }, [])

  return (
    <AuthProvider>
      <FavoritesProvider>
        <PantryProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PantryProvider>
      </FavoritesProvider>
    </AuthProvider>
  )
}
