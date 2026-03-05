import { isValidAR } from './dateAR'

const KEY = 'course_events_v1'

function getStored() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function setStored(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr))
}

/**
 * Obtiene los eventos masivos de un curso.
 * @param {string|number} cursoId
 * @returns {Array}
 */
export function getEventosMasivos(cursoId) {
  return getStored().filter(e => String(e.courseId) === String(cursoId))
}

/**
 * Obtiene un evento por id.
 * @param {string} id
 * @returns {Object|null}
 */
export function getEventoMasivo(id) {
  return getStored().find(e => e.id === id) || null
}

/**
 * Guarda un evento masivo (crea o actualiza). Valida fecha con isValidAR.
 * @param {Object} evt - { id?, courseId, fecha, tipo, titulo, modo, detalles }
 * @returns {string|null} id del evento o null si validación falla
 */
export function guardarEventoMasivo(evt) {
  if (!isValidAR(evt.fecha)) return null
  const arr = getStored()
  const id = evt.id || `ev_${Date.now()}`
  const idx = arr.findIndex(e => e.id === id)
  const toSave = {
    ...evt,
    id,
    courseId: String(evt.courseId),
    fecha: String(evt.fecha).trim(),
    tipo: String(evt.tipo || '').trim(),
    titulo: String(evt.titulo || '').trim(),
    modo: evt.modo || 'nota_num',
    detalles: Array.isArray(evt.detalles) ? evt.detalles : [],
    createdAt: evt.createdAt || new Date().toISOString()
  }
  if (idx >= 0) {
    arr[idx] = toSave
  } else {
    arr.push(toSave)
  }
  setStored(arr)
  return id
}

/**
 * Elimina un evento por id.
 * @param {string} id
 */
export function eliminarEventoMasivo(id) {
  setStored(getStored().filter(e => e.id !== id))
}
