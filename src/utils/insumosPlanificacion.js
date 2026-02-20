/**
 * Persistencia de insumos de planificación (v2)
 * Usa IndexedDB para archivos y localStorage para referencias
 */

import { guardarArchivo, obtenerArchivo, borrarArchivo, fileToBlob } from './archivosLocal'
import { obtenerHoyArgentina } from './fechas'

const STORAGE_KEY = 'planificacion_insumos_v2'

/**
 * Estructura de datos:
 * {
 *   programa: { fileRef?: {key, nombre, tipo, tamano}, texto?: string, textoExtraido?: string, updatedAt: string },
 *   modelo: { fileRef?: {key, nombre, tipo, tamano}, texto?: string, textoExtraido?: string, updatedAt: string },
 *   adicionales: [
 *     { id: string, tipo: string, titulo: string, fileRef?: {...}, texto?: string, textoExtraido?: string, usarComoFuente: boolean, updatedAt: string }
 *   ]
 * }
 */

/**
 * Normaliza cursoId a string consistente
 * @param {number|string} cursoId
 * @returns {string}
 */
function normalizarCursoId(cursoId) {
  return String(cursoId)
}

/**
 * Obtiene los insumos para un curso
 * @param {number|string} cursoId
 * @returns {Promise<Object>}
 */
export async function obtenerInsumos(cursoId) {
  const cursoKey = normalizarCursoId(cursoId)
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return {
      programa: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
      modelo: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
      adicionales: []
    }
  }

  try {
    const data = JSON.parse(stored)
    const cursoData = data[cursoKey] || {
      programa: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
      modelo: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
      adicionales: []
    }
    // Asegurar que textoExtraido exista (retrocompatibilidad)
    if (!cursoData.programa.textoExtraido) cursoData.programa.textoExtraido = ''
    if (!cursoData.modelo.textoExtraido) cursoData.modelo.textoExtraido = ''
    return cursoData
  } catch (e) {
    console.error('Error al parsear insumos:', e)
    return {
      programa: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
      modelo: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
      adicionales: []
    }
  }
}

/**
 * Guarda los insumos para un curso
 * @param {number|string} cursoId
 * @param {Object} insumos
 * @returns {Promise<void>}
 */
