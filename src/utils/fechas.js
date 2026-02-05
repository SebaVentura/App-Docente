/**
 * Obtiene la fecha HOY en Argentina en formato YYYY-MM-DD
 * Usa Intl.formatToParts para garantizar formato ISO independiente de locale
 */
export function obtenerHoyArgentina() {
  const hoy = new Date()
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(hoy)
  const year = parts.find(p => p.type === 'year').value
  const month = parts.find(p => p.type === 'month').value
  const day = parts.find(p => p.type === 'day').value
  
  return `${year}-${month}-${day}` // YYYY-MM-DD
}

/**
 * Obtiene el día de la semana en Argentina (Lunes, Martes, etc.)
 * Compatible con el formato guardado en horarios
 */
export function obtenerDiaSemanaArgentina() {
  const hoy = new Date()
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long'
  })
  
  const dia = formatter.format(hoy)
  // Capitalizar primera letra: 'lunes' -> 'Lunes'
  return dia.charAt(0).toUpperCase() + dia.slice(1)
}

/**
 * Normaliza nombre de día para comparación robusta
 * Remueve tildes, convierte a lowercase y elimina espacios
 * 
 * @param {string} dia - Nombre del día (ej: "Sábado", "MIERCOLES")
 * @returns {string} Día normalizado (ej: "sabado", "miercoles")
 */
export function normalizarDia(dia) {
  if (!dia) return ''
  return dia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover tildes
    .trim()
}

/**
 * Parsea string ISO (YYYY-MM-DD) a Date en timezone local
 * Evita el bug de new Date("YYYY-MM-DD") que interpreta como UTC
 * 
 * @param {string} iso - Fecha en formato YYYY-MM-DD
 * @returns {Date} Date object en timezone local
 */
export function parseISOFechaLocal(iso) {
  if (!iso || typeof iso !== 'string') {
    throw new Error('Fecha ISO inválida')
  }
  const [year, month, day] = iso.split('-').map(Number)
  // new Date(year, month-1, day) crea fecha en timezone local
  return new Date(year, month - 1, day)
}

/**
 * Formatea fecha ISO (YYYY-MM-DD) a texto largo en Argentina
 * Ejemplo: "sábado, 31 de enero de 2025"
 * 
 * @param {string} iso - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada en español Argentina
 */
export function formatearFechaLargaArgentina(iso) {
  if (!iso) return ''
  
  const fechaLocal = parseISOFechaLocal(iso)
  
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  return formatter.format(fechaLocal)
}
