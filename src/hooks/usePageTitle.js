import { useEffect } from 'react'
import { APP_NAME } from '../config/app.js'

/** Establece el título de la pestaña con el formato "Sección · App". */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
