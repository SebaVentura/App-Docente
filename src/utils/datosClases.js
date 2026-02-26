const STORAGE_KEY_PREFIX = 'clases_curso_'

/**
 * Obtiene la configuración de clases para un curso
 * @param {number|string} cursoId
 * @returns {Object|null} { totalClases, claseSeleccionada } o null
 */
export function obtenerClasesCurso(cursoId) {
  const key = `${STORAGE_KEY_PREFIX}${cursoId}_config`
  const stored = localStorage.getItem(key)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error('Error al parsear configuración de clases:', e)
    return null
  }
}

/**
 * Guarda la configuración de clases para un curso
 * @param {number|string} cursoId
 * @param {Object} config - { totalClases, claseSeleccionada }
 */
export function guardarClasesCurso(cursoId, config) {
  const key = `${STORAGE_KEY_PREFIX}${cursoId}_config`
  localStorage.setItem(key, JSON.stringify(config))
}

/**
 * Obtiene el detalle de una clase específica
 * @param {number|string} cursoId
 * @param {number} numeroClase
 * @returns {Object|null} { detalle, fecha, ... } o null
 */
export function obtenerDetalleClase(cursoId, numeroClase) {
  const key = `${STORAGE_KEY_PREFIX}${cursoId}_clase_${numeroClase}`
  const stored = localStorage.getItem(key)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error('Error al parsear detalle de clase:', e)
    return null
  }
}

/**
 * Guarda el detalle de una clase específica
 * @param {number|string} cursoId
 * @param {number} numeroClase
 * @param {Object} datos - { detalle, fecha, ... }
 */
export function guardarDetalleClase(cursoId, numeroClase, datos) {
  const key = `${STORAGE_KEY_PREFIX}${cursoId}_clase_${numeroClase}`
  localStorage.setItem(key, JSON.stringify({
    ...datos,
    updatedAt: new Date().toISOString()
  }))
}
