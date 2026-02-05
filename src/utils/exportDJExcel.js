import { DJ_TEMPLATE_MAP, MAPA_DIA_COLUMNA } from '../templates/djTemplateMap'
import { mapearSituacionRevista } from './dj'

/**
 * Carga la plantilla XLSX desde public/plantillas/
 * @returns {Promise<ArrayBuffer>} Buffer de la plantilla
 */
async function cargarPlantilla() {
  const url = `${import.meta.env.BASE_URL}plantillas/DJ_OFICIAL.xlsx`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `No se pudo cargar la plantilla DJ_OFICIAL.xlsx (HTTP ${res.status}). ` +
      `Verificá que exista en public/plantillas/.`
    )
  }
  const buf = await res.arrayBuffer()

  // Guard rail: si vino HTML (routing) en lugar de XLSX
  const head = new TextDecoder().decode(buf.slice(0, 100)).toLowerCase()
  if (head.includes('<!doctype') || head.includes('<html')) {
    throw new Error(
      'La plantilla no se cargó como XLSX: la URL devolvió HTML (routing). ' +
      'Verificá que el archivo esté en public/plantillas/DJ_OFICIAL.xlsx.'
    )
  }

  return buf
}

/**
 * Normaliza horario extrayendo solo el rango "HH:MM a HH:MM"
 * @param {string} valor - Puede venir como "Proy ... 17:30 a 21:40", "13 a 17:30", "09:40 a 11:40"
 * @returns {string|null} - "17:30 a 21:40", "13:00 a 17:30", "09:40 a 11:40" o null si no detecta rango
 */
function normalizarHorario(valor) {
  if (!valor || typeof valor !== 'string') {
    return null
  }

  // Regex para detectar rango horario: HH:MM a HH:MM o HH a HH:MM
  const match = valor.match(/(\d{1,2})(?::(\d{2}))?\s*a\s*(\d{1,2})(?::(\d{2}))?/i)
  if (!match) {
    return null
  }

  // Extraer componentes
  const horaDesde = parseInt(match[1], 10)
  const minDesde = match[2] ? parseInt(match[2], 10) : 0
  const horaHasta = parseInt(match[3], 10)
  const minHasta = match[4] ? parseInt(match[4], 10) : 0

  // Normalizar: HH con 2 dígitos, minutos con 2 dígitos
  const desde = `${horaDesde.toString().padStart(2, '0')}:${minDesde.toString().padStart(2, '0')}`
  const hasta = `${horaHasta.toString().padStart(2, '0')}:${minHasta.toString().padStart(2, '0')}`

  return `${desde} a ${hasta}`
}

/**
 * Genera nombre de archivo sanitizado
 * @param {string} cicloLectivo 
 * @param {string} fecha DD-MM-YYYY
 * @returns {string} DJ_2025_31-01-2025.xlsx
 */
