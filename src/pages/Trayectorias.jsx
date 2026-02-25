import { useState, useEffect } from 'react'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerHoyArgentina } from '../utils/fechas'
import { agregarRegistro, generarAlumnoKey, obtenerRegistros } from '../utils/datosTrayectorias'
import { obtenerSeguimiento, toggleSeguimiento } from '../utils/datosSeguimiento'

function Trayectorias({ cursoId }) {
  const [alumnosDelCurso, setAlumnosDelCurso] = useState([])
  const [cursoNombre, setCursoNombre] = useState('')
  const [registrosPorAlumno, setRegistrosPorAlumno] = useState({})
  const [seguimientoPorAlumno, setSeguimientoPorAlumno] = useState({})
  const [expandidoPorAlumno, setExpandidoPorAlumno] = useState({})
  const [mostrarModal, setMostrarModal] = useState(false)
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null)
  const [alumnoSeleccionadoIdx, setAlumnoSeleccionadoIdx] = useState(null)
  const [formRegistro, setFormRegistro] = useState({
    tipo: 'Seguimiento',
    fechaISO: obtenerHoyArgentina(),
    detalle: '',
    notaTipo: 'NUMERICA',
    notaValor: '',
    materia: ''
  })

  // Estados para modal de informe
  const [showInformeModal, setShowInformeModal] = useState(false)
  const [alcanceInforme, setAlcanceInforme] = useState('curso') // 'curso' | 'uno' | 'seleccion'
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState('')
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState(new Set())
  const [filtroBusquedaAlumnos, setFiltroBusquedaAlumnos] = useState('')
  const [textoExtraInforme, setTextoExtraInforme] = useState('')

  // Cargar curso y alumnos
  useEffect(() => {
    const todosLosCursos = obtenerCursos()
    const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
    
    if (cursoEncontrado) {
      setCursoNombre(cursoEncontrado.nombre || '')
      setAlumnosDelCurso(Array.isArray(cursoEncontrado.alumnos) ? cursoEncontrado.alumnos : [])
    } else {
      setAlumnosDelCurso([])
    }
  }, [cursoId])

  // Cargar registros de trayectorias
  useEffect(() => {
    const registros = obtenerRegistros(cursoId)
    setRegistrosPorAlumno(registros)
  }, [cursoId])

  // Cargar seguimiento manual
  useEffect(() => {
    const seguimiento = obtenerSeguimiento(cursoId)
    setSeguimientoPorAlumno(seguimiento)
  }, [cursoId])

  const abrirModal = (alumno, idx) => {
    setAlumnoSeleccionado(alumno)
    setAlumnoSeleccionadoIdx(idx)
    setFormRegistro({
      tipo: 'Seguimiento',
      fechaISO: obtenerHoyArgentina(),
      detalle: '',
      notaTipo: 'NUMERICA',
      notaValor: '',
      materia: ''
    })
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setAlumnoSeleccionado(null)
    setAlumnoSeleccionadoIdx(null)
  }

  const handleToggleSeguimiento = (alumnoKey) => {
    toggleSeguimiento(cursoId, alumnoKey)
    // Recargar seguimiento después de toggle
    const seguimientoActualizado = obtenerSeguimiento(cursoId)
    setSeguimientoPorAlumno(seguimientoActualizado)
  }

  const toggleExpandir = (alumnoKey) => {
    setExpandidoPorAlumno(prev => ({
      ...prev,
      [alumnoKey]: !prev[alumnoKey]
    }))
  }

  const handleGuardar = () => {
    if (!alumnoSeleccionado || alumnoSeleccionadoIdx === null) return
    
    const esNota = formRegistro.tipo === 'Nota'
    
    // Validación: detalle obligatorio si no es Nota
    if (!esNota && !formRegistro.detalle.trim()) {
      alert('El detalle es obligatorio')
      return
    }
    
    // Variables locales (no mutar formRegistro)
    let notaValorFinal = formRegistro.notaValor
    
    // Validación: notaValor obligatorio si es Nota
    if (esNota) {
      if (formRegistro.notaTipo === 'NUMERICA') {
        const valor = Number(formRegistro.notaValor)
        if (isNaN(valor) || valor < 1 || valor > 10) {
          alert('El valor de la nota debe ser entre 1 y 10')
          return
        }
        notaValorFinal = String(valor)
      } else {
        // TEA/TEP/TED: valor fijo = notaTipo
        notaValorFinal = formRegistro.notaTipo
      }
    }
    
    // Detectar si hay duplicado para este alumno
    const duplicadosPorNombre = detectarDuplicados(alumnosDelCurso)
    let hayDuplicado = false
    if (!alumnoSeleccionado.legajo && !alumnoSeleccionado.id) {
      const apellido = (alumnoSeleccionado.apellido || '').toUpperCase().trim()
      const nombre = (alumnoSeleccionado.nombre || '').toUpperCase().trim()
      const nombreNormalizado = `${apellido},${nombre}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
    }
    const alumnoKey = generarAlumnoKey(alumnoSeleccionado, alumnoSeleccionadoIdx, cursoId, hayDuplicado)
    const alumnoNombre = `${alumnoSeleccionado.apellido}, ${alumnoSeleccionado.nombre}`
    
    const registro = {
      alumnoKey,
      alumnoNombre,
      ...(alumnoSeleccionado.legajo && { alumnoLegajo: String(alumnoSeleccionado.legajo) }),
      ...(alumnoSeleccionado.id && { alumnoId: String(alumnoSeleccionado.id) }),
      fechaISO: formRegistro.fechaISO,
      tipo: formRegistro.tipo,
      detalle: formRegistro.detalle || '',
      ...(esNota && {
        notaTipo: formRegistro.notaTipo,
        notaValor: notaValorFinal,
        materia: formRegistro.materia || ''
      })
    }
    
    agregarRegistro(cursoId, alumnoKey, registro)
    // Recargar registros después de guardar
    const registrosActualizados = obtenerRegistros(cursoId)
    setRegistrosPorAlumno(registrosActualizados)
    cerrarModal()
  }

  // Formatear texto del registro para mostrar
  const formatearRegistro = (registro) => {
    if (registro.tipo === 'Nota') {
      const notaTexto = registro.notaTipo === 'NUMERICA' 
        ? `${registro.notaTipo} ${registro.notaValor}`
        : registro.notaTipo
      const materiaTexto = registro.materia ? ` - ${registro.materia}` : ''
      return `Nota (${notaTexto})${materiaTexto}`
    }
    return registro.tipo
  }

  // Formatear fecha para mostrar (DD/MM/YYYY)
  const formatearFecha = (fechaISO) => {
    const [year, month, day] = fechaISO.split('-')
    return `${day}/${month}/${year}`
  }

  // Detectar duplicados por nombre normalizado (antes del map)
  const detectarDuplicados = (alumnos) => {
    const nombresNormalizados = {}
    alumnos.forEach((alumno) => {
      // Solo considerar si no tiene legajo ni id
      if (!alumno.legajo && !alumno.id) {
        const apellido = (alumno.apellido || '').toUpperCase().trim()
        const nombre = (alumno.nombre || '').toUpperCase().trim()
        const nombreNormalizado = `${apellido},${nombre}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        nombresNormalizados[nombreNormalizado] = (nombresNormalizados[nombreNormalizado] || 0) + 1
      }
    })
    // Retornar objeto con nombres que aparecen más de una vez
    const duplicados = {}
    Object.keys(nombresNormalizados).forEach(nombre => {
      if (nombresNormalizados[nombre] > 1) {
        duplicados[nombre] = true
      }
    })
    return duplicados
  }

  // Abrir modal de informe
  const abrirModalInforme = () => {
    setShowInformeModal(true)
    setAlcanceInforme('curso')
    setAlumnoSeleccionadoId('')
    setAlumnosSeleccionados(new Set())
    setFiltroBusquedaAlumnos('')
    setTextoExtraInforme('')
  }

  // Cerrar modal de informe
  const cerrarModalInforme = () => {
    setShowInformeModal(false)
    setAlcanceInforme('curso')
    setAlumnoSeleccionadoId('')
    setAlumnosSeleccionados(new Set())
    setFiltroBusquedaAlumnos('')
    setTextoExtraInforme('')
  }

  // Toggle selección de alumno
  const toggleAlumnoSeleccionado = (alumnoKey) => {
    setAlumnosSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(alumnoKey)) {
        nuevo.delete(alumnoKey)
      } else {
        nuevo.add(alumnoKey)
      }
      return nuevo
    })
  }

  // Obtener alumnos para el informe según alcance
  const obtenerAlumnosParaInforme = () => {
    const duplicadosPorNombre = detectarDuplicados(alumnosDelCurso)
    
    if (alcanceInforme === 'curso') {
      // Todos los alumnos
      return alumnosDelCurso.map((alumno, idx) => {
        let hayDuplicado = false
        if (!alumno.legajo && !alumno.id) {
          const apellido = (alumno.apellido || '').toUpperCase().trim()
          const nombre = (alumno.nombre || '').toUpperCase().trim()
          const nombreNormalizado = `${apellido},${nombre}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
          hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
        }
        const alumnoKey = generarAlumnoKey(alumno, idx, cursoId, hayDuplicado)
        return { alumno, idx, alumnoKey }
      })
    } else if (alcanceInforme === 'uno') {
      // Un solo alumno
      if (!alumnoSeleccionadoId) return []
      const idx = alumnosDelCurso.findIndex((a, i) => {
        let hayDuplicado = false
        if (!a.legajo && !a.id) {
          const apellido = (a.apellido || '').toUpperCase().trim()
          const nombre = (a.nombre || '').toUpperCase().trim()
          const nombreNormalizado = `${apellido},${nombre}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
          hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
        }
        const key = generarAlumnoKey(a, i, cursoId, hayDuplicado)
        return key === alumnoSeleccionadoId
      })
      if (idx === -1) return []
      const alumno = alumnosDelCurso[idx]
      let hayDuplicado = false
      if (!alumno.legajo && !alumno.id) {
        const apellido = (alumno.apellido || '').toUpperCase().trim()
        const nombre = (alumno.nombre || '').toUpperCase().trim()
        const nombreNormalizado = `${apellido},${nombre}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
      }
      const alumnoKey = generarAlumnoKey(alumno, idx, cursoId, hayDuplicado)
      return [{ alumno, idx, alumnoKey }]
    } else {
      // Selección múltiple
      return alumnosDelCurso
        .map((alumno, idx) => {
          let hayDuplicado = false
          if (!alumno.legajo && !alumno.id) {
            const apellido = (alumno.apellido || '').toUpperCase().trim()
            const nombre = (alumno.nombre || '').toUpperCase().trim()
            const nombreNormalizado = `${apellido},${nombre}`
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
            hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
          }
          const alumnoKey = generarAlumnoKey(alumno, idx, cursoId, hayDuplicado)
          return { alumno, idx, alumnoKey }
        })
        .filter(({ alumnoKey }) => alumnosSeleccionados.has(alumnoKey))
    }
  }

  // Generar HTML del informe
  const generarInformeHTML = (alumnosParaInforme, textoExtra) => {
    // Obtener fecha y hora actual (locale es-AR)
    const ahora = new Date()
    const fechaHora = ahora.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // Construir HTML del informe
    let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Informe de Trayectorias</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #000;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .header-info {
          font-size: 14px;
          color: #666;
          margin-bottom: 30px;
        }
        .alumno {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ccc;
        }
        .alumno-header {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .alumno-info {
          font-size: 14px;
          margin-bottom: 10px;
          color: #333;
        }
        .registros {
          margin-top: 10px;
          margin-left: 20px;
        }
        .registro-item {
          font-size: 13px;
          margin-bottom: 5px;
          color: #555;
        }
        .sin-registros {
          font-size: 13px;
          color: #999;
          font-style: italic;
          margin-left: 20px;
        }
        .conclusion {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
        }
        .conclusion p {
          font-size: 14px;
          color: #333;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>Informe de Trayectorias</h1>
      <div class="header-info">
        <strong>Curso:</strong> ${cursoNombre || `Curso ${cursoId}`}<br>
        <strong>Fecha y hora de generación:</strong> ${fechaHora}
      </div>
  `
    
    // Iterar sobre alumnosParaInforme
    alumnosParaInforme.forEach(({ alumno, alumnoKey }) => {
      // Obtener datos del alumno
      const condiciones = alumno.condiciones || []
      const condicionesTexto = condiciones.length > 0 ? condiciones.join(", ") : "—"
      const registrosAlumno = registrosPorAlumno[alumnoKey] || []
      const todosRegistros = [...registrosAlumno].reverse() // Más reciente primero
      const tieneRecursa = condiciones.includes('RECURSA')
      const tieneIntensifica = condiciones.includes('INTENSIFICA')
      const seguimientoManual = seguimientoPorAlumno[alumnoKey] === true
      const enSeguimiento = tieneRecursa || tieneIntensifica || seguimientoManual
      const estadoSeguimiento = enSeguimiento ? "En seguimiento" : "No en seguimiento"
      
      // Agregar sección del alumno al HTML
      html += `
      <div class="alumno">
        <div class="alumno-header">${alumno.apellido}, ${alumno.nombre}</div>
        <div class="alumno-info">
          <strong>Condición:</strong> ${condicionesTexto}<br>
          <strong>Estado:</strong> ${estadoSeguimiento}
        </div>
    `
      
      // Agregar registros
      if (todosRegistros.length > 0) {
        html += '<div class="registros">'
        todosRegistros.forEach((registro) => {
          const fechaFormateada = formatearFecha(registro.fechaISO)
          const registroTexto = formatearRegistro(registro)
          const detalleTexto = registro.detalle && registro.tipo !== 'Nota' 
            ? `: ${registro.detalle}` 
            : ''
          html += `
          <div class="registro-item">
            ${fechaFormateada} - ${registroTexto}${detalleTexto}
          </div>
        `
        })
        html += '</div>'
      } else {
        html += '<div class="sin-registros">Sin registros</div>'
      }
      
      html += '</div>'
    })
    
    // Agregar conclusión si existe
    if (textoExtra && textoExtra.trim()) {
      html += `
      <div class="conclusion">
        <h2>Conclusión del docente</h2>
        <p>${textoExtra.trim()}</p>
      </div>
    `
    }
    
    // Cerrar HTML
    html += `
      <div class="footer">
        Generado por La App del Docente
      </div>
    </body>
    </html>
  `
    
    return html
  }

  // Imprimir HTML
  const imprimirHTML = (html) => {
    const ventanaImpresion = window.open('', '_blank')
    if (ventanaImpresion) {
      ventanaImpresion.document.write(html)
      ventanaImpresion.document.close()
      ventanaImpresion.focus()
      setTimeout(() => {
        ventanaImpresion.print()
      }, 250)
    } else {
      alert('Habilitá popups para imprimir.')
    }
  }

  // Generar e imprimir informe
  const handleImprimirInforme = () => {
    const alumnosParaInforme = obtenerAlumnosParaInforme()
    
    if (alumnosParaInforme.length === 0) {
      alert('No hay alumnos seleccionados para el informe.')
      return
    }
    
    const html = generarInformeHTML(alumnosParaInforme, textoExtraInforme)
    imprimirHTML(html)
    cerrarModalInforme()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Trayectorias – {cursoNombre || `Curso ${cursoId}`}
        </h2>
        {alumnosDelCurso.length > 0 && (
          <button
            onClick={abrirModalInforme}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                     hover:bg-gray-700 transition font-medium"
          >
            🖨️ Imprimir informe
          </button>
        )}
      </div>
      
      {alumnosDelCurso.length === 0 ? (
        <p className="text-gray-600">Este curso no tiene alumnos cargados</p>
      ) : (
        <div className="space-y-3">
          {(() => {
            // Detectar duplicados una sola vez antes del map
            const duplicadosPorNombre = detectarDuplicados(alumnosDelCurso)
            
            return alumnosDelCurso.map((alumno, idx) => {
              // Determinar si este alumno tiene nombre duplicado
              let hayDuplicado = false
              if (!alumno.legajo && !alumno.id) {
                const apellido = (alumno.apellido || '').toUpperCase().trim()
                const nombre = (alumno.nombre || '').toUpperCase().trim()
                const nombreNormalizado = `${apellido},${nombre}`
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
              }
              
              const condiciones = alumno.condiciones || []
              const alumnoKey = generarAlumnoKey(alumno, idx, cursoId, hayDuplicado)
              const registrosAlumno = registrosPorAlumno[alumnoKey] || []
              const todosRegistros = [...registrosAlumno].reverse() // Todos, más reciente primero
              const estaExpandido = expandidoPorAlumno[alumnoKey] === true
              const registrosAMostrar = estaExpandido ? todosRegistros : todosRegistros.slice(0, 3) // Últimos 3 o todos
              const tieneMasRegistros = registrosAlumno.length > 3
              const tieneRecursa = condiciones.includes('RECURSA')
              const tieneIntensifica = condiciones.includes('INTENSIFICA')
              const seguimientoManual = seguimientoPorAlumno[alumnoKey] === true
              const enSeguimiento = tieneRecursa || tieneIntensifica || seguimientoManual
              const condicionesTexto = condiciones.length > 0 ? condiciones.join(", ") : "—"
            
            return (
              <div
                key={alumno.id}
                className="bg-white rounded-lg shadow p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-medium text-gray-900">
                    {alumno.apellido}, {alumno.nombre}
                  </span>
                  {enSeguimiento && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      En seguimiento
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Condiciones: {condicionesTexto}
                </p>
                
                {/* Botón Seguimiento manual */}
                <div className="mt-2">
                  <button
                    onClick={() => handleToggleSeguimiento(alumnoKey)}
                    className={`text-sm px-3 py-1 rounded-lg font-medium transition ${
                      seguimientoManual
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {seguimientoManual ? '⭐ En seguimiento' : '⭐ Seguimiento'}
                  </button>
                </div>
                
                {/* Historial de registros */}
                {registrosAMostrar.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">Últimos registros:</p>
                    <div className="space-y-1">
                      {registrosAMostrar.map((registro) => (
                        <div key={registro.id} className="text-xs text-gray-600">
                          <span className="font-medium">
                            {formatearFecha(registro.fechaISO)}
                          </span>
                          {' - '}
                          <span>{formatearRegistro(registro)}</span>
                          {registro.detalle && registro.tipo !== 'Nota' && (
                            <span className="text-gray-500 ml-1">
                              : {registro.detalle.length > 50 ? registro.detalle.substring(0, 50) + '...' : registro.detalle}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {tieneMasRegistros && (
                      <button
                        onClick={() => toggleExpandir(alumnoKey)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {estaExpandido ? 'Ocultar' : 'Ver todo'}
                      </button>
                    )}
                  </div>
                )}
                
                <div className="mt-3">
                  <button
                    onClick={() => abrirModal(alumno, idx)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            )
          })
          })()}
        </div>
      )}
      
      {/* Modal */}
      {mostrarModal && alumnoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Registrar – {alumnoSeleccionado.apellido}, {alumnoSeleccionado.nombre}
            </h3>
            
            <div className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formRegistro.tipo}
                  onChange={(e) => setFormRegistro({ ...formRegistro, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Observación">Observación</option>
                  <option value="Acuerdo">Acuerdo</option>
                  <option value="Incidencia">Incidencia</option>
                  <option value="Nota">Nota</option>
                </select>
              </div>
              
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formRegistro.fechaISO}
                  onChange={(e) => setFormRegistro({ ...formRegistro, fechaISO: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              {/* Campos según tipo */}
              {formRegistro.tipo !== 'Nota' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detalle <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formRegistro.detalle}
                    onChange={(e) => setFormRegistro({ ...formRegistro, detalle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows="4"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de nota
                    </label>
                    <select
                      value={formRegistro.notaTipo}
                      onChange={(e) => setFormRegistro({ ...formRegistro, notaTipo: e.target.value, notaValor: '' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="NUMERICA">NUMERICA</option>
                      <option value="TEA">TEA</option>
                      <option value="TEP">TEP</option>
                      <option value="TED">TED</option>
                    </select>
                  </div>
                  
                  {formRegistro.notaTipo === 'NUMERICA' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor (1-10) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formRegistro.notaValor}
                        onChange={(e) => setFormRegistro({ ...formRegistro, notaValor: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Valor: {formRegistro.notaTipo}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Materia (opcional)
                    </label>
                    <input
                      type="text"
                      value={formRegistro.materia}
                      onChange={(e) => setFormRegistro({ ...formRegistro, materia: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detalle (opcional)
                    </label>
                    <textarea
                      value={formRegistro.detalle}
                      onChange={(e) => setFormRegistro({ ...formRegistro, detalle: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows="3"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardar}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Guardar
              </button>
              <button
                onClick={cerrarModal}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generar Informe */}
      {showInformeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Generar informe
            </h3>
            
            <div className="space-y-4">
              {/* Alcance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alcance del informe
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="alcance"
                      value="curso"
                      checked={alcanceInforme === 'curso'}
                      onChange={(e) => setAlcanceInforme(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Todo el curso</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="alcance"
                      value="uno"
                      checked={alcanceInforme === 'uno'}
                      onChange={(e) => setAlcanceInforme(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Un alumno</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="alcance"
                      value="seleccion"
                      checked={alcanceInforme === 'seleccion'}
                      onChange={(e) => setAlcanceInforme(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Seleccionar alumnos</span>
                  </label>
                </div>
              </div>

              {/* Dropdown para un alumno */}
              {alcanceInforme === 'uno' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar alumno
                  </label>
                  <select
                    value={alumnoSeleccionadoId}
                    onChange={(e) => setAlumnoSeleccionadoId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Seleccione un alumno...</option>
                    {(() => {
                      const duplicadosPorNombre = detectarDuplicados(alumnosDelCurso)
                      return alumnosDelCurso.map((alumno, idx) => {
                        let hayDuplicado = false
                        if (!alumno.legajo && !alumno.id) {
                          const apellido = (alumno.apellido || '').toUpperCase().trim()
                          const nombre = (alumno.nombre || '').toUpperCase().trim()
                          const nombreNormalizado = `${apellido},${nombre}`
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                          hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
                        }
                        const alumnoKey = generarAlumnoKey(alumno, idx, cursoId, hayDuplicado)
                        const condicionesTexto = (alumno.condiciones || []).length > 0 
                          ? alumno.condiciones.join(", ") 
                          : "—"
                        return (
                          <option key={alumnoKey} value={alumnoKey}>
                            {alumno.apellido}, {alumno.nombre} - {condicionesTexto}
                          </option>
                        )
                      })
                    })()}
                  </select>
                </div>
              )}

              {/* Checklist para selección múltiple */}
              {alcanceInforme === 'seleccion' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar alumnos
                  </label>
                  <input
                    type="text"
                    value={filtroBusquedaAlumnos}
                    onChange={(e) => setFiltroBusquedaAlumnos(e.target.value)}
                    placeholder="Buscar por apellido o nombre..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  />
                  <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {(() => {
                      const duplicadosPorNombre = detectarDuplicados(alumnosDelCurso)
                      const alumnosFiltrados = filtroBusquedaAlumnos.trim()
                        ? alumnosDelCurso.filter(alumno => {
                            const busqueda = filtroBusquedaAlumnos.toLowerCase()
                            const apellido = (alumno.apellido || '').toLowerCase()
                            const nombre = (alumno.nombre || '').toLowerCase()
                            return apellido.includes(busqueda) || nombre.includes(busqueda)
                          })
                        : alumnosDelCurso
                      
                      return alumnosFiltrados.map((alumno, idx) => {
                        let hayDuplicado = false
                        if (!alumno.legajo && !alumno.id) {
                          const apellido = (alumno.apellido || '').toUpperCase().trim()
                          const nombre = (alumno.nombre || '').toUpperCase().trim()
                          const nombreNormalizado = `${apellido},${nombre}`
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                          hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
                        }
                        const alumnoKey = generarAlumnoKey(alumno, idx, cursoId, hayDuplicado)
                        const condicionesTexto = (alumno.condiciones || []).length > 0 
                          ? alumno.condiciones.join(", ") 
                          : "—"
                        const estaSeleccionado = alumnosSeleccionados.has(alumnoKey)
                        
                        return (
                          <label key={alumnoKey} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={estaSeleccionado}
                              onChange={() => toggleAlumnoSeleccionado(alumnoKey)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                              {alumno.apellido}, {alumno.nombre} - {condicionesTexto}
                            </span>
                          </label>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}

              {/* Textarea para texto extra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conclusión / aporte del docente (opcional)
                </label>
                <textarea
                  value={textoExtraInforme}
                  onChange={(e) => setTextoExtraInforme(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="4"
                  placeholder="Ingresá aquí cualquier conclusión o aporte adicional..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={cerrarModalInforme}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleImprimirInforme}
                disabled={
                  (alcanceInforme === 'uno' && !alumnoSeleccionadoId) ||
                  (alcanceInforme === 'seleccion' && alumnosSeleccionados.size === 0)
                }
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  (alcanceInforme === 'uno' && !alumnoSeleccionadoId) ||
                  (alcanceInforme === 'seleccion' && alumnosSeleccionados.size === 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Generar e imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Trayectorias
