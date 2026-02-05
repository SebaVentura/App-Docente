import { obtenerHoyArgentina } from './fechas'

/**
 * Helper para preparar datos de Declaración Jurada (DJ)
 * 
 * Transforma escuelas y cursos en una estructura lista para DJ,
 * ordenando horarios por día (Lunes→Domingo) y luego por hora desde.
 * 
 * @param {Array} escuelas - Array de escuelas: [{ id, nombre }]
 * @param {Array} todosLosCursos - Array de todos los cursos:
 *   [{ id, nombre, escuelaId, horarios: [{ dia, desde, hasta }] }]
 * @returns {Array} Estructura lista para DJ:
 *   [
 *     {
 *       escuelaId,
 *       escuelaNombre,
 *       items: [
 *         { cursoId, cursoNombre, dia, desde, hasta }
 *       ]
 *     }
 *   ]
 */
export function prepararDatosDJ(escuelas, todosLosCursos) {
  const diasOrden = {
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Domingo': 7,
  }

  // Función para ordenar horarios: primero por día, luego por hora desde
  const ordenarHorarios = (horarios) => {
    return [...horarios].sort((a, b) => {
      // Ordenar por día
      const ordenDia = diasOrden[a.dia] - diasOrden[b.dia]
      if (ordenDia !== 0) return ordenDia
      
      // Si mismo día, ordenar por hora desde
      return a.desde.localeCompare(b.desde)
    })
  }

  const resultado = []

  escuelas.forEach((escuela) => {
    // Filtrar cursos de esta escuela
    const cursos = todosLosCursos.filter((curso) => curso.escuelaId === escuela.id)
    
    // Recopilar todos los items (horarios) de los cursos de esta escuela
    const items = []
    
    cursos.forEach((curso) => {
      if (curso.horarios && curso.horarios.length > 0) {
        // Ordenar horarios del curso
        const horariosOrdenados = ordenarHorarios(curso.horarios)
        
        // Agregar cada horario como un item
        horariosOrdenados.forEach((horario) => {
          items.push({
            cursoId: curso.id,
            cursoNombre: curso.nombre,
            dia: horario.dia,
            desde: horario.desde,
            hasta: horario.hasta,
          })
        })
      }
    })

    // Ordenar items finales (por día y hora desde)
    const itemsOrdenados = items.sort((a, b) => {
      const ordenDia = diasOrden[a.dia] - diasOrden[b.dia]
      if (ordenDia !== 0) return ordenDia
      return a.desde.localeCompare(b.desde)
    })

    resultado.push({
      escuelaId: escuela.id,
      escuelaNombre: escuela.nombre,
      items: itemsOrdenados,
    })
  })

  return resultado
}

/**
 * Construye el objeto snapshot de Declaración Jurada (DJ)
 * 
 * @param {Object} params - { escuela, cursos, docente? }
 * @param {Object} escuela - { id, nombre }
 * @param {Array} cursos - Array de cursos: [{ id, nombre, situacionRevista, tipoCarga, cantidadCarga, horarios }]
 * @param {string} docente - Opcional, nombre del docente
 * @returns {Object} Snapshot DJ:
 *   {
 *     establecimientoNombre: string,
 *     fechaGeneracion: string (YYYY-MM-DD),
 *     docente?: string,
 *     cargos: [
 *       {
 *         cursoNombre: string,
 *         situacionRevista: string,
 *         cantidadHorasCatedra: number | null,
 *         cantidadModulos: number | null,
 *         horariosTexto: string (formato legible),
 *         incompleto: boolean
 *       }
 *     ]
 *   }
 */
export function buildDJ({ escuela, cursos, docente }) {
  // Validaciones básicas
  if (!escuela || !cursos) {
    return null
  }

  // Ordenar días para formatear horarios
  const diasOrden = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
    'Viernes': 5, 'Sábado': 6, 'Domingo': 7
  }

  // Función para formatear horarios: "Lun 08:00–09:20; Mié 10:00–11:20"
  const formatearHorarios = (horarios) => {
    if (!horarios || horarios.length === 0) return 'Sin horarios'
    
    // Ordenar horarios
    const ordenados = [...horarios].sort((a, b) => {
      const ordenDia = diasOrden[a.dia] - diasOrden[b.dia]
      if (ordenDia !== 0) return ordenDia
      return a.desde.localeCompare(b.desde)
    })
    
    // Abreviar días: Lunes -> Lun, Miércoles -> Mié, etc.
    const abreviaciones = {
      'Lunes': 'Lun', 'Martes': 'Mar', 'Miércoles': 'Mié', 'Jueves': 'Jue',
      'Viernes': 'Vie', 'Sábado': 'Sáb', 'Domingo': 'Dom'
    }
    
    return ordenados
      .map(h => `${abreviaciones[h.dia] || h.dia} ${h.desde}–${h.hasta}`)
      .join('; ')
  }

  // Mapear cursos a cargos
  const cargos = cursos.map(curso => {
    // Verificar si el curso tiene todos los campos DJ
    const tieneCamposDJ = curso.situacionRevista && curso.tipoCarga && curso.cantidadCarga
    
    return {
      cursoNombre: curso.nombre || '',
      situacionRevista: curso.situacionRevista || '(incompleto)',
      cantidadHorasCatedra: curso.tipoCarga === 'HORAS_CATEDRA' ? (curso.cantidadCarga || null) : null,
      cantidadModulos: curso.tipoCarga === 'MODULOS' ? (curso.cantidadCarga || null) : null,
      horariosTexto: formatearHorarios(curso.horarios),
      incompleto: !tieneCamposDJ
    }
  })

  return {
    establecimientoNombre: escuela.nombre || '',
    fechaGeneracion: obtenerHoyArgentina(),
    docente: docente || undefined,
    cargos: cargos
  }
}

