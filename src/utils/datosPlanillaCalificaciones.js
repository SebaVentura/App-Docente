const STORAGE_KEY = 'planilla_calificaciones_v1'

const FILA_VACIA = {
  cursRecurs: '',
  parciales1: '',
  valoracion1: '',
  calif1: '',
  intensif1: '',
  inasist1: '',
  parciales2: '',
  valoracion2: '',
  calif2: '',
  intensif2: '',
  inasist2: '',
  diciembre: '',
  febrero: '',
  califFinal: ''
}

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return typeof data === 'object' && data !== null ? data : {}
  } catch {
    return {}
  }
}

function setStored(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Obtiene el borrador de planilla para un curso.
 * @param {string|number} cursoId
 * @returns {{ encabezado: Object, filas: Object, updatedAt?: string }|null}
 */
export function obtenerBorrador(cursoId) {
  const data = getStored()
  return data[String(cursoId)] || null
}

/**
 * Guarda el borrador de planilla para un curso.
 * @param {string|number} cursoId
 * @param {Object} borrador - { encabezado, filas }
 */
export function guardarBorrador(cursoId, borrador) {
  const data = getStored()
  data[String(cursoId)] = {
    ...borrador,
    updatedAt: new Date().toISOString()
  }
  setStored(data)
}

/**
 * Devuelve la estructura vacía de una fila para un alumno.
 */
export function getFilaVacia() {
  return { ...FILA_VACIA }
}
