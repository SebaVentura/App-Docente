const STORAGE_KEY = 'diagnosticos_v1'

/**
 * Obtiene todos los diagnósticos para un curso
 * Estructura: { [cursoId]: { general: [], grupos: {}, alumnos: {} } }
 * 
 * @param {number|string} cursoId
 * @returns {Object} { general: [], grupos: {}, alumnos: {} }
 */
export function obtenerDiagnosticos(cursoId) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return { general: [], grupos: {}, alumnos: {} }
  }
  
  try {
    const data = JSON.parse(stored)
    const cursoData = data[String(cursoId)] || { general: [], grupos: {}, alumnos: {} }
    return {
      general: Array.isArray(cursoData.general) ? cursoData.general : [],
      grupos: cursoData.grupos || {},
      alumnos: cursoData.alumnos || {}
    }
  } catch (e) {
    console.error('Error al parsear diagnósticos:', e)
    return { general: [], grupos: {}, alumnos: {} }
  }
}

/**
 * Agrega un diagnóstico general
 * 
 * @param {number|string} cursoId
 * @param {Object} registro - { fechaISO, titulo, detalle }
 */
export function agregarDiagnosticoGeneral(cursoId, registro) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = { general: [], grupos: {}, alumnos: {} }
  }
  
  const registroConId = {
    ...registro,
    id: Date.now(),
    createdAt: new Date().toISOString()
  }
  
  data[String(cursoId)].general.push(registroConId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Agrega un diagnóstico grupal
 * 
 * @param {number|string} cursoId
 * @param {string} grupoKey - Clave del grupo (ej: "A", "B", "Grupo 1")
 * @param {Object} registro - { fechaISO, titulo, detalle }
 */
export function agregarDiagnosticoGrupal(cursoId, grupoKey, registro) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = { general: [], grupos: {}, alumnos: {} }
  }
  
  if (!data[String(cursoId)].grupos[grupoKey]) {
    data[String(cursoId)].grupos[grupoKey] = []
  }
  
  const registroConId = {
    ...registro,
    id: Date.now(),
    createdAt: new Date().toISOString()
  }
  
  data[String(cursoId)].grupos[grupoKey].push(registroConId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Agrega un diagnóstico individual
 * 
 * @param {number|string} cursoId
 * @param {string} alumnoKey - Clave del alumno
 * @param {Object} registro - { fechaISO, titulo, detalle, alumnoNombre }
 */
export function agregarDiagnosticoIndividual(cursoId, alumnoKey, registro) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = { general: [], grupos: {}, alumnos: {} }
  }
  
  if (!data[String(cursoId)].alumnos[alumnoKey]) {
    data[String(cursoId)].alumnos[alumnoKey] = []
  }
  
  const registroConId = {
    ...registro,
    id: Date.now(),
    createdAt: new Date().toISOString()
  }
  
  data[String(cursoId)].alumnos[alumnoKey].push(registroConId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Prepara datos de diagnósticos para Planificación
 * Retorna estructura lista para usar en módulo de Planificación
 * Solo trabaja con datos de diagnosticos_v1, sin dependencias externas
 * 
 * @param {number|string} cursoId
 * @returns {Object} { alumnos: [{ alumnoKey, alumnoNombre, indicador, ultimoDiagnostico }], resumenGrupal: {...} }
 */
export function prepararDatosParaPlanificacion(cursoId) {
  const diagnosticos = obtenerDiagnosticos(cursoId)
  const alumnos = []
  
  // Procesar diagnósticos individuales
  Object.keys(diagnosticos.alumnos).forEach((alumnoKey) => {
    const registros = diagnosticos.alumnos[alumnoKey] || []
    if (registros.length > 0) {
      const ultimoRegistro = registros[registros.length - 1]
      alumnos.push({
        alumnoKey,
        alumnoNombre: ultimoRegistro.alumnoNombre || '',
        indicador: ultimoRegistro.indicador || 'ok',
        ultimoDiagnostico: {
          fechaISO: ultimoRegistro.fechaISO,
          detalle: ultimoRegistro.detalle
        }
      })
    }
  })
  
  // Resumen grupal (último diagnóstico general o grupal)
  const resumenGrupal = diagnosticos.general.length > 0 
    ? diagnosticos.general[diagnosticos.general.length - 1]
    : null
  
  // Obtener fecha actual en formato YYYY-MM-DD sin dependencias externas
  const hoy = new Date()
  const fechaActualizacion = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  
  return {
    alumnos,
    resumenGrupal,
    fechaActualizacion
  }
}
