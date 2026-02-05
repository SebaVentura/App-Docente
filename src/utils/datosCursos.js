const STORAGE_KEY = 'app_cursos'

const CURSOS_INICIALES = [
  { id: 10, nombre: 'Matemática 1° Año', escuelaId: 1, horarios: [{ dia: 'Lunes', desde: '08:00', hasta: '09:20' }] },
  { id: 20, nombre: 'Lengua 2° Año', escuelaId: 2, horarios: [{ dia: 'Martes', desde: '10:00', hasta: '11:20' }] },
]

/**
 * Obtiene todos los cursos desde localStorage
 * Si no hay datos, devuelve valores iniciales
 */
export function obtenerCursos() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Error al parsear cursos:', e)
      return CURSOS_INICIALES
    }
  }
  return CURSOS_INICIALES
}

/**
 * Guarda todos los cursos en localStorage
 */
export function guardarCursos(cursos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cursos))
}

/**
 * Genera un ID único para nuevo curso
 */
export function generarIdCurso(cursos) {
  if (cursos.length === 0) return Date.now()
  const maxId = Math.max(...cursos.map(c => c.id))
  return Math.max(maxId + 1, Date.now())
}
