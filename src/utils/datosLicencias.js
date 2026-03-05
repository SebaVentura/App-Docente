import { isValidAR, compareAR, isBetweenAR } from './dateAR'

const KEY = 'teacher_leaves_v1'

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
 * Obtiene todas las licencias.
 * @returns {Array<{id, tipo, desde, hasta, observacion, createdAt}>}
 */
export function getLeaves() {
  return getStored()
}

/**
 * Agrega una licencia. Valida formato DD-MM-AAAA y desde <= hasta.
 * @param {Object} leave - { tipo, desde, hasta, observacion }
 * @returns {string|null} id de la licencia creada o null si falla validación
 */
export function addLeave(leave) {
  if (!leave || !leave.tipo || !leave.desde || !leave.hasta) return null
  if (!isValidAR(leave.desde) || !isValidAR(leave.hasta)) return null
  if (compareAR(leave.desde, leave.hasta) > 0) return null
  const arr = getStored()
  const id = `leave_${Date.now()}`
  arr.push({
    id,
    tipo: String(leave.tipo).trim(),
    desde: String(leave.desde).trim(),
    hasta: String(leave.hasta).trim(),
    observacion: (leave.observacion || '').trim(),
    createdAt: new Date().toISOString()
  })
  setStored(arr)
  return id
}

/**
 * Elimina una licencia por id.
 * @param {string} id
 */
export function removeLeave(id) {
  const arr = getStored().filter(l => l.id !== id)
  setStored(arr)
}

/**
 * Indica si la fecha (DD-MM-AAAA) está dentro de alguna licencia activa.
 * @param {string} dateAR - Fecha en formato DD-MM-AAAA
 * @returns {boolean}
 */
export function isDateOnLeave(dateAR) {
  return getLeaveForDate(dateAR) !== null
}

/**
 * Retorna la primera licencia que incluye la fecha (DD-MM-AAAA), o null.
 * @param {string} dateAR - Fecha en formato DD-MM-AAAA
 * @returns {{ tipo, desde, hasta }|null}
 */
export function getLeaveForDate(dateAR) {
  const leaves = getStored()
  for (const l of leaves) {
    if (isBetweenAR(dateAR, l.desde, l.hasta)) {
      return { tipo: l.tipo, desde: l.desde, hasta: l.hasta }
    }
  }
  return null
}
