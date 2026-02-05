import { useState, useEffect } from 'react'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerHoyArgentina } from '../utils/fechas'
import {
  obtenerDiagnosticos,
  agregarDiagnosticoGeneral,
  agregarDiagnosticoGrupal,
  agregarDiagnosticoIndividual
} from '../utils/datosDiagnosticos'

function Diagnosticos({ cursoId }) {
  const [alumnosDelCurso, setAlumnosDelCurso] = useState([])
  const [cursoNombre, setCursoNombre] = useState('')
  const [modo, setModo] = useState('General') // General | Grupal | Individual
  const [diagnosticos, setDiagnosticos] = useState({ general: [], grupos: {}, alumnos: {} })
  const [expandidoPorSeccion, setExpandidoPorSeccion] = useState({})
  const [mostrarModal, setMostrarModal] = useState(false)
  const [formDiagnostico, setFormDiagnostico] = useState({
    fechaISO: obtenerHoyArgentina(),
    titulo: '',
    detalle: '',
    grupoKey: '',
    indicador: 'ok', // riesgo | medio | ok
    alumnoSeleccionado: null
  })

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

  // Cargar diagnósticos
  useEffect(() => {
    const datos = obtenerDiagnosticos(cursoId)
    setDiagnosticos(datos)
  }, [cursoId])

  const abrirModal = () => {
    setFormDiagnostico({
      fechaISO: obtenerHoyArgentina(),
      titulo: '',
      detalle: '',
      grupoKey: '',
      indicador: 'ok',
      alumnoSeleccionado: null
    })
    setMostrarModal(true)
  }

  // Calcular alumnoKey estable (misma lógica que Trayectorias)
  const calcularAlumnoKey = (alumno, idx, hayDuplicado) => {
    if (alumno.legajo) return String(alumno.legajo)
    if (alumno.id) return String(alumno.id)
    // Fallback: nombre normalizado
    const apellido = (alumno.apellido || '').toUpperCase().trim()
    const nombre = (alumno.nombre || '').toUpperCase().trim()
    let nombreNormalizado = `${apellido},${nombre}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover tildes
    // Solo agregar cursoId|idx si hay duplicados
    if (hayDuplicado) {
      nombreNormalizado = `${nombreNormalizado}|${cursoId}|${idx}`
    }
    return nombreNormalizado
  }

  // Detectar duplicados por nombre normalizado
  const detectarDuplicados = (alumnos) => {
    const nombresNormalizados = {}
    alumnos.forEach((alumno) => {
      if (!alumno.legajo && !alumno.id) {
        const apellido = (alumno.apellido || '').toUpperCase().trim()
        const nombre = (alumno.nombre || '').toUpperCase().trim()
        const nombreNormalizado = `${apellido},${nombre}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        nombresNormalizados[nombreNormalizado] = (nombresNormalizados[nombreNormalizado] || 0) + 1
      }
    })
    const duplicados = {}
    Object.keys(nombresNormalizados).forEach(nombre => {
      if (nombresNormalizados[nombre] > 1) {
        duplicados[nombre] = true
      }
    })
    return duplicados
  }

  // Generar resumen grupal automático desde diagnósticos individuales
  const generarResumenGrupalAutomatico = (grupoKey) => {
    const duplicadosPorNombre = detectarDuplicados(alumnosDelCurso)
    const indicadores = { riesgo: 0, medio: 0, ok: 0 }
    const detallesPorIndicador = { riesgo: [], medio: [], ok: [] }
    
    alumnosDelCurso.forEach((alumno, idx) => {
      let hayDuplicado = false
      if (!alumno.legajo && !alumno.id) {
        const apellido = (alumno.apellido || '').toUpperCase().trim()
        const nombre = (alumno.nombre || '').toUpperCase().trim()
        const nombreNormalizado = `${apellido},${nombre}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        hayDuplicado = duplicadosPorNombre[nombreNormalizado] === true
      }
      const alumnoKey = calcularAlumnoKey(alumno, idx, hayDuplicado)
      const registrosAlumno = diagnosticos.alumnos[alumnoKey] || []
      
      if (registrosAlumno.length > 0) {
        const ultimoRegistro = registrosAlumno[registrosAlumno.length - 1]
        const indicador = ultimoRegistro.indicador || 'ok'
        indicadores[indicador] = (indicadores[indicador] || 0) + 1
        
        if (ultimoRegistro.detalle) {
          detallesPorIndicador[indicador].push(`${alumno.apellido}, ${alumno.nombre}: ${ultimoRegistro.detalle.substring(0, 50)}`)
        }
      }
    })
    
    const total = indicadores.riesgo + indicadores.medio + indicadores.ok
    const fechaISO = obtenerHoyArgentina()
    
    const detalle = `Resumen automático del grupo ${grupoKey}:\n` +
      `- Riesgo: ${indicadores.riesgo}/${total}\n` +
      `- Medio: ${indicadores.medio}/${total}\n` +
      `- OK: ${indicadores.ok}/${total}\n\n` +
      (detallesPorIndicador.riesgo.length > 0 ? `Riesgo:\n${detallesPorIndicador.riesgo.join('\n')}\n\n` : '') +
      (detallesPorIndicador.medio.length > 0 ? `Medio:\n${detallesPorIndicador.medio.join('\n')}\n\n` : '')
    
    return {
      fechaISO,
      titulo: `Resumen automático - ${grupoKey}`,
      detalle,
      indicadores
    }
  }

  const cerrarModal = () => {
    setMostrarModal(false)
  }

  const handleGuardar = () => {
    if (!formDiagnostico.detalle.trim()) {
      alert('El detalle es obligatorio')
      return
    }

    const registro = {
      fechaISO: formDiagnostico.fechaISO,
      titulo: formDiagnostico.titulo || '',
      detalle: formDiagnostico.detalle
    }

    if (modo === 'General') {
      agregarDiagnosticoGeneral(cursoId, registro)
    } else if (modo === 'Grupal') {
      if (!formDiagnostico.grupoKey.trim()) {
        alert('El grupo es obligatorio')
        return
      }
      agregarDiagnosticoGrupal(cursoId, formDiagnostico.grupoKey.trim(), registro)
    } else if (modo === 'Individual') {
      if (!formDiagnostico.alumnoSeleccionado) {
        alert('Debe seleccionar un alumno')
        return
      }
      const duplicadosPorNombre = detectarDuplicados(alumnosDelCurso)
      const alumnoIdx = alumnosDelCurso.findIndex(a => a.id === formDiagnostico.alumnoSeleccionado.id)
      const nombreNormalizado = `${(formDiagnostico.alumnoSeleccionado.apellido || '').toUpperCase().trim()},${(formDiagnostico.alumnoSeleccionado.nombre || '').toUpperCase().trim()}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      const hayDuplicado = !formDiagnostico.alumnoSeleccionado.legajo && 
        !formDiagnostico.alumnoSeleccionado.id && 
        duplicadosPorNombre[nombreNormalizado] === true
      const alumnoKey = calcularAlumnoKey(formDiagnostico.alumnoSeleccionado, alumnoIdx >= 0 ? alumnoIdx : 0, hayDuplicado)
      const alumnoNombre = `${formDiagnostico.alumnoSeleccionado.apellido}, ${formDiagnostico.alumnoSeleccionado.nombre}`
      agregarDiagnosticoIndividual(cursoId, alumnoKey, {
        indicador: formDiagnostico.indicador,
        ...registro,
        alumnoNombre
      })
    }

    // Recargar diagnósticos
    const datosActualizados = obtenerDiagnosticos(cursoId)
    setDiagnosticos(datosActualizados)
    cerrarModal()
  }

  const handleGenerarResumenGrupal = () => {
    if (alumnosDelCurso.length === 0) {
      alert('No hay alumnos para generar resumen')
      return
    }
    
    const grupoKey = prompt('Ingrese el nombre del grupo (ej: A, B, Grupo 1):')
    if (!grupoKey || !grupoKey.trim()) {
      return
    }
    
    const resumen = generarResumenGrupalAutomatico(grupoKey.trim())
    agregarDiagnosticoGrupal(cursoId, grupoKey.trim(), resumen)
    
    // Recargar diagnósticos
    const datosActualizados = obtenerDiagnosticos(cursoId)
    setDiagnosticos(datosActualizados)
    alert('Resumen grupal generado exitosamente')
  }

  const obtenerColorIndicador = (indicador) => {
    if (indicador === 'riesgo') return 'bg-red-100 text-red-800 border-red-300'
    if (indicador === 'medio') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const obtenerTextoIndicador = (indicador) => {
    if (indicador === 'riesgo') return 'Riesgo'
    if (indicador === 'medio') return 'Medio'
    return 'OK'
  }

  const toggleExpandir = (seccionKey) => {
    setExpandidoPorSeccion(prev => ({
      ...prev,
      [seccionKey]: !prev[seccionKey]
    }))
  }

  const formatearFecha = (fechaISO) => {
    const [year, month, day] = fechaISO.split('-')
    return `${day}/${month}/${year}`
  }

  const renderRegistros = (registros, seccionKey) => {
    const todosRegistros = [...registros].reverse() // Más reciente primero
    const estaExpandido = expandidoPorSeccion[seccionKey] === true
    const registrosAMostrar = estaExpandido ? todosRegistros : todosRegistros.slice(0, 3)
    const tieneMasRegistros = registros.length > 3

    if (registrosAMostrar.length === 0) return null

    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="space-y-1">
          {registrosAMostrar.map((registro) => (
            <div key={registro.id} className="text-xs text-gray-600">
              <span className="font-medium">{formatearFecha(registro.fechaISO)}</span>
              {registro.indicador && (
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium border ${obtenerColorIndicador(registro.indicador)}`}>
                  {obtenerTextoIndicador(registro.indicador)}
                </span>
              )}
              {registro.titulo && <span className="ml-2 font-semibold">- {registro.titulo}</span>}
              <span className="ml-2">: {registro.detalle.length > 60 ? registro.detalle.substring(0, 60) + '...' : registro.detalle}</span>
            </div>
          ))}
        </div>
        {tieneMasRegistros && (
          <button
            onClick={() => toggleExpandir(seccionKey)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {estaExpandido ? 'Ocultar' : 'Ver todo'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Diagnósticos – {cursoNombre || `Curso ${cursoId}`}
      </h2>
      
      {/* Selector de modo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modo de diagnóstico
        </label>
        <select
          value={modo}
          onChange={(e) => setModo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="General">General</option>
          <option value="Grupal">Grupal</option>
          <option value="Individual">Individual</option>
        </select>
      </div>

      {/* Botón Registrar */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={abrirModal}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition"
        >
          Registrar
        </button>
        {modo === 'Grupal' && (
          <button
            onClick={handleGenerarResumenGrupal}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Generar resumen automático
          </button>
        )}
      </div>

      {/* Listado según modo */}
      {modo === 'General' && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnósticos Generales</h3>
          {renderRegistros(diagnosticos.general, 'general') || (
            <p className="text-sm text-gray-500">No hay diagnósticos generales registrados</p>
          )}
        </div>
      )}

      {modo === 'Grupal' && (
        <div className="space-y-3">
          {Object.keys(diagnosticos.grupos).length === 0 ? (
            <p className="text-sm text-gray-500">No hay diagnósticos grupales registrados</p>
          ) : (
            Object.keys(diagnosticos.grupos).map((grupoKey) => (
              <div key={grupoKey} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Grupo: {grupoKey}</h3>
                {renderRegistros(diagnosticos.grupos[grupoKey], `grupo-${grupoKey}`)}
              </div>
            ))
          )}
        </div>
      )}

      {modo === 'Individual' && (
        <div className="space-y-3">
          {alumnosDelCurso.length === 0 ? (
            <p className="text-sm text-gray-500">Este curso no tiene alumnos cargados</p>
          ) : (
            (() => {
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
                const alumnoKey = calcularAlumnoKey(alumno, idx, hayDuplicado)
                const registrosAlumno = diagnosticos.alumnos[alumnoKey] || []
                const ultimoRegistro = registrosAlumno.length > 0 ? registrosAlumno[registrosAlumno.length - 1] : null
                const indicadorActual = ultimoRegistro?.indicador || 'ok'
                if (registrosAlumno.length === 0) return null
                return (
                  <div key={alumno.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alumno.apellido}, {alumno.nombre}
                      </h3>
                      <span className={`px-3 py-1 rounded text-sm font-medium border ${obtenerColorIndicador(indicadorActual)}`}>
                        {obtenerTextoIndicador(indicadorActual)}
                      </span>
                    </div>
                    {renderRegistros(registrosAlumno, `alumno-${alumnoKey}`)}
                  </div>
                )
              })
            })()
          )}
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Registrar Diagnóstico</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formDiagnostico.fechaISO}
                  onChange={(e) => setFormDiagnostico({ ...formDiagnostico, fechaISO: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
                <input
                  type="text"
                  value={formDiagnostico.titulo}
                  onChange={(e) => setFormDiagnostico({ ...formDiagnostico, titulo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {modo === 'Grupal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDiagnostico.grupoKey}
                    onChange={(e) => setFormDiagnostico({ ...formDiagnostico, grupoKey: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ej: A, B, Grupo 1"
                  />
                </div>
              )}

              {modo === 'Individual' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alumno <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formDiagnostico.alumnoSeleccionado?.id || ''}
                      onChange={(e) => {
                        const alumno = alumnosDelCurso.find(a => String(a.id) === e.target.value)
                        setFormDiagnostico({ ...formDiagnostico, alumnoSeleccionado: alumno || null })
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Seleccionar alumno...</option>
                      {alumnosDelCurso.map((alumno) => (
                        <option key={alumno.id} value={alumno.id}>
                          {alumno.apellido}, {alumno.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indicador <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formDiagnostico.indicador}
                      onChange={(e) => setFormDiagnostico({ ...formDiagnostico, indicador: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="ok">OK</option>
                      <option value="medio">Medio</option>
                      <option value="riesgo">Riesgo</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalle <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formDiagnostico.detalle}
                  onChange={(e) => setFormDiagnostico({ ...formDiagnostico, detalle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="4"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardar}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
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
    </div>
  )
}

export default Diagnosticos

