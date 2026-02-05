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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Trayectorias – {cursoNombre || `Curso ${cursoId}`}
      </h2>
      
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
    </div>
  )
}

export default Trayectorias