function generarNombreArchivo(cicloLectivo, fecha) {
  // Sanitizar: remover caracteres inválidos para nombres de archivo
  const sanitizar = (str) => str.replace(/[<>:"/\\|?*]/g, '_').trim()
  
  const cicloSanitizado = sanitizar(cicloLectivo.toString())
  const fechaSanitizada = sanitizar(fecha)
  
  return `DJ_${cicloSanitizado}_${fechaSanitizada}.xlsx`
}

/**
 * Valida que el perfil esté completo y retorna campos faltantes
 * @param {Object} docente 
 * @returns {Object} { valido: boolean, camposFaltantes: string[] }
 */
function validarPerfilParaExportar(docente) {
  const camposFaltantes = []
  
  if (!docente.nombre || !docente.nombre.trim()) camposFaltantes.push('Nombre')
  if (!docente.dni || !docente.dni.trim()) camposFaltantes.push('DNI')
  if (!docente.domicilio || !docente.domicilio.trim()) camposFaltantes.push('Domicilio')
  if (!docente.telefono || !docente.telefono.trim()) camposFaltantes.push('Teléfono')
  if (!docente.email || !docente.email.trim()) camposFaltantes.push('Email')
  if (!docente.cicloLectivo || !docente.cicloLectivo.toString().trim()) camposFaltantes.push('Ciclo lectivo')
  
  return {
    valido: camposFaltantes.length === 0,
    camposFaltantes
  }
}

/**
 * Valida que no haya cargos incompletos y retorna detalles
 * @param {Array} filas 
 * @returns {Object} { valido: boolean, cargosIncompletos: Array }
 */
function validarCargosParaExportar(filas) {
  const cargosIncompletos = filas.filter(fila => {
    // Un cargo está incompleto si falta alguno de estos campos
    return fila.incompleto === true || 
           !fila.situacionRevista || 
           !fila.tipoCarga || 
           fila.cantidadCarga === null || 
           fila.cantidadCarga === undefined
  })
  
  return {
    valido: cargosIncompletos.length === 0,
    cargosIncompletos: cargosIncompletos.map(f => ({
      cargo: f.cargo,
      escuela: f.distritoServicioEducativo
    }))
  }
}

/**
 * Exporta DJ a Excel usando plantilla oficial
 * @param {Object} djSnapshotGlobal - Snapshot de buildDJGlobal()
 * @returns {Promise<void>}
 * @throws {Error} Si hay validaciones fallidas o error en exportación
 */
export async function exportarDJExcel(djSnapshotGlobal) {
  // Validar que el mapa esté completo
  if (!DJ_TEMPLATE_MAP.sheetName || !DJ_TEMPLATE_MAP.tabla.ROW_START || !DJ_TEMPLATE_MAP.tabla.MAX_FILAS) {
    throw new Error('El mapa de celdas no está configurado. Contactá al desarrollador.')
  }

  // Validar perfil completo
  const validacionPerfil = validarPerfilParaExportar(djSnapshotGlobal.docente)
  if (!validacionPerfil.valido) {
    throw new Error(`Perfil incompleto. Faltan: ${validacionPerfil.camposFaltantes.join(', ')}`)
  }

  // Validar cargos completos
  const validacionCargos = validarCargosParaExportar(djSnapshotGlobal.filas)
  if (!validacionCargos.valido) {
    throw new Error(
      `Hay ${validacionCargos.cargosIncompletos.length} cargo(s) incompleto(s). ` +
      `Completá: Situación de revista, Tipo de carga y Cantidad de carga.`
    )
  }

  // Validar límite de filas
  if (djSnapshotGlobal.filas.length > DJ_TEMPLATE_MAP.MAX_FILAS) {
    throw new Error(
      `La plantilla solo admite ${DJ_TEMPLATE_MAP.MAX_FILAS} cargos. ` +
      `Tienes ${djSnapshotGlobal.filas.length} cargos. ` +
      `Eliminá algunos cargos o contactá soporte para ampliar la plantilla.`
    )
  }

  // Cargar ExcelJS dinámicamente (para no romper build si no está instalado)
  let ExcelJS
  try {
    ExcelJS = (await import('exceljs')).default
  } catch (error) {
    throw new Error('ExcelJS no está instalado. Ejecutá: npm install exceljs')
  }

  // Cargar plantilla
  const buffer = await cargarPlantilla()

  // Cargar workbook
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  // Obtener worksheet por nombre
  const worksheet = workbook.getWorksheet(DJ_TEMPLATE_MAP.sheetName)
  if (!worksheet) {
    throw new Error(`No se encontró la hoja "${DJ_TEMPLATE_MAP.sheetName}" en la plantilla`)
  }

  // Ajustar anchos mínimos del bloque de horarios (K..P) para mejorar visual
  // Columnas: K=11, L=12, M=13, N=14, O=15, P=16
  const colHorarios = [
    DJ_TEMPLATE_MAP.tabla.COL_LUNES,      // 11
    DJ_TEMPLATE_MAP.tabla.COL_MARTES,     // 12
    DJ_TEMPLATE_MAP.tabla.COL_MIERCOLES,  // 13
    DJ_TEMPLATE_MAP.tabla.COL_JUEVES,     // 14
    DJ_TEMPLATE_MAP.tabla.COL_VIERNES,    // 15
    DJ_TEMPLATE_MAP.tabla.COL_SABADO      // 16
  ]
  
  colHorarios.forEach(colNum => {
    const col = worksheet.getColumn(colNum)
    col.width = Math.max(col.width || 0, 14)
  })

  // Rellenar encabezado
  const encabezado = DJ_TEMPLATE_MAP.encabezado
  const docente = djSnapshotGlobal.docente

  // Nombre
  if (encabezado.nombre) {
    worksheet.getCell(encabezado.nombre).value = docente.nombre || ''
  }

  // DNI
  if (encabezado.dni) {
    worksheet.getCell(encabezado.dni).value = docente.dni || ''
  }

  // Ciclo lectivo
  if (encabezado.cicloLectivo) {
    worksheet.getCell(encabezado.cicloLectivo).value = docente.cicloLectivo || ''
  }

  // Domicilio
  if (encabezado.domicilio) {
    worksheet.getCell(encabezado.domicilio).value = docente.domicilio || ''
  }

  // Teléfono
  if (encabezado.telefono) {
    worksheet.getCell(encabezado.telefono).value = docente.telefono || ''
  }

  // Email
  if (encabezado.email) {
    worksheet.getCell(encabezado.email).value = docente.email || ''
  }

  // Fecha (ya viene en formato DD-MM-YYYY como string)
  if (encabezado.fecha) {
    worksheet.getCell(encabezado.fecha).value = djSnapshotGlobal.fecha || ''
  }

  // Rellenar tabla de cargos
  const tabla = DJ_TEMPLATE_MAP.tabla
  djSnapshotGlobal.filas.forEach((fila, index) => {
    const rowIndex = tabla.ROW_START + index

    // Distrito/Servicio educativo
    worksheet.getCell(rowIndex, tabla.COL_DISTRITO).value = fila.distritoServicioEducativo || ''

    // Cargo (anteponer "Prof. ")
    const cargoApp = (fila.cargo || '').trim()
    worksheet.getCell(rowIndex, tabla.COL_CARGO).value = cargoApp ? `Prof. ${cargoApp}` : null

    // Situación de revista
    worksheet.getCell(rowIndex, tabla.COL_SIT_REV).value = fila.situacionRevista || ''

    // Obtener situación mapeada (T/P/S)
    const situacion = mapearSituacionRevista(fila.situacionRevista)
    const esHorasCatedra = fila.tipoCarga === 'HORAS_CATEDRA'
    const esModulos = fila.tipoCarga === 'MODULOS'

    // Hs Cátedra T/P/S
    if (esHorasCatedra && situacion && fila.cantidadCarga !== null && fila.cantidadCarga !== undefined) {
      if (situacion === 'T') {
        worksheet.getCell(rowIndex, tabla.COL_HS_T).value = fila.cantidadCarga
      } else if (situacion === 'P') {
        worksheet.getCell(rowIndex, tabla.COL_HS_P).value = fila.cantidadCarga
      } else if (situacion === 'S') {
        worksheet.getCell(rowIndex, tabla.COL_HS_S).value = fila.cantidadCarga
      }
    }

    // Módulos T/P/S
    if (esModulos && situacion && fila.cantidadCarga !== null && fila.cantidadCarga !== undefined) {
      if (situacion === 'T') {
        worksheet.getCell(rowIndex, tabla.COL_MOD_T).value = fila.cantidadCarga
      } else if (situacion === 'P') {
        worksheet.getCell(rowIndex, tabla.COL_MOD_P).value = fila.cantidadCarga
      } else if (situacion === 'S') {
        worksheet.getCell(rowIndex, tabla.COL_MOD_S).value = fila.cantidadCarga
      }
    }

    // Toma de posesión (dejar vacío)
    // worksheet.getCell(rowIndex, tabla.COL_TOMA_POSESION).value = ''

    // Horarios por día
    Object.entries(fila.horariosPorDia).forEach(([dia, horario]) => {
      const columna = MAPA_DIA_COLUMNA[dia]
      if (columna && horario) {
        // Normalizar horario: extraer solo "HH:MM a HH:MM"
        const limpio = normalizarHorario(horario)
        if (limpio !== null) {
          // Solo escribir si se detectó rango horario válido
          worksheet.getCell(rowIndex, columna).value = limpio
        }
        // Si no se detecta rango, no escribir nada (para que se vea la diagonal de la plantilla)
      }
      // Si no hay horario, no escribir nada (para que se vea la diagonal de la plantilla)
    })

    // Conformidad (dejar vacío)
    // worksheet.getCell(rowIndex, tabla.COL_CONFORMIDAD).value = ''
  })

  // Generar buffer y descargar
  const excelBuffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = generarNombreArchivo(docente.cicloLectivo, djSnapshotGlobal.fecha)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
