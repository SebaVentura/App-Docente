const STORAGE_KEY = 'app_asistencia'

/**
 * Obtiene asistencia para una fecha y curso específicos
 * Estructura: { [fecha]: { [cursoId]: { [alumnoId]: { presente, tarde, horaIngreso } } } }
 * 
 * @param {string} fecha - Formato YYYY-MM-DD
 * @param {number|string} cursoId
 * @returns {Object|null} Datos de asistencia o null si no existe
 */
export function obtenerAsistencia(fecha, cursoId) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  
  try {
    const data = JSON.parse(stored)
    return data[fecha]?.[String(cursoId)] || null
  } catch (e) {
    console.error('Error al parsear asistencia:', e)
    return null
  }
}

/**
 * Guarda asistencia para una fecha y curso específicos
 * 
 * @param {string} fecha - Formato YYYY-MM-DD
 * @param {number|string} cursoId
 * @param {Object} datos - { [alumnoId]: { presente, tarde, horaIngreso } }
 */
export function guardarAsistencia(fecha, cursoId, datos) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[fecha]) {
    data[fecha] = {}
  }
  
  data[fecha][String(cursoId)] = datos
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Verifica si existe asistencia guardada para una fecha y curso
 * 
 * @param {string} fecha - Formato YYYY-MM-DD
 * @param {number|string} cursoId
 * @returns {boolean}
 */
export function existeAsistencia(fecha, cursoId) {
  const asistencia = obtenerAsistencia(fecha, cursoId)
  return asistencia !== null && asistencia !== undefined
}

/**
 * Obtiene todas las asistencias de una fecha específica
 * Útil para Dashboard: una sola lectura de localStorage
 * 
 * @param {string} fecha - Formato YYYY-MM-DD
 * @returns {Object} { [cursoId]: datos } o {}
 */
export function obtenerAsistenciasPorFecha(fecha) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return {}
  
  try {
    const data = JSON.parse(stored)
    return data[fecha] || {}
  } catch (e) {
    console.error('Error al parsear asistencia:', e)
    return {}
  }
}
