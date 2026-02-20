/**
 * Generación de planificación con IA (mock por ahora)
 * Usa SOLO los insumos presentes y marcados como fuente
 */

/**
 * Cuenta solo caracteres útiles (letras y números)
 * @param {string} texto
 * @returns {number}
 */
function contarCaracteresUtiles(texto) {
  if (!texto || typeof texto !== 'string') return 0
  // Contar solo letras, números y caracteres con tilde
  return texto.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g, '').length
}

/**
 * Valida que el texto sea válido para usar como extracto
 * Requiere al menos 20 caracteres útiles
 * @param {string} texto
 * @returns {boolean}
 */
function esTextoValidoParaExtracto(texto) {
  if (!texto || typeof texto !== 'string') return false
  const caracteresUtiles = contarCaracteresUtiles(texto)
  return caracteresUtiles >= 20
}

/**
 * Obtiene el origen del texto de un insumo
 * @param {Object} insumo - { textoExtraido?, texto?, fileRef? }
 * @returns {'extraido_docx' | 'extraido_pdf' | 'pegado' | null}
 */
function obtenerOrigenTexto(insumo) {
  // Prioridad: textoExtraido > texto pegado
  if (insumo?.textoExtraido?.trim() && esTextoValidoParaExtracto(insumo.textoExtraido)) {
    // Detectar tipo por extensión del archivo
    const nombreArchivo = insumo.fileRef?.nombre || ''
    if (nombreArchivo.toLowerCase().endsWith('.docx')) {
      return 'extraido_docx'
    }
    if (nombreArchivo.toLowerCase().endsWith('.pdf')) {
      return 'extraido_pdf'
    }
    // Fallback: si hay textoExtraido pero no se detecta extensión, asumir PDF
    return 'extraido_pdf'
  }
  if (insumo?.texto?.trim() && esTextoValidoParaExtracto(insumo.texto)) {
    return 'pegado'
  }
  return null
}

/**
 * Formatea el origen del texto para mostrar en UI
 * @param {'extraido_docx' | 'extraido_pdf' | 'pegado' | null} origen
 * @returns {string}
 */
function formatearOrigen(origen) {
  switch (origen) {
    case 'extraido_docx':
      return 'Texto extraído (DOCX)'
    case 'extraido_pdf':
      return 'Texto extraído (PDF)'
    case 'pegado':
      return 'Texto pegado'
    default:
      return ''
  }
}

// Exportar helpers para reutilizar en otros componentes
export { contarCaracteresUtiles, esTextoValidoParaExtracto, obtenerOrigenTexto, formatearOrigen }

/**
 * Genera planificación con IA (mock)
 * @param {Object} params - { cursoId, meta, insumos }
 * @returns {Promise<Object>} Planificación con evidencia
 */