export async function guardarInsumos(cursoId, insumos) {
  const cursoKey = normalizarCursoId(cursoId)
  const stored = localStorage.getItem(STORAGE_KEY)
  const data = stored ? JSON.parse(stored) : {}

  // Clonar insumos para no mutar el original
  const insumosAGuardar = {
    programa: { ...insumos.programa },
    modelo: { ...insumos.modelo },
    adicionales: insumos.adicionales ? insumos.adicionales.map(a => ({ ...a })) : []
  }

  // Actualizar updatedAt solo si hay contenido
  const ahora = new Date().toISOString()
  if (insumosAGuardar.programa && (insumosAGuardar.programa.fileRef || insumosAGuardar.programa.texto?.trim())) {
    insumosAGuardar.programa.updatedAt = ahora
  } else if (!insumosAGuardar.programa.updatedAt) {
    insumosAGuardar.programa.updatedAt = ''
  }
  
  if (insumosAGuardar.modelo && (insumosAGuardar.modelo.fileRef || insumosAGuardar.modelo.texto?.trim())) {
    insumosAGuardar.modelo.updatedAt = ahora
  } else if (!insumosAGuardar.modelo.updatedAt) {
    insumosAGuardar.modelo.updatedAt = ''
  }
  
  if (insumosAGuardar.adicionales) {
    insumosAGuardar.adicionales.forEach(adicional => {
      if (adicional.fileRef || adicional.texto?.trim()) {
        adicional.updatedAt = ahora
      } else if (!adicional.updatedAt) {
        adicional.updatedAt = ''
      }
    })
  }

  data[cursoKey] = insumosAGuardar
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Guarda un archivo y retorna la referencia
 * @param {File} file
 * @returns {Promise<{key, nombre, tipo, tamano}>}
 */
export async function guardarArchivoInsumo(file) {
  const blob = fileToBlob(file)
  return await guardarArchivo({
    blob,
    nombre: file.name,
    tipo: file.type
  })
}

/**
 * Obtiene un archivo desde su referencia
 * @param {{key: string}} fileRef
 * @returns {Promise<Blob | null>}
 */
export async function obtenerArchivoInsumo(fileRef) {
  if (!fileRef || !fileRef.key) return null
  return await obtenerArchivo(fileRef.key)
}

/**
 * Borra un archivo desde su referencia
 * @param {{key: string}} fileRef
 * @returns {Promise<void>}
 */
export async function borrarArchivoInsumo(fileRef) {
  if (!fileRef || !fileRef.key) return
  return await borrarArchivo(fileRef.key)
}

/**
 * Valida que los insumos estén completos para generar con IA
 * @param {Object} insumos
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarInsumosParaIA(insumos) {
  // Validar Programa (obligatorio)
  if (!insumos.programa || (!insumos.programa.fileRef && !insumos.programa.texto?.trim())) {
    return {
      valido: false,
      error: 'El Programa es obligatorio. Subí un archivo o pegá el texto.'
    }
  }

  // Validar Modelo (obligatorio)
  if (!insumos.modelo || (!insumos.modelo.fileRef && !insumos.modelo.texto?.trim())) {
    return {
      valido: false,
      error: 'El Modelo de planificación es obligatorio. Subí un archivo o pegá el texto.'
    }
  }

  // Programa y Modelo siempre son fuentes, así que ya hay al menos 2 fuentes
  // Pero verificamos que haya al menos 1 fuente usable total (Programa + Modelo siempre cuentan)
  const fuentesUsables = []
  if (insumos.programa && (insumos.programa.fileRef || insumos.programa.texto?.trim())) {
    fuentesUsables.push('programa')
  }
  if (insumos.modelo && (insumos.modelo.fileRef || insumos.modelo.texto?.trim())) {
    fuentesUsables.push('modelo')
  }
  if (insumos.adicionales) {
    insumos.adicionales.forEach(adicional => {
      if (adicional.usarComoFuente && (adicional.fileRef || adicional.texto?.trim())) {
        fuentesUsables.push(`adicional_${adicional.id}`)
      }
    })
  }

  if (fuentesUsables.length === 0) {
    return {
      valido: false,
      error: 'Debe haber al menos un insumo con contenido para generar la planificación.'
    }
  }

  return { valido: true }
}

/**
 * Migra datos desde planificacion_v1 a la nueva estructura v2
 * @param {number|string} cursoId
 * @returns {Promise<Object>}
 */
export async function migrarInsumosV1(cursoId) {
  const v1Key = 'planificacion_v1'
  const stored = localStorage.getItem(v1Key)
  if (!stored) {
    return null
  }

  try {
    const data = JSON.parse(stored)
    const cursoData = data[String(cursoId)]
    if (!cursoData) {
      return null
    }

    const insumos = {
      programa: {
        updatedAt: ''
      },
      modelo: {
        updatedAt: ''
      },
      adicionales: []
    }

    // Migrar programa
    if (cursoData.programaTexto) {
      insumos.programa.texto = cursoData.programaTexto
    }
    if (cursoData.programaArchivo) {
      // Intentar migrar archivo desde base64 a IndexedDB
      try {
        const base64Data = cursoData.programaArchivo.dataUrl
        if (base64Data && base64Data.startsWith('data:')) {
          const response = await fetch(base64Data)
          const blob = await response.blob()
          const fileRef = await guardarArchivo({
            blob,
            nombre: cursoData.programaArchivo.nombre || 'programa.pdf',
            tipo: cursoData.programaArchivo.tipo || 'application/pdf'
          })
          insumos.programa.fileRef = fileRef
        }
      } catch (e) {
        console.warn('No se pudo migrar archivo programa a IndexedDB:', e)
      }
    }

    // Migrar modelo
    if (cursoData.modeloArchivo) {
      try {
        const base64Data = cursoData.modeloArchivo.dataUrl
        if (base64Data && base64Data.startsWith('data:')) {
          const response = await fetch(base64Data)
          const blob = await response.blob()
          const fileRef = await guardarArchivo({
            blob,
            nombre: cursoData.modeloArchivo.nombre || 'modelo.pdf',
            tipo: cursoData.modeloArchivo.tipo || 'application/pdf'
          })
          insumos.modelo.fileRef = fileRef
        }
      } catch (e) {
        console.warn('No se pudo migrar archivo modelo a IndexedDB:', e)
      }
    }

    // Actualizar updatedAt si hay datos
    if (insumos.programa.texto || insumos.programa.fileRef) {
      insumos.programa.updatedAt = new Date().toISOString()
    }
    if (insumos.modelo.fileRef) {
      insumos.modelo.updatedAt = new Date().toISOString()
    }

    return insumos
  } catch (e) {
    console.error('Error al migrar insumos v1:', e)
    return null
  }
}
