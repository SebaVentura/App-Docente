import { useState, useMemo } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerCursos, guardarCursos, generarIdCurso } from '../utils/datosCursos'
import { obtenerEscuelas } from '../utils/datosEscuelas'

function Cursos({ escuelaId }) {
  const { navegar } = useNavegacion()

  // Días de la semana
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  // Orden de días para ordenamiento
  const ordenDias = {
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Domingo': 7,
  }

  // Estado local: TODOS los cursos
  const [todosLosCursos, setTodosLosCursos] = useState(() => obtenerCursos())

  // Filtrar cursos de esta escuela solo para mostrar
  const cursos = useMemo(() => {
    return todosLosCursos.filter(c => c.escuelaId === parseInt(escuelaId))
  }, [todosLosCursos, escuelaId])

  // Estado para formulario de creación
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [nombreNuevoCurso, setNombreNuevoCurso] = useState('')
  const [situacionRevistaNuevo, setSituacionRevistaNuevo] = useState('')
  const [tipoCargaNuevo, setTipoCargaNuevo] = useState('')
  const [cantidadCargaNuevo, setCantidadCargaNuevo] = useState('')
  const [horariosNuevoCurso, setHorariosNuevoCurso] = useState([])
  const [nuevoHorario, setNuevoHorario] = useState({ dia: 'Lunes', desde: '', hasta: '' })
  
  // Obtener nombre de escuela para mostrar
  const escuela = obtenerEscuelas().find(e => e.id === parseInt(escuelaId))
  const nombreEscuela = escuela?.nombre || ''

  // Estado para edición
  const [editandoId, setEditandoId] = useState(null)
  const [cursoEditado, setCursoEditado] = useState(null)
  const [nuevoHorarioEdicion, setNuevoHorarioEdicion] = useState({ dia: 'Lunes', desde: '', hasta: '' })

  // Estado para historial de inasistencias
  const [showHistorialInasistencias, setShowHistorialInasistencias] = useState(false)
  const [cursoActivoHistorial, setCursoActivoHistorial] = useState(null)

  // Agregar horario al nuevo curso
  const handleAgregarHorarioNuevo = () => {
    const { dia, desde, hasta } = nuevoHorario
    if (!dia || !desde || !hasta) return
    if (desde >= hasta) return

    setHorariosNuevoCurso([...horariosNuevoCurso, { ...nuevoHorario }])
    setNuevoHorario({ dia: 'Lunes', desde: '', hasta: '' })
  }

  // Eliminar horario del nuevo curso
  const handleEliminarHorarioNuevo = (index) => {
    setHorariosNuevoCurso(horariosNuevoCurso.filter((_, i) => i !== index))
  }

  // Ordenar horarios: primero por día, luego por hora desde
  const ordenarHorarios = (horarios) => {
    return [...horarios].sort((a, b) => {
      const ordenDia = ordenDias[a.dia] - ordenDias[b.dia]
      if (ordenDia !== 0) return ordenDia
      return a.desde.localeCompare(b.desde)
    })
  }

  // Agregar nuevo curso
  const handleAgregar = () => {
    const nombre = nombreNuevoCurso.trim()
    if (!nombre) return
    
    // Validar campos DJ
    if (!situacionRevistaNuevo || !tipoCargaNuevo || !cantidadCargaNuevo) {
      alert('Debe completar todos los campos de Declaración Jurada')
      return
    }
    
    const cantidad = Number(cantidadCargaNuevo)
    if (isNaN(cantidad) || cantidad <= 0) {
      alert('La cantidad de carga debe ser un número mayor a 0')
      return
    }

    const nuevoCurso = {
      id: generarIdCurso(todosLosCursos),
      nombre: nombre,
      escuelaId: parseInt(escuelaId),
      horarios: ordenarHorarios(horariosNuevoCurso),
      situacionRevista: situacionRevistaNuevo,
      tipoCarga: tipoCargaNuevo,
      cantidadCarga: cantidad,
    }

    const nuevosCursos = [...todosLosCursos, nuevoCurso]
    setTodosLosCursos(nuevosCursos)
    guardarCursos(nuevosCursos)
    setNombreNuevoCurso('')
    setSituacionRevistaNuevo('')
    setTipoCargaNuevo('')
    setCantidadCargaNuevo('')
    setHorariosNuevoCurso([])
    setNuevoHorario({ dia: 'Lunes', desde: '', hasta: '' })
    setMostrarFormulario(false)
  }

  // Cancelar creación
  const handleCancelarCreacion = () => {
    setNombreNuevoCurso('')
    setSituacionRevistaNuevo('')
    setTipoCargaNuevo('')
    setCantidadCargaNuevo('')
    setHorariosNuevoCurso([])
    setNuevoHorario({ dia: 'Lunes', desde: '', hasta: '' })
    setMostrarFormulario(false)
  }

  // Iniciar edición
  const handleIniciarEdicion = (curso) => {
    setEditandoId(curso.id)
    setCursoEditado({
      nombre: curso.nombre,
      horarios: [...curso.horarios],
      situacionRevista: curso.situacionRevista || '',
      tipoCarga: curso.tipoCarga || '',
      cantidadCarga: curso.cantidadCarga || '',
    })
    setNuevoHorarioEdicion({ dia: 'Lunes', desde: '', hasta: '' })
  }

  // Agregar horario en edición
  const handleAgregarHorarioEdicion = () => {
    const { dia, desde, hasta } = nuevoHorarioEdicion
    if (!dia || !desde || !hasta) return
    if (desde >= hasta) return

    setCursoEditado({
      ...cursoEditado,
      horarios: [...cursoEditado.horarios, { ...nuevoHorarioEdicion }],
    })
    setNuevoHorarioEdicion({ dia: 'Lunes', desde: '', hasta: '' })
  }

  // Eliminar horario en edición
  const handleEliminarHorarioEdicion = (index) => {
    setCursoEditado({
      ...cursoEditado,
      horarios: cursoEditado.horarios.filter((_, i) => i !== index),
    })
  }

  // Guardar edición
  const handleGuardarEdicion = (id) => {
    const nombre = cursoEditado.nombre.trim()
    if (!nombre) return
    
    // Validar campos DJ
    if (!cursoEditado.situacionRevista || !cursoEditado.tipoCarga || !cursoEditado.cantidadCarga) {
      alert('Debe completar todos los campos de Declaración Jurada')
      return
    }
    
    const cantidad = Number(cursoEditado.cantidadCarga)
    if (isNaN(cantidad) || cantidad <= 0) {
      alert('La cantidad de carga debe ser un número mayor a 0')
      return
    }

    const nuevosCursos = todosLosCursos.map((curso) =>
      curso.id === id
        ? { 
            ...curso, 
            nombre: nombre, 
            horarios: ordenarHorarios(cursoEditado.horarios),
            situacionRevista: cursoEditado.situacionRevista,
            tipoCarga: cursoEditado.tipoCarga,
            cantidadCarga: cantidad,
          }
        : curso
    )
    setTodosLosCursos(nuevosCursos)
    guardarCursos(nuevosCursos)
    setEditandoId(null)
    setCursoEditado(null)
    setNuevoHorarioEdicion({ dia: 'Lunes', desde: '', hasta: '' })
  }

  // Cancelar edición
  const handleCancelarEdicion = () => {
    setEditandoId(null)
    setCursoEditado(null)
    setNuevoHorarioEdicion({ dia: 'Lunes', desde: '', hasta: '' })
  }

  // Eliminar curso
  const handleEliminar = (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el curso "${nombre}"?`)) {
      const nuevosCursos = todosLosCursos.filter((curso) => curso.id !== id)
      setTodosLosCursos(nuevosCursos)
      guardarCursos(nuevosCursos)
    }
  }

  // Abrir historial de inasistencias
  const abrirHistorialInasistencias = (curso) => {
    setCursoActivoHistorial(curso)
    setShowHistorialInasistencias(true)
  }

  // Formatear horario para mostrar
  const formatearHorario = (horario) => {
    return `${horario.dia} ${horario.desde}–${horario.hasta}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Cursos - Escuela {escuelaId}
        </h2>
        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                     hover:bg-blue-700 transition font-medium"
          >
            + Agregar curso
          </button>
        )}
      </div>

      {/* Formulario de creación */}
      {mostrarFormulario && (
        <div className="mb-6 bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nuevo curso
          </h3>

          {/* Establecimiento */}
          {nombreEscuela && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Establecimiento
              </label>
              <input
                type="text"
                value={nombreEscuela}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          )}

          {/* Aviso DJ */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Los datos que consignes en este curso serán utilizados para la generación de tu Declaración Jurada (DJ).
            </p>
          </div>

          {/* Nombre del curso */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del curso *
            </label>
            <input
              type="text"
              value={nombreNuevoCurso}
              onChange={(e) => setNombreNuevoCurso(e.target.value)}
              placeholder="Ej: 4to A, 4to 2da"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       outline-none transition"
              autoFocus
            />
          </div>

          {/* Situación de revista */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Situación de revista *
            </label>
            <select
              value={situacionRevistaNuevo}
              onChange={(e) => setSituacionRevistaNuevo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       outline-none transition"
            >
              <option value="">Seleccione...</option>
              <option value="TITULAR">TITULAR</option>
              <option value="PROVISIONAL">PROVISIONAL</option>
              <option value="SUPLENTE">SUPLENTE</option>
            </select>
          </div>

          {/* Tipo de carga */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de carga *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoCargaNuevo"
                  value="HORAS_CATEDRA"
                  checked={tipoCargaNuevo === 'HORAS_CATEDRA'}
                  onChange={(e) => setTipoCargaNuevo(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Horas Cátedra</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoCargaNuevo"
                  value="MODULOS"
                  checked={tipoCargaNuevo === 'MODULOS'}
                  onChange={(e) => setTipoCargaNuevo(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Módulos</span>
              </label>
            </div>
          </div>

          {/* Cantidad de carga */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de carga *
            </label>
            <input
              type="number"
              min="1"
              value={cantidadCargaNuevo}
              onChange={(e) => setCantidadCargaNuevo(e.target.value)}
              placeholder="Ej: 10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       outline-none transition"
            />
          </div>

          {/* Sección Horarios */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horarios
            </label>
            
            {/* Formulario para agregar horario */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <select
                value={nuevoHorario.dia}
                onChange={(e) => setNuevoHorario({ ...nuevoHorario, dia: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         outline-none transition"
              >
                {diasSemana.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={nuevoHorario.desde}
                onChange={(e) => setNuevoHorario({ ...nuevoHorario, desde: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         outline-none transition"
              />
              <span className="self-center text-gray-600">hasta</span>
              <input
                type="time"
                value={nuevoHorario.hasta}
                onChange={(e) => setNuevoHorario({ ...nuevoHorario, hasta: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         outline-none transition"
              />
              <button
                onClick={handleAgregarHorarioNuevo}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                         hover:bg-gray-700 transition font-medium"
              >
                Agregar horario
              </button>
            </div>

            {/* Lista de horarios agregados (ordenados) */}
            {horariosNuevoCurso.length > 0 && (
              <div className="space-y-2">
                {ordenarHorarios(horariosNuevoCurso).map((horario, index) => {
                  // Encontrar el índice original para poder eliminar correctamente
                  const indiceOriginal = horariosNuevoCurso.findIndex(
                    (h) => h.dia === horario.dia && h.desde === horario.desde && h.hasta === horario.hasta
                  )
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm text-gray-700">
                        {formatearHorario(horario)}
                      </span>
                      <button
                        onClick={() => handleEliminarHorarioNuevo(indiceOriginal)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={handleAgregar}
              className="bg-green-600 text-white px-4 py-2 rounded-lg 
                       hover:bg-green-700 transition font-medium"
            >
              Guardar
            </button>
            <button
              onClick={handleCancelarCreacion}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                       hover:bg-gray-700 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de cursos */}
      <div className="space-y-4">
        {cursos.map((curso) => (
          <div
            key={curso.id}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            {editandoId === curso.id ? (
              // Modo edición
              <div>
                {/* Establecimiento */}
                {nombreEscuela && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Establecimiento
                    </label>
                    <input
                      type="text"
                      value={nombreEscuela}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Aviso DJ */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ Los datos que consignes en este curso serán utilizados para la generación de tu Declaración Jurada (DJ).
                  </p>
                </div>

                {/* Nombre del curso */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del curso *
                  </label>
                  <input
                    type="text"
                    value={cursoEditado.nombre}
                    onChange={(e) => setCursoEditado({ ...cursoEditado, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                             outline-none transition"
                    autoFocus
                  />
                </div>

                {/* Situación de revista */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Situación de revista *
                  </label>
                  <select
                    value={cursoEditado.situacionRevista || ''}
                    onChange={(e) => setCursoEditado({ ...cursoEditado, situacionRevista: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                             outline-none transition"
                  >
                    <option value="">Seleccione...</option>
                    <option value="TITULAR">TITULAR</option>
                    <option value="PROVISIONAL">PROVISIONAL</option>
                    <option value="SUPLENTE">SUPLENTE</option>
                  </select>
                </div>

                {/* Tipo de carga */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de carga *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`tipoCargaEdicion-${curso.id}`}
                        value="HORAS_CATEDRA"
                        checked={cursoEditado.tipoCarga === 'HORAS_CATEDRA'}
                        onChange={(e) => setCursoEditado({ ...cursoEditado, tipoCarga: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Horas Cátedra</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`tipoCargaEdicion-${curso.id}`}
                        value="MODULOS"
                        checked={cursoEditado.tipoCarga === 'MODULOS'}
                        onChange={(e) => setCursoEditado({ ...cursoEditado, tipoCarga: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Módulos</span>
                    </label>
                  </div>
                </div>

                {/* Cantidad de carga */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de carga *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cursoEditado.cantidadCarga || ''}
                    onChange={(e) => setCursoEditado({ ...cursoEditado, cantidadCarga: e.target.value })}
                    placeholder="Ej: 10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                             outline-none transition"
                  />
                </div>

                {/* Sección Horarios */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horarios
                  </label>
                  
                  {/* Formulario para agregar horario */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <select
                      value={nuevoHorarioEdicion.dia}
                      onChange={(e) => setNuevoHorarioEdicion({ ...nuevoHorarioEdicion, dia: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                               outline-none transition"
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia} value={dia}>
                          {dia}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={nuevoHorarioEdicion.desde}
                      onChange={(e) => setNuevoHorarioEdicion({ ...nuevoHorarioEdicion, desde: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                               outline-none transition"
                    />
                    <span className="self-center text-gray-600">hasta</span>
                    <input
                      type="time"
                      value={nuevoHorarioEdicion.hasta}
                      onChange={(e) => setNuevoHorarioEdicion({ ...nuevoHorarioEdicion, hasta: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                               outline-none transition"
                    />
                    <button
                      onClick={handleAgregarHorarioEdicion}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                               hover:bg-gray-700 transition font-medium"
                    >
                      Agregar horario
                    </button>
                  </div>

                  {/* Lista de horarios (ordenados) */}
                  {cursoEditado.horarios.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {ordenarHorarios(cursoEditado.horarios).map((horario, index) => {
                        // Encontrar el índice original para poder eliminar correctamente
                        const indiceOriginal = cursoEditado.horarios.findIndex(
                          (h) => h.dia === horario.dia && h.desde === horario.desde && h.hasta === horario.hasta
                        )
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <span className="text-sm text-gray-700">
                              {formatearHorario(horario)}
                            </span>
                            <button
                              onClick={() => handleEliminarHorarioEdicion(indiceOriginal)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGuardarEdicion(curso.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-green-700 transition font-medium"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={handleCancelarEdicion}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-gray-700 transition font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {curso.nombre}
                </h3>
                
                {/* Mostrar horarios (ordenados) */}
                {curso.horarios && curso.horarios.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {ordenarHorarios(curso.horarios).map((horario, index) => (
                        <span
                          key={index}
                          className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded"
                        >
                          {formatearHorario(horario)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navegar(`/cursos/${curso.id}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-blue-700 transition font-medium"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => handleIniciarEdicion(curso)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-yellow-700 transition font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(curso.id, curso.nombre)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-red-700 transition font-medium"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => abrirHistorialInasistencias(curso)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-indigo-700 transition font-medium"
                  >
                    Historial Inasistencias
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Modal de historial de inasistencias */}
      {showHistorialInasistencias && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">
              Historial de Inasistencias / Imponderables
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {cursoActivoHistorial?.nombre}
            </p>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Aquí se mostrarán los registros de inasistencias e imponderables del curso.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowHistorialInasistencias(false)
                  setCursoActivoHistorial(null)
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cursos
