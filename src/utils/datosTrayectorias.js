const STORAGE_KEY = 'trayectorias_registros_v1'

/**
 * Obtiene todos los registros de trayectorias para un curso
 * Estructura: { [cursoId]: { [alumnoKey]: Registro[] } }
 * 
 * @param {number|string} cursoId
 * @returns {Object} { [alumnoKey]: Registro[] } o {}
 */
export function obtenerRegistros(cursoId) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return {}
  
  try {
    const data = JSON.parse(stored)
    return data[String(cursoId)] || {}
  } catch (e) {
    console.error('Error al parsear trayectorias:', e)
    return {}
  }
}

/**
 * Agrega un registro de trayectoria para un alumno
 * 
 * @param {number|string} cursoId
 * @param {string} alumnoKey - legajo, id o nombre normalizado
 * @param {Object} registro - { alumnoKey, alumnoNombre, fechaISO, tipo, detalle, ... }
 */
export function agregarRegistro(cursoId, alumnoKey, registro) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = {}
  }
  
  if (!data[String(cursoId)][alumnoKey]) {
    data[String(cursoId)][alumnoKey] = []
  }
  
  // Agregar registro con timestamp
  const registroConId = {
    ...registro,
    id: Date.now(),
    createdAt: new Date().toISOString()
  }
  
  data[String(cursoId)][alumnoKey].push(registroConId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Genera clave única para alumno (legajo > id > nombre normalizado)
 * Solo agrega cursoId|idx si hay duplicados por nombre
 * 
 * @param {Object} alumno - Objeto alumno
 * @param {number} idx - Índice en la lista (solo si hay duplicados)
 * @param {number|string} cursoId - ID del curso (solo si hay duplicados)
 * @param {boolean} hayDuplicado - Indica si hay más de un alumno con el mismo nombre normalizado
 * @returns {string} Clave única del alumno
 */
export function generarAlumnoKey(alumno, idx, cursoId, hayDuplicado = false) {
  if (alumno.legajo) return String(alumno.legajo)
  if (alumno.id) return String(alumno.id)
  // Fallback: nombre normalizado
  const apellido = (alumno.apellido || '').toUpperCase().trim()
  const nombre = (alumno.nombre || '').toUpperCase().trim()
  let nombreNormalizado = `${apellido},${nombre}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover tildes
  // Solo agregar cursoId|idx si hay duplicados
  if (hayDuplicado) {
    nombreNormalizado = `${nombreNormalizado}|${cursoId}|${idx}`
  }
  return nombreNormalizado
}
