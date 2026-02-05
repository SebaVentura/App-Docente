const STORAGE_KEY = 'app_escuelas'

const ESCUELAS_INICIALES = [
  { id: 1, nombre: 'Escuela Primaria N° 123' },
  { id: 2, nombre: 'Escuela Secundaria N° 456' },
]

/**
 * Obtiene todas las escuelas desde localStorage
 * Si no hay datos, devuelve valores iniciales
 */
export function obtenerEscuelas() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Error al parsear escuelas:', e)
      return ESCUELAS_INICIALES
    }
  }
  return ESCUELAS_INICIALES
}

/**
 * Guarda las escuelas en localStorage
 */
export function guardarEscuelas(escuelas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(escuelas))
}

/**
 * Genera un ID único para nueva escuela
 */
export function generarIdEscuela(escuelas) {
  if (escuelas.length === 0) return Date.now()
  const maxId = Math.max(...escuelas.map(e => e.id))
  return Math.max(maxId + 1, Date.now())
}