export async function generarPlanificacionIA({ cursoId, meta, insumos }) {
  // Simular delay de generación
  await new Promise(resolve => setTimeout(resolve, 2000))

  const warnings = []

  // Obtener fuentes usables
  const fuentesUsables = []
  
  // Programa siempre es fuente (preferir textoExtraido sobre texto)
  const tieneContenidoPrograma = insumos.programa && (
    insumos.programa.fileRef || 
    insumos.programa.textoExtraido?.trim() || 
    insumos.programa.texto?.trim()
  )
  if (tieneContenidoPrograma) {
    fuentesUsables.push({
      tipo: 'programa',
      id: null,
      titulo: 'Programa (insumo)',
      subtitulo: insumos.programa.fileRef?.nombre || null
    })
  }

  // Modelo siempre es fuente (preferir textoExtraido sobre texto)
  const tieneContenidoModelo = insumos.modelo && (
    insumos.modelo.fileRef || 
    insumos.modelo.textoExtraido?.trim() || 
    insumos.modelo.texto?.trim()
  )
  if (tieneContenidoModelo) {
    fuentesUsables.push({
      tipo: 'modelo',
      id: null,
      titulo: 'Modelo de planificación (insumo)',
      subtitulo: insumos.modelo.fileRef?.nombre || null
    })
  }

  // Adicionales marcados como fuente (preferir textoExtraido sobre texto)
  if (insumos.adicionales) {
    insumos.adicionales.forEach(adicional => {
      const tieneContenido = adicional.fileRef || 
                             adicional.textoExtraido?.trim() || 
                             adicional.texto?.trim()
      if (adicional.usarComoFuente && tieneContenido) {
        fuentesUsables.push({
          tipo: 'adicional',
          id: adicional.id,
          titulo: adicional.titulo || 'Insumo adicional (sin título)',
          subtitulo: adicional.fileRef?.nombre || null
        })
      }
    })
  }

  // Generar bibliografía (solo títulos de fuentes usables)
  const bibliografia = fuentesUsables.map(f => {
    if (f.subtitulo) {
      return `${f.titulo} - ${f.subtitulo}`
    }
    return f.titulo
  })

  // Helper para crear firma normalizada (deduplicación)
  const crearFirmaNormalizada = (fragmento) => {
    if (!fragmento || typeof fragmento !== 'string') return ''
    
    // Normalizar: lowercase + sin tildes + sin puntuación + primeras 12 palabras
    let normalizado = fragmento.toLowerCase()
    
    // Remover tildes
    normalizado = normalizado
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
    
    // Remover puntuación
    normalizado = normalizado.replace(/[^\w\s]/g, ' ')
    
    // Obtener primeras 12 palabras
    const palabras = normalizado.split(/\s+/).filter(p => p.length > 0)
    return palabras.slice(0, 12).join(' ')
  }

  // Segmentar texto por encabezados de sección
  const segmentarTextoPorEncabezados = (texto) => {
    if (!texto || typeof texto !== 'string') {
      return {
        fundamentacion: '',
        propositos: '',
        objetivos: '',
        contenidos: '',
        evaluacion: ''
      }
    }
    
    const lineas = texto.split('\n')
    const resultado = {
      fundamentacion: '',
      propositos: '',
      objetivos: '',
      contenidos: '',
      evaluacion: ''
    }
    
    // Patrones regex para encabezados (case-insensitive, tolera numeración 1. 1) 1- y ":")
    const patrones = {
      fundamentacion: /^\s*(\d+\s*[\.\)\-]?\s*)?(fundamentación|fundamentacion)\s*[:\.]?\s*(.*)$/i,
      propositos: /^\s*(\d+\s*[\.\)\-]?\s*)?(propósitos|propositos)\s*[:\.]?\s*(.*)$/i,
      objetivos: /^\s*(\d+\s*[\.\)\-]?\s*)?(objetivos(?:\s+de\s+aprendizaje)?)\s*[:\.]?\s*(.*)$/i,
      contenidos: /^\s*(\d+\s*[\.\)\-]?\s*)?(contenidos)\s*[:\.]?\s*(.*)$/i,
      evaluacion: /^\s*(\d+\s*[\.\)\-]?\s*)?(evaluación|evaluacion|criterios\s+de\s+evaluación|instrumentos\s+de\s+evaluación)\s*[:\.]?\s*(.*)$/i
    }
    
    let seccionActual = null
    let inicioSeccion = -1
    let contenidoEnMismaLinea = null
    
    lineas.forEach((linea, idx) => {
      // Detectar inicio de sección
      for (const [seccion, patron] of Object.entries(patrones)) {
        const match = linea.trim().match(patron)
        if (match) {
          // Guardar sección anterior si existe
          if (seccionActual && inicioSeccion >= 0) {
            let textoSeccion = lineas.slice(inicioSeccion, idx).join('\n').trim()
            // Si había contenido en la misma línea del encabezado anterior, agregarlo al inicio
            if (contenidoEnMismaLinea && contenidoEnMismaLinea.length > 0) {
              textoSeccion = contenidoEnMismaLinea + '\n' + textoSeccion
            }
            if (textoSeccion) {
              resultado[seccionActual] = textoSeccion
            }
          }
          // Iniciar nueva sección
          seccionActual = seccion
          // Si hay contenido después de ":" en la misma línea, guardarlo
          const contenidoDespues = match[3] ? match[3].trim() : null
          if (contenidoDespues && contenidoDespues.length > 0) {
            contenidoEnMismaLinea = contenidoDespues
            inicioSeccion = idx + 1 // Empezar desde la siguiente línea (el contenido ya está guardado)
          } else {
            contenidoEnMismaLinea = null
            inicioSeccion = idx + 1 // Empezar después del encabezado
          }
          return
        }
      }
      
    })
    
    // Guardar última sección
    if (seccionActual && inicioSeccion >= 0) {
      let textoSeccion = lineas.slice(inicioSeccion).join('\n').trim()
      // Si había contenido en la misma línea del encabezado, asegurar que esté incluido
      if (contenidoEnMismaLinea && contenidoEnMismaLinea.length > 0) {
        // Si el contenido no está ya en el texto (porque inicioSeccion = idx), agregarlo
        if (!textoSeccion.startsWith(contenidoEnMismaLinea)) {
          textoSeccion = contenidoEnMismaLinea + '\n' + textoSeccion
        }
      }
      if (textoSeccion) {
        resultado[seccionActual] = textoSeccion
      }
    }
    
    return resultado
  }

  // Extraer múltiples fragmentos del texto de insumos (ventana deslizante)
  const extraerExtractos = (texto) => {
    if (!texto || !texto.trim()) return []
    
    // Dividir en líneas y limpiar
    const lineas = texto.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
    
    if (lineas.length === 0) return []
    
    // Filtrar líneas inválidas
    const palabrasClaveEncabezados = [
      "escuela", "provincia", "año", "pagina", "página", 
      "n°", "resolución", "decreto", "ministerio", 
      "argentina", "nivel", "fecha"
    ]
    
    const patronesAdmin = [
      "programa", "planificación", "escuela", "materia", 
      "curso", "división", "profesora", "profesor", "ciclo lectivo"
    ]
    
    const lineasValidas = lineas.filter(linea => {
      // Descartar si < 40 caracteres útiles
      if (contarCaracteresUtiles(linea) < 40) return false
      
      // Filtrar líneas con >70% mayúsculas SOLO si <120 caracteres
      if (linea.length < 120) {
        const letras = linea.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/g) || []
        if (letras.length > 0) {
          const mayusculas = linea.match(/[A-ZÁÉÍÓÚÑ]/g) || []
          const porcentajeMayusculas = mayusculas.length / letras.length
          if (porcentajeMayusculas > 0.7) return false
        }
      }
      
      // Filtrar patrones administrativos
      const lineaLower = linea.toLowerCase()
      if (patronesAdmin.some(patron => 
        lineaLower.startsWith(patron) || 
        lineaLower.includes(` ${patron} `) ||
        lineaLower.includes(` ${patron}:`)
      )) return false
      
      // Descartar encabezados/pies (case-insensitive)
      if (palabrasClaveEncabezados.some(palabra => lineaLower.includes(palabra))) {
        return false
      }
      
      return true
    })
    
    if (lineasValidas.length === 0) {
      // Fallback: usar método simple si no hay líneas válidas
      const textoSimple = lineas.slice(0, 3).join(' ')
      if (contarCaracteresUtiles(textoSimple) >= 80) {
        return [textoSimple.substring(0, 350)]
      }
      return []
    }
    
    // Agrupar en fragmentos con ventana deslizante (i++)
    const fragmentos = []
    for (let i = 0; i < lineasValidas.length; i++) {
      const grupo = lineasValidas.slice(i, i + 3).join(' ')
      // Validar fragmento: >= 80 caracteres útiles (filtro fuerte)
      if (grupo && typeof grupo === 'string' && contarCaracteresUtiles(grupo) >= 80) {
        const fragmento = grupo.substring(0, 350)
        if (fragmento && typeof fragmento === 'string' && fragmento.length >= 20) {
          fragmentos.push(fragmento)
        }
      }
    }
    
    // Deduplicación antes de retornar
    const fragmentosUnicos = []
    const firmasVistas = new Set()
    
    fragmentos.forEach(frag => {
      const firma = crearFirmaNormalizada(frag)
      if (firma && !firmasVistas.has(firma)) {
        firmasVistas.add(firma)
        fragmentosUnicos.push(frag)
      }
    })
    
    // Retornar 8-15 candidatos válidos
    return fragmentosUnicos
      .slice(0, 15)
      .filter(f => f && typeof f === 'string' && f.length >= 20)
  }

  // Generar bloques de texto con ventana deslizante (segmentación blanda)
  const generarBloques = (texto, windowLines = 4, minUtilesBloque = 120, maxCharsBloque = 450, maxBloquesPorFuente = 60) => {
    if (!texto || typeof texto !== 'string' || !texto.trim()) return []
    
    // Dividir en líneas y limpiar vacías
    const lineas = texto.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
    
    if (lineas.length === 0) return []
    
    // Patrones administrativos a filtrar
    const patronesAdmin = [
      "programa", "planificación", "escuela", "materia", 
      "curso", "división", "profesora", "profesor", "ciclo lectivo"
    ]
    
    const palabrasClaveEncabezados = [
      "escuela", "provincia", "año", "pagina", "página", 
      "n°", "resolución", "decreto", "ministerio", 
      "argentina", "nivel", "fecha"
    ]
    
    // Filtrar líneas administrativas y basura
    const lineasValidas = lineas.filter(linea => {
      if (!linea || typeof linea !== 'string') return false
      
      // Descartar si < 40 caracteres útiles
      if (contarCaracteresUtiles(linea) < 40) return false
      
      // Filtrar líneas con >70% mayúsculas SOLO si <120 caracteres (ajuste 3 y 4)
      if (linea.length < 120) {
        const letras = linea.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/g) || []
        if (letras.length > 0) {
          const mayusculas = linea.match(/[A-ZÁÉÍÓÚÑ]/g) || []
          const porcentajeMayusculas = mayusculas.length / letras.length
          if (porcentajeMayusculas > 0.7) return false
        }
      }
      
      // Filtrar patrones administrativos
      const lineaLower = linea.toLowerCase()
      if (patronesAdmin.some(patron => 
        lineaLower.startsWith(patron) || 
        lineaLower.includes(` ${patron} `) ||
        lineaLower.includes(` ${patron}:`)
      )) return false
      
      // Descartar encabezados/pies (case-insensitive)
      if (palabrasClaveEncabezados.some(palabra => lineaLower.includes(palabra))) {
        return false
      }
      
      return true
    })
    
    if (lineasValidas.length === 0) return []
    
    // Agrupar en bloques con ventana deslizante
    const bloques = []
    for (let i = 0; i < lineasValidas.length; i++) {
      const grupo = lineasValidas.slice(i, i + windowLines).join(' ')
      
      // Validar bloque: >= minUtilesBloque caracteres útiles
      if (grupo && typeof grupo === 'string' && contarCaracteresUtiles(grupo) >= minUtilesBloque) {
        const bloque = grupo.substring(0, maxCharsBloque)
        if (bloque && typeof bloque === 'string' && bloque.length >= 20) {
          bloques.push(bloque)
        }
      }
    }
    
    // Deduplicación por firma normalizada
    const bloquesUnicos = []
    const firmasVistas = new Set()
    
    bloques.forEach(bloque => {
      const firma = crearFirmaNormalizada(bloque)
      if (firma && !firmasVistas.has(firma)) {
        firmasVistas.add(firma)
        bloquesUnicos.push(bloque)
      }
    })
    
    // Retornar hasta maxBloquesPorFuente
    return bloquesUnicos
      .slice(0, maxBloquesPorFuente)
      .filter(b => b && typeof b === 'string' && b.length >= 20)
  }

  // Obtener extractos de insumos con segmentación blanda por zonas
  // Estructura: pools[fuenteKey] = { fundamentacion: [], propositos: [], objetivos: [], contenidos: [], evaluacion: [], neutro: [] }
  const pools = {}
  const origenPorFuente = {}
  const textoPorFuente = {} // Para fallback2 (ajuste 6)
  const metricasPorFuente = {} // { [fuenteKey]: { largo, utiles } }

  const preflightFuente = (fuenteKey, fuente, raw) => {
    const rawSafe = typeof raw === 'string' ? raw : ''
    const largo = rawSafe.trim().length
    const utiles = contarCaracteresUtiles(rawSafe)
    const titulo = fuente?.subtitulo || fuente?.titulo || ''
    const tipo = fuente?.tipo || ''

    console.log("[SRC]", { fuente: fuenteKey, titulo, tipo, largo, utiles })

    if (utiles < 200 || largo < 300) {
      console.log("[SRC-WARN]", { fuente: fuenteKey, motivo: "texto insuficiente o no extraíble" })
    }

    // Detección .DOC no soportado (no docx)
    if (typeof titulo === 'string') {
      const lower = titulo.toLowerCase()
      if (lower.endsWith('.doc') && !lower.endsWith('.docx')) {
        warnings.push({
          titulo,
          motivo: "Archivo .DOC (Word viejo) no se puede leer bien. Convertir a .DOCX."
        })
      }
    }

    metricasPorFuente[fuenteKey] = { largo, utiles }
  }
  
  // Procesar programa
  if (insumos.programa) {
    const textoPrograma = insumos.programa.textoExtraido?.trim() || insumos.programa.texto?.trim()
    if (textoPrograma) {
      const fuenteKey = 'programa_none'
      textoPorFuente[fuenteKey] = textoPrograma // Guardar texto para fallback2

      preflightFuente(fuenteKey, { tipo: 'programa', titulo: 'Programa (insumo)', subtitulo: insumos.programa.fileRef?.nombre || '' }, textoPrograma)
      
      // Inicializar pools para esta fuente
      pools[fuenteKey] = {
        fundamentacion: [],
        propositos: [],
        objetivos: [],
        contenidos: [],
        evaluacion: [],
        neutro: []
      }
      
      // Generar bloques
      const bloques = generarBloques(textoPrograma)
      
      // Clasificar cada bloque y agregar al pool correspondiente (ajuste 1: guardar strings, no objetos)
      bloques.forEach(bloque => {
        if (bloque && typeof bloque === 'string') {
          const tipo = clasificarBloque(bloque)
          if (pools[fuenteKey][tipo]) {
            pools[fuenteKey][tipo].push(bloque)
          }
        }
      })
      
      // Debug: Log de pools
      console.log("[POOL]", {
        fuente: fuenteKey,
        fundamentacion: pools[fuenteKey].fundamentacion.length,
        propositos: pools[fuenteKey].propositos.length,
        objetivos: pools[fuenteKey].objetivos.length,
        contenidos: pools[fuenteKey].contenidos.length,
        evaluacion: pools[fuenteKey].evaluacion.length,
        neutro: pools[fuenteKey].neutro.length
      })
      
      origenPorFuente['programa'] = obtenerOrigenTexto(insumos.programa)
    }
  }
  
  // Procesar modelo
  if (insumos.modelo) {
    const textoModelo = insumos.modelo.textoExtraido?.trim() || insumos.modelo.texto?.trim()
    if (textoModelo) {
      const fuenteKey = 'modelo_none'
      textoPorFuente[fuenteKey] = textoModelo // Guardar texto para fallback2

      preflightFuente(fuenteKey, { tipo: 'modelo', titulo: 'Modelo de planificación (insumo)', subtitulo: insumos.modelo.fileRef?.nombre || '' }, textoModelo)
      
      // Inicializar pools para esta fuente
      pools[fuenteKey] = {
        fundamentacion: [],
        propositos: [],
        objetivos: [],
        contenidos: [],
        evaluacion: [],
        neutro: []
      }
      
      // Generar bloques
      const bloques = generarBloques(textoModelo)
      
      // Clasificar cada bloque y agregar al pool correspondiente (ajuste 1: guardar strings, no objetos)
      bloques.forEach(bloque => {
        if (bloque && typeof bloque === 'string') {
          const tipo = clasificarBloque(bloque)
          if (pools[fuenteKey][tipo]) {
            pools[fuenteKey][tipo].push(bloque)
          }
        }
      })
      
      // Debug: Log de pools
      console.log("[POOL]", {
        fuente: fuenteKey,
        fundamentacion: pools[fuenteKey].fundamentacion.length,
        propositos: pools[fuenteKey].propositos.length,
        objetivos: pools[fuenteKey].objetivos.length,
        contenidos: pools[fuenteKey].contenidos.length,
        evaluacion: pools[fuenteKey].evaluacion.length,
        neutro: pools[fuenteKey].neutro.length
      })
      
      origenPorFuente['modelo'] = obtenerOrigenTexto(insumos.modelo)
    }
  }
  
  // Procesar adicionales
  if (insumos.adicionales) {
    insumos.adicionales.forEach(adicional => {
      if (adicional.usarComoFuente) {
        const textoAdicional = adicional.textoExtraido?.trim() || adicional.texto?.trim()
        if (textoAdicional) {
          const fuenteKey = `adicional_${adicional.id}`
          textoPorFuente[fuenteKey] = textoAdicional // Guardar texto para fallback2

          preflightFuente(
            fuenteKey,
            { tipo: 'adicional', titulo: adicional.titulo || 'Insumo adicional (sin título)', subtitulo: adicional.fileRef?.nombre || '' },
            textoAdicional
          )
          
          // Inicializar pools para esta fuente
          pools[fuenteKey] = {
            fundamentacion: [],
            propositos: [],
            objetivos: [],
            contenidos: [],
            evaluacion: [],
            neutro: []
          }
          
          // Generar bloques
          const bloques = generarBloques(textoAdicional)
          
          // Clasificar cada bloque y agregar al pool correspondiente (ajuste 1: guardar strings, no objetos)
          bloques.forEach(bloque => {
            if (bloque && typeof bloque === 'string') {
              const tipo = clasificarBloque(bloque)
              if (pools[fuenteKey][tipo]) {
                pools[fuenteKey][tipo].push(bloque)
              }
            }
          })
          
          // Debug: Log de pools
          console.log("[POOL]", {
            fuente: fuenteKey,
            fundamentacion: pools[fuenteKey].fundamentacion.length,
            propositos: pools[fuenteKey].propositos.length,
            objetivos: pools[fuenteKey].objetivos.length,
            contenidos: pools[fuenteKey].contenidos.length,
            evaluacion: pools[fuenteKey].evaluacion.length,
            neutro: pools[fuenteKey].neutro.length
          })
          
          origenPorFuente[`adicional_${adicional.id}`] = obtenerOrigenTexto(adicional)
        }
      }
    })
  }

  // Helper para obtener fragmentos de una fuente y sección (siempre retorna array válido)
  // Ajuste 2: tomar candidatos de pools, ordenar por scoreSeccionBloque DESC, devolver strings
  const obtenerFragmentos = (fuente, seccion) => {
    if (!fuente || !fuente.tipo) return []
    if (!seccion || typeof seccion !== 'string') return []
    
    const key = obtenerKeyFuente(fuente)
    // Normalizar sección: quitar tildes y convertir a lowercase
    const seccionNormalizada = seccion.toLowerCase()
      .replace(/ó/g, 'o').replace(/á/g, 'a').replace(/é/g, 'e')
      .replace(/í/g, 'i').replace(/ú/g, 'u')
    
    // Primero: buscar en pools[fuenteKey][seccion]
    if (pools[key] && pools[key][seccionNormalizada] && Array.isArray(pools[key][seccionNormalizada])) {
      const candidatos = pools[key][seccionNormalizada]
        .filter(b => b && typeof b === 'string' && b.trim().length > 0)
      
      if (candidatos.length > 0) {
        // Ordenar por scoreSeccionBloque DESC (ajuste 2)
        const candidatosOrdenados = candidatos.sort((a, b) => {
          const scoreA = scoreSeccionBloque(a, seccionNormalizada)
          const scoreB = scoreSeccionBloque(b, seccionNormalizada)
          return scoreB - scoreA
        })
        return candidatosOrdenados
      }
    }
    
    // Fallback1: buscar en pools[fuenteKey].neutro (ajuste 2)
    if (pools[key] && pools[key]['neutro'] && Array.isArray(pools[key]['neutro'])) {
      const candidatos = pools[key]['neutro']
        .filter(b => b && typeof b === 'string' && b.trim().length > 0)
      
      if (candidatos.length > 0) {
        // Solo aceptar neutro si el score por sección es aceptable (>= 8)
        const candidatosAceptables = candidatos.filter(b => scoreSeccionBloque(b, seccionNormalizada) >= 8)
        if (candidatosAceptables.length > 0) {
          const candidatosOrdenados = candidatosAceptables.sort((a, b) => {
            const scoreA = scoreSeccionBloque(a, seccionNormalizada)
            const scoreB = scoreSeccionBloque(b, seccionNormalizada)
            return scoreB - scoreA
          })
          return candidatosOrdenados
        }
      }
    }
    
    // Si no hay nada aceptable, NO ir al global (evita "delira / repite en todas las pestañas")
    // Fallback global SOLO si el texto es útil (utiles >= 500)
    const utiles = metricasPorFuente[key]?.utiles || 0
    if (utiles >= 500 && textoPorFuente[key]) {
      const fragmentos = extraerExtractos(textoPorFuente[key])
      if (Array.isArray(fragmentos) && fragmentos.length > 0) {
        return fragmentos.filter(f => f && typeof f === 'string' && f.trim().length > 0)
      }
    }
    
    return []
  }

  // Helper para obtener origen de una fuente
  const obtenerOrigenFuente = (fuente) => {
    if (fuente.tipo === 'programa') {
      return origenPorFuente['programa']
    }
    if (fuente.tipo === 'modelo') {
      return origenPorFuente['modelo']
    }
    if (fuente.tipo === 'adicional') {
      return origenPorFuente[`adicional_${fuente.id}`]
    }
    return null
  }

  // Keywords por sección para afinado semántico
  const keywordsPorSeccion = {
    fundamentacion: ["contexto", "marco", "fundamenta", "propósito", "sentido"],
    propositos: ["propósito", "finalidad", "pretende", "busca"],
    objetivos: ["objetivo", "desarrollar", "lograr", "adquirir"],
    contenidos: ["contenido", "unidad", "eje", "tema", "saber"],
    evaluacion: ["evaluación", "criterio", "instrumento", "acreditación"]
  }

  // Prioridad de tipos (para desempate en tipoFragmento)
  const prioridadTipos = {
    evaluacion: 1,
    objetivos: 2,
    contenidos: 3,
    propositos: 4,
    fundamentacion: 5,
    neutro: 6
  }

  // Clasificar fragmento por tipo usando scoring
  const tipoFragmento = (fragmento) => {
    if (!fragmento || typeof fragmento !== 'string') return 'neutro'
    
    const fragmentoLower = fragmento.toLowerCase()
    
    // Keywords por tipo (expandidas con términos frecuentes)
    const keywordsPorTipo = {
      objetivos: [
        "lograr", "desarrollar", "promover", "favorecer", "adquirir", 
        "comprender", "aplicar", "identificar", "analizar", "resolver", 
        "argumentar", "se espera", "al finalizar", "será capaz",
        "capacidades", "competencias", "alcanzar", "desempeños"
      ],
      evaluacion: [
        "evaluación", "criterios", "instrumentos", "evidencias", 
        "acreditación", "calificación", "rúbrica", "lista de cotejo", 
        "observación", "trabajos prácticos", "examen",
        "evaluará", "instancias", "formativa", "sumativa", "criterios de evaluación"
      ],
      contenidos: [
        "contenidos", "unidad", "eje", "tema", "saberes", 
        "secuencia", "bloque", "número", "proporcionalidad", "funciones",
        "ejes", "núcleo", "progresión"
      ],
      fundamentacion: [
        "se fundamenta", "marco", "contexto", "sentido", 
        "propósito general", "justificación", "enfoque", "importancia",
        "marco teórico", "se inscribe", "se enmarca"
      ],
      propositos: [
        "propósitos", "finalidad", "se propone", "pretende", 
        "busca", "intencionalidad",
        "intención", "orienta"
      ]
    }
    
    // Calcular score por tipo
    const scoresPorTipo = {}
    Object.keys(keywordsPorTipo).forEach(tipo => {
      const keywords = keywordsPorTipo[tipo]
      const matches = keywords.filter(kw => fragmentoLower.includes(kw)).length
      scoresPorTipo[tipo] = matches * 2 // +2 por match
    })
    
    // Encontrar tipo con score máximo
    const tiposConScore = Object.entries(scoresPorTipo)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => {
        // Ordenar por score descendente
        if (b[1] !== a[1]) return b[1] - a[1]
        // Si empate, usar prioridad: evaluacion → objetivos → contenidos → propositos → fundamentacion
        return prioridadTipos[a[0]] - prioridadTipos[b[0]]
      })
    
    // Si hay tipos con score > 0, retornar el primero
    if (tiposConScore.length > 0) {
      return tiposConScore[0][0]
    }
    
    // Si score total = 0, retornar neutro
    return 'neutro'
  }

  // Helper para obtener key de fuente
  const obtenerKeyFuente = (fuente) => {
    if (!fuente || !fuente.tipo) return 'unknown'
    return `${fuente.tipo}_${fuente.id || 'none'}`
  }

  // Helper para verificar si fragmento está usado
  const estaUsado = (fragmento, fuente, mapUsados) => {
    if (!fragmento || typeof fragmento !== 'string') return false
    const key = obtenerKeyFuente(fuente)
    const firmasUsadas = mapUsados.get(key) || new Set()
    const firma = crearFirmaNormalizada(fragmento)
    return firmasUsadas.has(firma)
  }

  // Helper para marcar como usado
  const marcarComoUsado = (fragmento, fuente, mapUsados) => {
    if (!fragmento || typeof fragmento !== 'string') return
    const key = obtenerKeyFuente(fuente)
    if (!mapUsados.has(key)) {
      mapUsados.set(key, new Set())
    }
    const firma = crearFirmaNormalizada(fragmento)
    mapUsados.get(key).add(firma)
  }

  // Helper para snippet seguro
  const safeSnippet = (s, n = 50) => {
    if (!s || typeof s !== 'string') return ''
    return s.slice(0, n)
  }

  // Scoring por sección para bloques (segmentación blanda)
  const scoreSeccionBloque = (bloque, seccion) => {
    if (!bloque || typeof bloque !== 'string') return -100
    if (!seccion || typeof seccion !== 'string') return -100
    
    let score = 0
    const bloqueLower = bloque.toLowerCase()
    
    // Keywords por sección (más ricas)
    const keywordsPorSeccion = {
      objetivos: [
        "lograr", "desarrollar", "adquirir", "comprender", "aplicar", 
        "identificar", "analizar", "resolver", "se espera", "al finalizar", 
        "será capaz", "podrá", "estudiantes lograrán", "capacidades", 
        "competencias", "alcanzar", "desempeños"
      ],
      contenidos: [
        "contenidos", "unidad", "eje", "tema", "saberes", "secuencia", 
        "bloque", "unidad n°", "eje", "contenido", "saberes prioritarios",
        "núcleo", "progresión"
      ],
      evaluacion: [
        "evaluación", "criterios", "instrumentos", "evidencias", 
        "acreditación", "calificación", "rúbrica", "lista de cotejo", 
        "observación", "tp", "examen", "trabajo práctico", "evaluará",
        "instancias", "formativa", "sumativa", "criterios de evaluación"
      ],
      propositos: [
        "propósitos", "finalidad", "se propone", "pretende", "busca", 
        "intencionalidad", "se busca que", "intención", "orienta"
      ],
      fundamentacion: [
        "fundamenta", "marco", "contexto", "sentido", "justificación", 
        "enfoque", "importancia", "se fundamenta", "marco teórico", 
        "marco conceptual", "se inscribe", "se enmarca"
      ]
    }
    
    // Frases fuertes (match completo) +10
    const frasesFuertes = {
      objetivos: ["al finalizar", "se espera que", "será capaz de", "estudiantes lograrán"],
      contenidos: ["unidad n°", "saberes prioritarios"],
      evaluacion: ["criterios de evaluación", "instrumentos de evaluación", "trabajo práctico"],
      propositos: ["se propone que", "se busca que"],
      fundamentacion: ["se fundamenta en", "marco teórico", "marco conceptual"]
    }
    
    const keywords = keywordsPorSeccion[seccion] || []
    const frases = frasesFuertes[seccion] || []
    
    // +10 por match fuerte (frases completas)
    const matchesFrases = frases.filter(frase => bloqueLower.includes(frase)).length
    score += matchesFrases * 10
    
    // +4 por match simple (palabras sueltas)
    const matchesKeywords = keywords.filter(kw => bloqueLower.includes(kw)).length
    score += matchesKeywords * 4
    
    // -10 por normativa/administrativo
    const normativaAdmin = [
      "ley", "decreto", "resolución", "expediente", "escuela", 
      "provincia", "página", "ministerio", "boletín", "n°"
    ]
    const matchesNormativa = normativaAdmin.filter(norm => bloqueLower.includes(norm)).length
    score -= matchesNormativa * 10
    
    // -8 si bloque es mayormente metadata (más de 8 dígitos o fechas)
    const digitos = bloque.match(/\d/g) || []
    if (digitos.length > 8) {
      score -= 8
    }
    const fechas = bloque.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g) || []
    if (fechas.length > 2) {
      score -= 8
    }
    
    return score
  }

  // Clasificar bloque por sección (segmentación blanda)
  const clasificarBloque = (bloque, umbralClasif = 12) => {
    if (!bloque || typeof bloque !== 'string') return 'neutro'
    
    const secciones = ['fundamentacion', 'propositos', 'objetivos', 'contenidos', 'evaluacion']
    const scoresPorSeccion = {}
    
    // Calcular score para cada sección
    secciones.forEach(seccion => {
      scoresPorSeccion[seccion] = scoreSeccionBloque(bloque, seccion)
    })
    
    // Encontrar sección con score máximo
    const seccionesConScore = Object.entries(scoresPorSeccion)
      .filter(([_, score]) => score >= umbralClasif)
      .sort((a, b) => {
        // Ordenar por score descendente
        if (b[1] !== a[1]) return b[1] - a[1]
        // Tie-break: evaluacion > objetivos > contenidos > propositos > fundamentacion
        const prioridad = {
          evaluacion: 1,
          objetivos: 2,
          contenidos: 3,
          propositos: 4,
          fundamentacion: 5
        }
        return (prioridad[a[0]] || 999) - (prioridad[b[0]] || 999)
      })
    
    // Si hay sección con score >= umbral, retornarla
    if (seccionesConScore.length > 0) {
      return seccionesConScore[0][0]
    }
    
    // Si no llega al umbral, retornar neutro
    return 'neutro'
  }

  // Scoring por sección (reemplaza priorizarFragmentoPorSeccion)
  const scoreFragmento = (fragmento, seccion) => {
    if (!fragmento || typeof fragmento !== 'string') return -100
    
    let score = 0
    const fragmentoLower = fragmento.toLowerCase()
    
    // +10 si contiene keyword de la sección
    const keywords = keywordsPorSeccion[seccion] || []
    const matchesKeywords = keywords.filter(kw => fragmentoLower.includes(kw)).length
    score += matchesKeywords * 10
    
    // +5 si contiene conectores útiles
    const conectoresUtiles = [
      "se propone", "se espera", "al finalizar", "criterios", 
      "instrumentos", "evaluará", "propósitos", "objetivos", 
      "contenidos", "saberes"
    ]
    const matchesConectores = conectoresUtiles.filter(conn => 
      fragmentoLower.includes(conn)
    ).length
    score += matchesConectores * 5
    
    // -12 por cada match de encabezado/pie (penalización extra)
    // NOTA: "decreto" y "resolución" NO están aquí para evitar doble penalización
    const encabezadosPies = [
      "escuela", "provincia", "página", "ministerio", 
      "boletín", "n°"
    ]
    const matchesEncabezados = encabezadosPies.filter(enc => 
      fragmentoLower.includes(enc)
    ).length
    score -= matchesEncabezados * 12
    
    // -8 si contiene normativa genérica (incluye "decreto" y "resolución")
    const normativaGenerica = [
      "ley", "decreto", "resolución", "artículo", 
      "capítulo", "boletín oficial"
    ]
    const matchesNormativa = normativaGenerica.filter(norm => 
      fragmentoLower.includes(norm)
    ).length
    score -= matchesNormativa * 8
    
    // -5 si tiene exceso de números (más de 8 dígitos totales)
    const digitos = fragmento.match(/\d/g) || []
    if (digitos.length > 8) {
      score -= 5
    }
    
    // -5 si tiene muchas fechas (patrón DD/MM/YYYY o YYYY-MM-DD)
    const fechas = fragmento.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g) || []
    if (fechas.length > 2) {
      score -= 5
    }
    
    return score
  }

  // Offset por tipo de fuente para rotación
  const offsetPorFuente = {
    programa: 0,
    modelo: 1,
    adicional: 2
  }

  // Maps para anti-repetición (scope superior, no se resetean)
  const usadosPorFuenteContenido = new Map() // key: `${fuente.tipo}_${fuente.id || 'none'}`, value: Set de firmas
  const usadosPorFuenteEvidencia = new Map() // igual para evidencia

  // Generar evidencia por sección con scoring y clasificación por tipo
  const ordenSecciones = ['fundamentacion', 'propositos', 'objetivos', 'contenidos', 'evaluacion']
  const evidencia = []

  ordenSecciones.forEach((seccion, seccionIndex) => {
    // Normalizar nombre de sección
    const seccionNormalizada = seccion.toLowerCase()
      .replace(/ó/g, 'o').replace(/á/g, 'a').replace(/é/g, 'e')
      .replace(/í/g, 'i').replace(/ú/g, 'u')
    
    // Para cada fuente, seleccionar fragmento por scoring de ESA sección
    fuentesUsables.forEach(fuente => {
      const fragmentos = obtenerFragmentos(fuente, seccionNormalizada)
      const origen = obtenerOrigenFuente(fuente)
      
      // Validar array y que tenga elementos válidos
      if (!Array.isArray(fragmentos) || fragmentos.length === 0 || !origen) {
        return // Saltar si no hay fragmentos
      }
      
      // Filtrar solo fragmentos válidos (>= 80 caracteres útiles)
      const fragmentosValidos = fragmentos.filter(f => 
        f && typeof f === 'string' && f.trim().length > 0 && contarCaracteresUtiles(f) >= 80
      )
      
      // Debug: Log si no hay fragmentos válidos
      if (fragmentosValidos.length === 0) {
        const fuenteKey = obtenerKeyFuente(fuente)
        console.log("[SEL-NONE-EVID]", {
          fuente: fuenteKey,
          seccion: seccion,
          motivo: "sin fragmentos válidos tras filtros"
        })
        return
      }
      
      // Los fragmentos ya vienen ordenados por scoreSeccionBloque DESC desde obtenerFragmentos()
      // Seleccionar TOP1, si está usado usar TOP2, etc. (anti-repetición)
      const keyEvidencia = `${obtenerKeyFuente(fuente)}__${seccionNormalizada}`
      const firmasUsadasEvidencia = usadosPorFuenteEvidencia.get(keyEvidencia) || new Set()
      
      let fragmentoSeleccionado = null
      for (const bloque of fragmentosValidos) {
        const firma = crearFirmaNormalizada(bloque)
        if (firma && firma.length > 0 && !firmasUsadasEvidencia.has(firma)) {
          fragmentoSeleccionado = bloque
          break
        }
      }
      
      // Si todos están usados, usar el mejor disponible (TOP1)
      if (!fragmentoSeleccionado && fragmentosValidos.length > 0) {
        fragmentoSeleccionado = fragmentosValidos[0]
      }
      
      // Validar fragmento final antes de agregar
      if (fragmentoSeleccionado && typeof fragmentoSeleccionado === 'string' && 
          contarCaracteresUtiles(fragmentoSeleccionado) >= 80) {
        // Debug: Log de fragmento seleccionado
        const fuenteKeyEvidenciaFinal = obtenerKeyFuente(fuente)
        console.log("[SEL-FINAL-EVID]", {
          fuente: fuenteKeyEvidenciaFinal,
          seccion: seccion,
          fragmento: fragmentoSeleccionado?.slice(0, 200)
        })
        
        // Debug: Log [PICK-EVID]
        console.log("[PICK-EVID]", {
          fuente: fuenteKeyEvidenciaFinal,
          seccion: seccion,
          bloque: fragmentoSeleccionado?.slice(0, 120),
          score: scoreSeccionBloque(fragmentoSeleccionado, seccion)
        })
        
        evidencia.push({
          seccion,
          fuente: {
            tipo: fuente.tipo,
            id: fuente.id,
            titulo: fuente.titulo
          },
          fragmento: `"${fragmentoSeleccionado}"`,
          pagina: fuente.tipo === 'programa' ? 'p. 3' : fuente.tipo === 'modelo' ? 'p. 1' : 'p. 2',
          origen: origen || 'pegado',
          confidence: 'alta', // Mantener alta para fragmentos reales
          requiere_revision: true
        })
        
        // Marcar como usado con key específica por sección
        const keyEvidencia = `${obtenerKeyFuente(fuente)}__${seccionNormalizada}`
        if (!usadosPorFuenteEvidencia.has(keyEvidencia)) {
          usadosPorFuenteEvidencia.set(keyEvidencia, new Set())
        }
        const firma = crearFirmaNormalizada(fragmentoSeleccionado)
        if (firma && firma.length > 0) { // Ajuste 5: solo marcar si firma no vacía
          usadosPorFuenteEvidencia.get(keyEvidencia).add(firma)
        }
      }
    })
  })

  // Generar contenido mock por sección usando extractos reales (con clasificación por tipo y anti-repetición)
  const generarContenidoSeccion = (seccion, fuentes, usadosPorFuenteContenido) => {
    const nombresFuentes = fuentes.map(f => f.titulo).join(', ')
    
    // Normalizar nombre de sección
    const seccionNormalizada = seccion.toLowerCase()
      .replace(/ó/g, 'o').replace(/á/g, 'a').replace(/é/g, 'e')
      .replace(/í/g, 'i').replace(/ú/g, 'u')
    
    // Intentar usar extractos reales de las fuentes con origen (TOP1 por fuente)
    const extractosUsados = []
    const fragmentosMostrados = new Set()
    
    fuentes.forEach(fuente => {
      // Obtener fragmentos de ESA sección (no globales)
      const fragmentos = obtenerFragmentos(fuente, seccionNormalizada)
      const origen = obtenerOrigenFuente(fuente)
      
      // Validar array y que tenga elementos válidos
      if (!Array.isArray(fragmentos) || fragmentos.length === 0 || !origen) {
        return
      }
      
      // Filtrar solo fragmentos válidos (>= 80 caracteres útiles)
      const fragmentosValidos = fragmentos.filter(f => 
        f && typeof f === 'string' && f.trim().length > 0 && contarCaracteresUtiles(f) >= 80
      )
      
      // Debug: Log si no hay fragmentos válidos
      if (fragmentosValidos.length === 0) {
        const fuenteKey = obtenerKeyFuente(fuente)
        console.log("[SEL-NONE-CONT]", {
          fuente: fuenteKey,
          seccion: seccion,
          motivo: "sin fragmentos válidos tras filtros"
        })
        return
      }
      
      // Los fragmentos ya vienen ordenados por scoreSeccionBloque DESC desde obtenerFragmentos()
      // Seleccionar TOP1, si está usado usar TOP2, etc. (anti-repetición)
      const keyContenido = `${obtenerKeyFuente(fuente)}__${seccionNormalizada}`
      const firmasUsadasContenido = usadosPorFuenteContenido.get(keyContenido) || new Set()
      
      let mejorFragmento = null
      for (const bloque of fragmentosValidos) {
        const firma = crearFirmaNormalizada(bloque)
        if (firma && firma.length > 0 && !firmasUsadasContenido.has(firma)) {
          mejorFragmento = bloque
          break
        }
      }
      
      // Si todos están usados, usar el mejor disponible (TOP1)
      if (!mejorFragmento && fragmentosValidos.length > 0) {
        mejorFragmento = fragmentosValidos[0]
      }
      
      // Validar fragmento antes de usar
      if (mejorFragmento && typeof mejorFragmento === 'string') {
        // Debug: Log de fragmento seleccionado
        const fuenteKeyContenidoFinal = obtenerKeyFuente(fuente)
        console.log("[SEL-FINAL-CONT]", {
          fuente: fuenteKeyContenidoFinal,
          seccion: seccion,
          fragmento: mejorFragmento?.slice(0, 200)
        })
        
        // Debug: Log [PICK-CONT]
        console.log("[PICK-CONT]", {
          fuente: fuenteKeyContenidoFinal,
          seccion: seccion,
          bloque: mejorFragmento?.slice(0, 120),
          score: scoreSeccionBloque(mejorFragmento, seccion)
        })
        
        const fragmentoKey = `${fuente.tipo}_${fuente.id || 'none'}_${safeSnippet(mejorFragmento, 50)}`
        
        if (!fragmentosMostrados.has(fragmentoKey)) {
          fragmentosMostrados.add(fragmentoKey)
          const origenFormateado = formatearOrigen(origen)
          const tituloFuente = fuente.tipo === 'adicional' 
            ? `Adicional: ${fuente.titulo}` 
            : fuente.titulo
          extractosUsados.push(`"${mejorFragmento}" — ${tituloFuente} (${origenFormateado})`)
          
          // Marcar como usado con key específica por sección (ajuste 5: Map con firmas)
          const keyContenido = `${obtenerKeyFuente(fuente)}__${seccionNormalizada}`
          if (!usadosPorFuenteContenido.has(keyContenido)) {
            usadosPorFuenteContenido.set(keyContenido, new Set())
          }
          const firma = crearFirmaNormalizada(mejorFragmento)
          if (firma && firma.length > 0) { // Ajuste 5: solo marcar si firma no vacía
            usadosPorFuenteContenido.get(keyContenido).add(firma)
          }
        }
      }
    })

    let contenido = `Esta ${seccion} ha sido generada a partir de los siguientes insumos: ${nombresFuentes}.\n\n`
    
    if (extractosUsados.length > 0) {
      contenido += `Extractos relevantes de las fuentes:\n${extractosUsados.map(e => `• ${e}`).join('\n')}\n\n`
    } else {
      contenido += `No se encontraron extractos relevantes para esta sección en los insumos cargados. (Sugerencia: subir una planificación real en DOCX/PDF con texto).\n\n`
    }
    
    contenido += `El contenido se basa en los documentos curriculares y modelos proporcionados, adaptándose a las características del curso y los objetivos planteados.\n\n[Este es un borrador generado por IA que requiere revisión y ajuste por parte del docente.]`
    
    return contenido
  }

  // Generar unidades (similar a la estructura existente)
  const unidades = []
  const semanasPorUnidad = 4
  for (let u = 1; u <= 4; u++) {
    const semanas = []
    for (let s = 1; s <= semanasPorUnidad; s++) {
      semanas.push({
        id: Date.now() + (u * 10000) + (s * 100),
        semanaNro: (u - 1) * semanasPorUnidad + s,
        contenidos: `Contenidos de la semana ${s} de la Unidad ${u} (generado desde insumos).`,
        actividades: `Actividades sugeridas para la semana ${s} de la Unidad ${u}.`,
        recursos: `Recursos necesarios para la semana ${s} de la Unidad ${u}.`,
        evaluacion: `Criterios de evaluación para la semana ${s} de la Unidad ${u}.`,
        adaptaciones: ''
      })
    }
    unidades.push({
      id: Date.now() + (u * 100000),
      titulo: `Unidad ${u}`,
      semanas
    })
  }

  return {
    planificacion: {
      fundamentacion: generarContenidoSeccion('fundamentación', fuentesUsables, usadosPorFuenteContenido),
      propositos: generarContenidoSeccion('propósitos', fuentesUsables, usadosPorFuenteContenido),
      objetivos: generarContenidoSeccion('objetivos', fuentesUsables, usadosPorFuenteContenido),
      contenidos: generarContenidoSeccion('contenidos', fuentesUsables, usadosPorFuenteContenido),
      evaluacion: generarContenidoSeccion('evaluación', fuentesUsables, usadosPorFuenteContenido),
      bibliografia,
      unidades
    },
    evidencia,
    fuentesUsadas: fuentesUsables,
    warnings,
    generadoEn: new Date().toISOString(),
    requiere_revision: true
  }
}
