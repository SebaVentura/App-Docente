const STORAGE_KEY = 'trayectorias_seguimiento_v1'

/**
 * Obtiene el estado de seguimiento manual para un curso
 * Estructura: { [cursoId]: { [alumnoKey]: true } }
 * 
 * @param {number|string} cursoId
 * @returns {Object} { [alumnoKey]: true } o {}
 */
export function obtenerSeguimiento(cursoId) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return {}
  
  try {
    const data = JSON.parse(stored)
    return data[String(cursoId)] || {}
  } catch (e) {
    console.error('Error al parsear seguimiento:', e)
    return {}
  }
}

/**
 * Invierte el estado de seguimiento para un alumno
 * Si está en seguimiento (true), lo quita (undefined)
 * Si no está, lo agrega (true)
 * 
 * @param {number|string} cursoId
 * @param {string} alumnoKey
 */
export function toggleSeguimiento(cursoId, alumnoKey) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = {}
  }
  
  // Invertir estado: si existe y es true, eliminarlo; si no existe, agregarlo como true
  if (data[String(cursoId)][alumnoKey]) {
    delete data[String(cursoId)][alumnoKey]
  } else {
    data[String(cursoId)][alumnoKey] = true
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
