/**
 * Persistencia robusta de planificaciones por cursoId
 * Incluye: meta, borrador IA, evidencia
 */

const STORAGE_KEY_META = 'planificacion_meta_v1'
const STORAGE_KEY_BORRADOR_IA = 'planificacion_borrador_ia_v1'

/**
 * Normaliza cursoId a string consistente
 * @param {number|string} cursoId
 * @returns {string}
 */
function normalizarCursoId(cursoId) {
  return String(cursoId)
}

/**
 * Guarda la meta de planificación (período, año, semanasPorUnidad)
 * @param {number|string} cursoId
 * @param {Object} meta - { periodo, anio, semanasPorUnidad?, materia?, docente? }
 * @returns {void}
 */
export function guardarMetaPlanificacion(cursoId, meta) {
  const cursoKey = normalizarCursoId(cursoId)
  const stored = localStorage.getItem(STORAGE_KEY_META)
  const data = stored ? JSON.parse(stored) : {}
  
  data[cursoKey] = {
    ...meta,
    updatedAt: new Date().toISOString()
  }
  
  localStorage.setItem(STORAGE_KEY_META, JSON.stringify(data))
}

/**
 * Obtiene la meta de planificación guardada
 * @param {number|string} cursoId
 * @returns {Object|null}
 */
export function obtenerMetaPlanificacion(cursoId) {
  const cursoKey = normalizarCursoId(cursoId)
  const stored = localStorage.getItem(STORAGE_KEY_META)
  if (!stored) return null
  
  try {
    const data = JSON.parse(stored)
    return data[cursoKey] || null
  } catch (e) {
    console.error('Error al parsear meta:', e)
    return null
  }
}

/**
 * Guarda el borrador IA (planificación generada + evidencia)
 * @param {number|string} cursoId
 * @param {Object} borrador - { planificacion, evidencia, fuentesUsadas }
 * @returns {void}
 */
export function guardarBorradorIA(cursoId, borrador) {
  const cursoKey = normalizarCursoId(cursoId)
  const stored = localStorage.getItem(STORAGE_KEY_BORRADOR_IA)
  const data = stored ? JSON.parse(stored) : {}
  
  data[cursoKey] = {
    ...borrador,
    generadoEn: borrador.generadoEn || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  localStorage.setItem(STORAGE_KEY_BORRADOR_IA, JSON.stringify(data))
}

/**
 * Obtiene el borrador IA guardado
 * @param {number|string} cursoId
 * @returns {Object|null}
 */
export function obtenerBorradorIA(cursoId) {
  const cursoKey = normalizarCursoId(cursoId)
  const stored = localStorage.getItem(STORAGE_KEY_BORRADOR_IA)
  if (!stored) return null
  
  try {
    const data = JSON.parse(stored)
    return data[cursoKey] || null
  } catch (e) {
    console.error('Error al parsear borrador IA:', e)
    return null
  }
}

/**
 * Borra el borrador IA de un curso
 * @param {number|string} cursoId
 * @returns {void}
 */
export function borrarBorradorIA(cursoId) {
  const cursoKey = normalizarCursoId(cursoId)
  const stored = localStorage.getItem(STORAGE_KEY_BORRADOR_IA)
  if (!stored) return
  
  try {
    const data = JSON.parse(stored)
    delete data[cursoKey]
    localStorage.setItem(STORAGE_KEY_BORRADOR_IA, JSON.stringify(data))
  } catch (e) {
    console.error('Error al borrar borrador IA:', e)
  }
}
