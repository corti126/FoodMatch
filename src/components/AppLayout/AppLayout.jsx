import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar.jsx'
import Header from '../Header/Header.jsx'
import BottomNavigation from '../BottomNavigation/BottomNavigation.jsx'
import './AppLayout.css'

/**
 * Estructura general de las páginas autenticadas:
 * lateral fijo en desktop, barra inferior en mobile.
 */
export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Header />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
      <BottomNavigation />
    </div>
  )
}
