/**
 * Utilidades para extraer texto de archivos
 * Actualmente soporta DOCX usando mammoth
 */

import mammoth from 'mammoth'

/**
 * Extrae texto de un archivo DOCX
 * @param {File} file - Archivo DOCX
 * @returns {Promise<string | null>} Texto extraído o null si falla
 */
export async function extraerTextoDOCX(file) {
  // Validar que sea DOCX
  const esDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                 file.name.toLowerCase().endsWith('.docx')
  
  if (!esDOCX) {
    return null
  }

  try {
    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Extraer texto con timeout de 10 segundos
    const resultado = await Promise.race([
      mammoth.extractRawText({ arrayBuffer }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: la extracción tardó más de 10 segundos')), 10000)
      )
    ])

    // mammoth.extractRawText retorna { value: string, messages: [] }
    const textoExtraido = resultado.value
    
    if (!textoExtraido || typeof textoExtraido !== 'string') {
      return null
    }

    // Limpiar y normalizar texto
    const textoLimpio = textoExtraido
      .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
      .replace(/\r/g, '\n')
      .trim()

    return textoLimpio || null
  } catch (error) {
    console.error('Error al extraer texto de DOCX:', error)
    return null
  }
}
