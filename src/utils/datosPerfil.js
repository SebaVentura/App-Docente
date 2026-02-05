const STORAGE_KEY = 'perfilDocente'

/**
 * Obtiene el perfil del docente desde localStorage
 * @returns {Object|null} Perfil o null si no existe
 */
export function obtenerPerfilDocente() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Error al parsear perfil docente:', e)
      return null
    }
  }
  return null
}

/**
 * Guarda el perfil del docente en localStorage
 * @param {Object} perfil - Objeto con datos del perfil
 */
export function guardarPerfilDocente(perfil) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(perfil))
}

/**
 * Normaliza CUIL a formato XX-XXXXXXXX-X
 * @param {string} cuil - CUIL con o sin guiones
 * @returns {string} CUIL normalizado
 */
export function normalizarCUIL(cuil) {
  if (!cuil) return ''
  // Remover todos los guiones y espacios
  const soloNumeros = cuil.replace(/[-\s]/g, '')
  // Validar que tenga 11 dígitos
  if (soloNumeros.length !== 11 || !/^\d+$/.test(soloNumeros)) {
    return cuil // Retornar original si no es válido
  }
  // Formatear: XX-XXXXXXXX-X
  return `${soloNumeros.slice(0, 2)}-${soloNumeros.slice(2, 10)}-${soloNumeros.slice(10)}`
}

/**
 * Valida que el perfil esté completo
 * @param {Object} perfil - Objeto con datos del perfil
 * @returns {boolean} true si está completo
 */
export function validarPerfilCompleto(perfil) {
  if (!perfil) return false

  // Validar que todos los campos existan y no estén vacíos
  if (!perfil.nombreCompleto || !perfil.nombreCompleto.trim()) return false
  if (!perfil.dni || !perfil.dni.trim()) return false
  if (!perfil.cuil || !perfil.cuil.trim()) return false
  if (!perfil.domicilio || !perfil.domicilio.trim()) return false
  if (!perfil.telefono || !perfil.telefono.trim()) return false
  if (!perfil.email || !perfil.email.trim()) return false
  if (!perfil.cicloLectivo || !perfil.cicloLectivo.toString().trim()) return false

  // Validar formato DNI (7 u 8 dígitos)
  const dniValido = /^\d{7,8}$/.test(perfil.dni.trim())
  if (!dniValido) return false

  // Validar formato CUIL (XX-XXXXXXXX-X)
  const cuilNormalizado = normalizarCUIL(perfil.cuil)
  const cuilValido = /^\d{2}-\d{8}-\d{1}$/.test(cuilNormalizado)
  if (!cuilValido) return false

  // Validar formato email
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email.trim())
  if (!emailValido) return false

  // Validar ciclo lectivo numérico
  const cicloValido = !isNaN(Number(perfil.cicloLectivo)) && Number(perfil.cicloLectivo) > 0
  if (!cicloValido) return false

  return true
}
