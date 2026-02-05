/**
 * Períodos de intensificación del año
 * 6 períodos con fechas de inicio y fin
 */
const PERIODOS_INTENSIFICACION = [
  {
    id: 1,
    nombre: 'Período 1',
    fechaInicio: '2026-03-01', // YYYY-MM-DD - EDITAR según necesidad
    fechaFin: '2026-03-31'
  },
  {
    id: 2,
    nombre: 'Período 2',
    fechaInicio: '2026-04-01',
    fechaFin: '2026-04-30'
  },
  {
    id: 3,
    nombre: 'Período 3',
    fechaInicio: '2026-05-01',
    fechaFin: '2026-05-31'
  },
  {
    id: 4,
    nombre: 'Período 4',
    fechaInicio: '2026-06-01',
    fechaFin: '2026-06-30'
  },
  {
    id: 5,
    nombre: 'Período 5',
    fechaInicio: '2026-07-01',
    fechaFin: '2026-07-31'
  },
  {
    id: 6,
    nombre: 'Período 6',
    fechaInicio: '2026-08-01',
    fechaFin: '2026-08-31'
  }
]

/**
 * Obtiene el período activo para una fecha específica
 * @param {string} fechaISO - Fecha en formato YYYY-MM-DD
 * @returns {Object|null} Período activo o null si no hay período
 */
export function obtenerPeriodoActivo(fechaISO) {
  for (const periodo of PERIODOS_INTENSIFICACION) {
    if (fechaISO >= periodo.fechaInicio && fechaISO <= periodo.fechaFin) {
      return periodo
    }
  }
  return null
}

/**
 * Verifica si una fecha está dentro de un período de intensificación
 * @param {string} fechaISO - Fecha en formato YYYY-MM-DD
 * @returns {boolean} true si está en período, false si no
 */
export function estaEnPeriodoIntensificacion(fechaISO) {
  return obtenerPeriodoActivo(fechaISO) !== null
}
