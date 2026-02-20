/**
 * Extracción de texto desde archivos PDF usando pdfjs-dist
 * Límites: maxPages=5, maxChars=30000, timeout=15s
 */

let pdfjsLib = null
let workerConfigurado = false

/**
 * Configura el worker de pdfjs-dist usando ?url
 */
async function configurarWorker() {
  if (workerConfigurado && pdfjsLib) return
  
  try {
    // Intentar importar versión ESM moderna
    pdfjsLib = await import('pdfjs-dist')
    const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default
    workerConfigurado = true
  } catch (error) {
    // Si falla, usar versión legacy
    console.warn('Error con pdfjs-dist ESM, usando legacy:', error)
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const workerUrl = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default
      workerConfigurado = true
    } catch (legacyError) {
      console.error('Error configurando worker PDF (legacy):', legacyError)
      throw legacyError
    }
  }
}

/**
 * Extrae texto de un archivo PDF
 * @param {File} file - Archivo PDF
 * @param {Object} options - { maxPages=5, maxChars=30000, timeoutMs=15000 }
 * @returns {Promise<string|null>} Texto extraído o null si falla
 */
export async function extraerTextoPDF(file, { maxPages = 5, maxChars = 30000, timeoutMs = 15000 } = {}) {
  // Validar que sea PDF
  if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
    return null
  }

  // Configurar worker si no está configurado
  await configurarWorker()

  // Variable compartida para guardar progreso en caso de timeout
  const estadoExtraccion = { texto: '', completo: false }

  try {
    const extractionPromise = (async () => {
      // Leer arrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Cargar documento PDF
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      // Extraer texto de cada página (hasta maxPages)
      let textoCompleto = ''
      const numPages = Math.min(pdf.numPages, maxPages)

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Concatenar items de texto
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
        
        textoCompleto += pageText + '\n'
        // Actualizar estado compartido para timeout
        estadoExtraccion.texto = textoCompleto

        // Cortar si excede maxChars
        if (textoCompleto.length >= maxChars) {
          textoCompleto = textoCompleto.substring(0, maxChars)
          estadoExtraccion.texto = textoCompleto
          break
        }
      }

      estadoExtraccion.completo = true
      return textoCompleto.trim() || null
    })()

    // Timeout wrapper que devuelve texto parcial si hay
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!estadoExtraccion.completo && estadoExtraccion.texto.trim().length > 0) {
          // Si hay texto extraído hasta el momento, devolverlo
          resolve(estadoExtraccion.texto.trim())
        } else {
          reject(new Error('Timeout extrayendo PDF'))
        }
      }, timeoutMs)
    })

    // Ejecutar con timeout
    const resultado = await Promise.race([extractionPromise, timeoutPromise])
    return resultado
  } catch (error) {
    // Si es timeout y hay texto extraído, devolverlo
    if (error.message === 'Timeout extrayendo PDF' && estadoExtraccion.texto.trim().length > 0) {
      return estadoExtraccion.texto.trim()
    }
    console.error('Error extrayendo texto PDF:', error)
    // No romper UI: retornar null silenciosamente
    return null
  }
}
