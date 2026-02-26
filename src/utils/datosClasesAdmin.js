/**
 * Helpers para persistencia de materiales de clases (Admin)
 * Key: clases_admin_{cursoId}_clase_{numeroClase}
 */

const STORAGE_KEY_PREFIX = 'clases_admin_'

/**
 * Genera la key de localStorage
 */
function generarKey(cursoId, numeroClase) {
  return `${STORAGE_KEY_PREFIX}${cursoId}_clase_${numeroClase}`
}

/**
 * Obtiene el material de una clase
 * @param {string} cursoId
 * @param {number} numeroClase
 * @returns {Object | null} { teoria: { archivos: [], links: [] }, practica: { archivos: [], links: [] } }
 */
export function obtenerMaterialClase(cursoId, numeroClase) {
  try {
    const key = generarKey(cursoId, numeroClase)
    const data = localStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error('Error al obtener material de clase:', error)
    return null
  }
}

/**
 * Guarda el material completo de una clase
 * @param {string} cursoId
 * @param {number} numeroClase
 * @param {Object} material - { teoria: { archivos: [], links: [] }, practica: { archivos: [], links: [] } }
 */
export function guardarMaterialClase(cursoId, numeroClase, material) {
  try {
    const key = generarKey(cursoId, numeroClase)
    const data = {
      ...material,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Error al guardar material de clase:', error)
    throw error
  }
}

/**
 * Agrega un archivo a teoría o práctica
 * @param {string} cursoId
 * @param {number} numeroClase
 * @param {string} tipo - "teoria" | "practica"
 * @param {Object} archivoData - { key, nombre, tipo, tamano }
 */
export function agregarArchivoClase(cursoId, numeroClase, tipo, archivoData) {
  const material = obtenerMaterialClase(cursoId, numeroClase) || {
    teoria: { archivos: [], links: [] },
    practica: { archivos: [], links: [] }
  }
  
  if (!material[tipo]) {
    material[tipo] = { archivos: [], links: [] }
  }
  
  if (!material[tipo].archivos) {
    material[tipo].archivos = []
  }
  
  material[tipo].archivos.push({
    ...archivoData,
    uploadedAt: new Date().toISOString()
  })
  
  guardarMaterialClase(cursoId, numeroClase, material)
}

/**
 * Elimina un archivo de teoría o práctica
 * @param {string} cursoId
 * @param {number} numeroClase
 * @param {string} tipo - "teoria" | "practica"
 * @param {string} archivoKey - Key del archivo en IndexedDB
 */
export function eliminarArchivoClase(cursoId, numeroClase, tipo, archivoKey) {
  const material = obtenerMaterialClase(cursoId, numeroClase)
  if (!material || !material[tipo] || !material[tipo].archivos) {
    return
  }
  
  material[tipo].archivos = material[tipo].archivos.filter(
    archivo => archivo.key !== archivoKey
  )
  
  guardarMaterialClase(cursoId, numeroClase, material)
}

/**
 * Agrega un link a teoría o práctica
 * @param {string} cursoId
 * @param {number} numeroClase
 * @param {string} tipo - "teoria" | "practica"
 * @param {Object} linkData - { url, titulo? }
 */
export function agregarLinkClase(cursoId, numeroClase, tipo, linkData) {
  const material = obtenerMaterialClase(cursoId, numeroClase) || {
    teoria: { archivos: [], links: [] },
    practica: { archivos: [], links: [] }
  }
  
  if (!material[tipo]) {
    material[tipo] = { archivos: [], links: [] }
  }
  
  if (!material[tipo].links) {
    material[tipo].links = []
  }
  
  material[tipo].links.push({
    url: linkData.url,
    titulo: linkData.titulo || '',
    agregadoAt: new Date().toISOString()
  })
  
  guardarMaterialClase(cursoId, numeroClase, material)
}

/**
 * Elimina un link de teoría o práctica
 * @param {string} cursoId
 * @param {number} numeroClase
 * @param {string} tipo - "teoria" | "practica"
 * @param {number} linkIndex - Índice del link en el array
 */
export function eliminarLinkClase(cursoId, numeroClase, tipo, linkIndex) {
  const material = obtenerMaterialClase(cursoId, numeroClase)
  if (!material || !material[tipo] || !material[tipo].links) {
    return
  }
  
  material[tipo].links.splice(linkIndex, 1)
  guardarMaterialClase(cursoId, numeroClase, material)
}
