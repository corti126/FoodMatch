import './Skeleton.css'

/**
 * Bloque de carga (skeleton). Evita pantallas vacías mientras llegan datos.
 * Uso: <Skeleton width="60%" height={20} />
 */
export default function Skeleton({
  width = '100%',
  height,
  radius = 'var(--radius-sm)',
  className = '',
}) {
  const style = { width, borderRadius: radius }
  if (height !== undefined) style.height = height

  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}
