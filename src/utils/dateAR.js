/**
 * Helpers para fechas en formato DD-MM-AAAA (Argentina).
 * No comparar strings DD-MM-AAAA directamente; usar conversión a ISO y comparar por ISO.
 */

/**
 * Convierte DD-MM-AAAA a YYYY-MM-DD (ISO) o null si inválido.
 * @param {string} s - Fecha en formato dd-mm-aaaa
 * @returns {string|null} "yyyy-mm-dd" o null
 */
export function arToISO(s) {
  if (!s || typeof s !== 'string') return null
  const parts = s.trim().split('-')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(p => p.trim())
  const day = parseInt(d, 10)
  const month = parseInt(m, 10)
  const year = parseInt(y, 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  if (year < 1 || year > 9999) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  const yy = String(year).padStart(4, '0')
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/**
 * Valida si el string es una fecha DD-MM-AAAA válida.
 * @param {string} s - Fecha en formato dd-mm-aaaa
 * @returns {boolean}
 */
export function isValidAR(s) {
  return arToISO(s) !== null
}

/**
 * Convierte YYYY-MM-DD (ISO) a DD-MM-AAAA.
 * @param {string} iso - Fecha en formato yyyy-mm-dd
 * @returns {string} "dd-mm-aaaa"
 */
export function isoToAR(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const parts = iso.trim().split('-')
  if (parts.length !== 3) return ''
  const [y, m, d] = parts
  const year = parseInt(y, 10)
  const month = parseInt(m, 10)
  const day = parseInt(d, 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return ''
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
}

/**
 * Compara dos fechas en formato DD-MM-AAAA usando ISO.
 * @param {string} a - Fecha DD-MM-AAAA
 * @param {string} b - Fecha DD-MM-AAAA
 * @returns {number} -1 si a < b, 0 si a === b, 1 si a > b
 */
export function compareAR(a, b) {
  const isoA = arToISO(a)
  const isoB = arToISO(b)
  if (!isoA || !isoB) return 0
  if (isoA < isoB) return -1
  if (isoA > isoB) return 1
  return 0
}

/**
 * Indica si date está entre desde y hasta (inclusive) usando ISO.
 * @param {string} date - Fecha DD-MM-AAAA
 * @param {string} desde - Fecha DD-MM-AAAA
 * @param {string} hasta - Fecha DD-MM-AAAA
 * @returns {boolean}
 */
export function isBetweenAR(date, desde, hasta) {
  const isoDate = arToISO(date)
  const isoDesde = arToISO(desde)
  const isoHasta = arToISO(hasta)
  if (!isoDate || !isoDesde || !isoHasta) return false
  return isoDate >= isoDesde && isoDate <= isoHasta
}