/**
 * Mapea situación de revista a letra (T/P/S)
 * 
 * @param {string} situacion - TITULAR | PROVISIONAL | SUPLENTE
 * @returns {string|null} 'T' | 'P' | 'S' | null
 */
export function mapearSituacionRevista(situacion) {
  if (situacion === 'TITULAR') return 'T'
  if (situacion === 'PROVISIONAL') return 'P'
  if (situacion === 'SUPLENTE') return 'S'
  return null
}

/**
 * Convierte fecha ISO (YYYY-MM-DD) a formato DD-MM-YYYY
 * 
 * @param {string} iso - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha en formato DD-MM-YYYY
 */
export function formatearFechaDDMMYYYY(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const [year, month, day] = iso.split('-')
  return `${day}-${month}-${year}`
}

/**
 * Construye el objeto snapshot global de Declaración Jurada (DJ)
 * Genera una estructura plana con todas las escuelas y cursos en una sola tabla
 * 
 * @param {Object} params - { escuelas, cursos, docente? }
 * @param {Array} escuelas - Array de escuelas: [{ id, nombre }]
 * @param {Array} cursos - Array de todos los cursos: [{ id, nombre, escuelaId, situacionRevista, tipoCarga, cantidadCarga, horarios }]
 * @param {Object} docente - Opcional: { nombre, dni, cuil }
 * @returns {Object} Snapshot DJ global:
 *   {
 *     fecha: string (DD-MM-YYYY),
 *     docente: { nombre, dni, cuil },
 *     filas: [
 *       {
 *         distritoServicioEducativo: string,
 *         cargo: string,
 *         situacionRevista: string,
 *         tipoCarga: string | null,
 *         cantidadCarga: number | null,
 *         horariosPorDia: { Lunes: string | null, ... },
 *         incompleto: boolean
 *       }
 *     ]
 *   }
 */
export function buildDJGlobal({ escuelas, cursos, docente }) {
  if (!escuelas || !cursos) {
    return {
      fecha: formatearFechaDDMMYYYY(obtenerHoyArgentina()),
      docente: docente || {
        nombre: '',
        dni: '',
        cuil: '',
        domicilio: '',
        telefono: '',
        email: '',
        cicloLectivo: ''
      },
      filas: []
    }
  }

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const filas = []

  // Iterar todas las escuelas
  escuelas.forEach(escuela => {
    // Filtrar cursos de esta escuela
    const cursosEscuela = cursos.filter(c => Number(c.escuelaId) === Number(escuela.id))

    // Para cada curso, crear una fila
    cursosEscuela.forEach(curso => {
      // Verificar si el curso tiene todos los campos DJ
      const tieneCamposDJ = curso.situacionRevista && curso.tipoCarga && curso.cantidadCarga

      // Construir objeto horariosPorDia
      const horariosPorDia = {}
      diasSemana.forEach(dia => {
        horariosPorDia[dia] = null
      })

      // Si el curso tiene horarios, mapearlos
      if (curso.horarios && curso.horarios.length > 0) {
        curso.horarios.forEach(horario => {
          const dia = horario.dia
          if (horariosPorDia.hasOwnProperty(dia)) {
            // Formatear: "08:00 a 09:20"
            horariosPorDia[dia] = `${horario.desde} a ${horario.hasta}`
          }
        })
      }

      // Crear fila
      filas.push({
        distritoServicioEducativo: escuela.nombre || '',
        cargo: curso.nombre || '',
        situacionRevista: curso.situacionRevista || '(incompleto)',
        tipoCarga: curso.tipoCarga || null,
        cantidadCarga: curso.cantidadCarga || null,
        horariosPorDia: horariosPorDia,
        incompleto: !tieneCamposDJ
      })
    })
  })

  // Ordenar filas: primero por escuela (alfabético), luego por curso (alfabético)
  filas.sort((a, b) => {
    const ordenEscuela = a.distritoServicioEducativo.localeCompare(b.distritoServicioEducativo)
    if (ordenEscuela !== 0) return ordenEscuela
    return a.cargo.localeCompare(b.cargo)
  })

  return {
    fecha: formatearFechaDDMMYYYY(obtenerHoyArgentina()),
    docente: docente || {
      nombre: '',
      dni: '',
      cuil: '',
      domicilio: '',
      telefono: '',
      email: '',
      cicloLectivo: ''
    },
    filas: filas
  }
}
