import { obtenerHoyArgentina } from './fechas'

const STORAGE_KEY = 'planificacion_v1'

/**
 * Obtiene la planificación completa para un curso
 * 
 * @param {number|string} cursoId
 * @returns {Object} { programaTexto: '', programaArchivo: null, modeloArchivo: null, plan: { meta: {}, unidades: [] } } o default
 */
export function obtenerPlanificacion(cursoId) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return {
      programaTexto: '',
      programaArchivo: null,
      modeloArchivo: null,
      plan: null
    }
  }
  
  try {
    const data = JSON.parse(stored)
    const cursoData = data[String(cursoId)] || { programaTexto: '', programaArchivo: null, modeloArchivo: null, plan: null }
    return {
      programaTexto: cursoData.programaTexto || '',
      programaArchivo: cursoData.programaArchivo || null,
      modeloArchivo: cursoData.modeloArchivo || null,
      plan: cursoData.plan || null
    }
  } catch (e) {
    console.error('Error al parsear planificación:', e)
    return {
      programaTexto: '',
      programaArchivo: null,
      modeloArchivo: null,
      plan: null
    }
  }
}

/**
 * Guarda el texto del programa
 * 
 * @param {number|string} cursoId
 * @param {string} programaTexto
 */
export function guardarPrograma(cursoId, programaTexto) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = { programaTexto: '', programaArchivo: null, modeloArchivo: null, plan: null }
  }
  
  data[String(cursoId)].programaTexto = programaTexto
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Guarda el plan completo
 * 
 * @param {number|string} cursoId
 * @param {Object} planObj - { meta: {}, unidades: [] }
 */
export function guardarPlan(cursoId, planObj) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = { programaTexto: '', programaArchivo: null, modeloArchivo: null, plan: null }
  }
  
  const planConFecha = {
    ...planObj,
    updatedAt: new Date().toISOString()
  }
  
  data[String(cursoId)].plan = planConFecha
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Guarda el archivo modelo de planificación
 * 
 * @param {number|string} cursoId
 * @param {Object|null} modeloArchivo - { nombre: string, tipo: string, tamaño: number, dataUrl: string } o null para quitar
 */
export function guardarModeloArchivo(cursoId, modeloArchivo) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = { programaTexto: '', programaArchivo: null, modeloArchivo: null, plan: null }
  }
  
  // Validar tamaño si se está guardando un archivo (no null)
  if (modeloArchivo !== null) {
    const maxSizeBytes = 2 * 1024 * 1024 // 2MB
    if (modeloArchivo.tamaño > maxSizeBytes) {
      throw new Error('El archivo excede el límite de 2MB')
    }
    
    // Validar estructura
    if (!modeloArchivo.nombre || !modeloArchivo.dataUrl) {
      throw new Error('El archivo modelo debe tener nombre y dataUrl')
    }
  }
  
  data[String(cursoId)].modeloArchivo = modeloArchivo
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Guarda el archivo programa
 * 
 * @param {number|string} cursoId
 * @param {Object|null} programaArchivo - { nombre: string, tipo: string, tamano: number, dataUrl: string } o null para quitar
 */
export function guardarProgramaArchivo(cursoId, programaArchivo) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}
  
  if (!data[String(cursoId)]) {
    data[String(cursoId)] = { programaTexto: '', programaArchivo: null, modeloArchivo: null, plan: null }
  }
  
  // Validar tamaño si se está guardando un archivo (no null)
  if (programaArchivo !== null) {
    const maxSizeBytes = 2 * 1024 * 1024 // 2MB
    if (programaArchivo.tamano > maxSizeBytes) {
      throw new Error('El archivo excede el límite de 2MB')
    }
    
    // Validar estructura
    if (!programaArchivo.nombre || !programaArchivo.dataUrl || !programaArchivo.tipo || !programaArchivo.tamano) {
      throw new Error('El archivo programa debe tener nombre, tipo, tamano y dataUrl')
    }
  }
  
  data[String(cursoId)].programaArchivo = programaArchivo
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Genera planificación base desde diagnóstico
 * Crea estructura con 4 unidades y semanas configurables por unidad
 * 
 * @param {number|string} cursoId
 * @param {Object} meta - { materia, docente, periodo, anio, cursoNombre }
 * @param {string} programaTexto
 * @param {Object} datosDiagnostico - { alumnos: [], resumenGrupal: {} }
 * @param {number} semanasPorUnidad - Cantidad de semanas por unidad (default: 4)
 * @returns {Object} plan base con unidades y semanas
 */
export function generarPlanBaseDesdeDiagnostico(cursoId, meta, programaTexto, datosDiagnostico, semanasPorUnidad = 4) {
  const unidades = []
  const baseId = Date.now() // Base para generar IDs únicos con offsets
  
  // Contar indicadores
  const contadores = { riesgo: 0, medio: 0, ok: 0 }
  datosDiagnostico.alumnos.forEach(alumno => {
    const indicador = alumno.indicador || 'ok'
    contadores[indicador] = (contadores[indicador] || 0) + 1
  })
  
  // Generar sugerencias de adaptaciones si hay alumnos en riesgo/medio
  const tieneRiesgo = contadores.riesgo > 0
  const tieneMedio = contadores.medio > 0
  const sugerenciaAdaptaciones = []
  if (tieneRiesgo || tieneMedio) {
    if (tieneRiesgo) {
      sugerenciaAdaptaciones.push(`Apoyos: ${contadores.riesgo} alumno(s) en riesgo requieren refuerzos y evaluación formativa continua`)
    }
    if (tieneMedio) {
      sugerenciaAdaptaciones.push(`Refuerzos: ${contadores.medio} alumno(s) con indicador medio requieren seguimiento`)
    }
  }
  
  // Crear 4 unidades
  for (let u = 1; u <= 4; u++) {
    const semanas = []
    for (let s = 1; s <= semanasPorUnidad; s++) {
      semanas.push({
        id: baseId + (u * 10000) + (s * 100), // IDs únicos con offsets estables
        semanaNro: (u - 1) * semanasPorUnidad + s,
        contenidos: '',
        actividades: '',
        recursos: '',
        evaluacion: '',
        adaptaciones: s === 1 ? sugerenciaAdaptaciones.join('\n') : '' // Solo primera semana con sugerencias
      })
    }
    
    unidades.push({
      id: baseId + (u * 100000), // IDs únicos con offsets estables
      titulo: `Unidad ${u}`,
      semanas
    })
  }
  
  return {
    meta: {
      ...meta,
      cursoNombre: meta.cursoNombre || ''
    },
    unidades,
    updatedAt: new Date().toISOString()
  }
}
