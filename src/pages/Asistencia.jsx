import { useState, useEffect } from 'react'
import { obtenerHoyArgentina } from '../utils/fechas'
import { obtenerAsistencia, guardarAsistencia } from '../utils/datosAsistencia'
import { obtenerCursos } from '../utils/datosCursos'
import { estaEnPeriodoIntensificacion } from '../utils/periodos'

function Asistencia({ cursoId }) {
  // Alumnos del curso (desde curso.alumnos en localStorage)
  const [alumnosDelCurso, setAlumnosDelCurso] = useState([])
  const [alumnosParaAsistencia, setAlumnosParaAsistencia] = useState([])

  // Estado por alumno: presente, tarde, horaIngreso
  const [asistencia, setAsistencia] = useState({})

  const [mensajeGuardado, setMensajeGuardado] = useState(false)

  // Cargar alumnos del curso desde localStorage
  useEffect(() => {
    const todosLosCursos = obtenerCursos()
    const idCurso = Number(cursoId)
    const cursoEncontrado = todosLosCursos.find(c => c.id === idCurso)
    
    if (cursoEncontrado && Array.isArray(cursoEncontrado.alumnos)) {
      setAlumnosDelCurso(cursoEncontrado.alumnos)
    } else {
      setAlumnosDelCurso([])
    }
  }, [cursoId])

  // Filtrar alumnos según período de intensificación
  useEffect(() => {
    if (alumnosDelCurso.length === 0) {
      setAlumnosParaAsistencia([])
      return
    }

    const fechaHoy = obtenerHoyArgentina()
    const enPeriodo = estaEnPeriodoIntensificacion(fechaHoy)

    const alumnosFiltrados = alumnosDelCurso.filter(alumno => {
      const condiciones = alumno.condiciones || []
      const tieneCursa = condiciones.includes('CURSA')
      const tieneRecursa = condiciones.includes('RECURSA')
      const tieneIntensifica = condiciones.includes('INTENSIFICA')

      if (enPeriodo) {
        // Durante período: incluir CURSA, RECURSA o INTENSIFICA
        return tieneCursa || tieneRecursa || tieneIntensifica
      } else {
        // Fuera de período: incluir solo CURSA o RECURSA
        return tieneCursa || tieneRecursa
      }
    })

    setAlumnosParaAsistencia(alumnosFiltrados)
  }, [alumnosDelCurso])

  // Inicializar asistencia cuando se cargan los alumnos
  useEffect(() => {
    if (alumnosParaAsistencia.length === 0) {
      setAsistencia({})
      return
    }
    
    const fechaHoy = obtenerHoyArgentina()
    const idCurso = Number(cursoId)
    const asistenciaGuardada = obtenerAsistencia(fechaHoy, idCurso)
    
    if (asistenciaGuardada) {
      // Retrocompatibilidad: cargar asistencia guardada
      setAsistencia(asistenciaGuardada)
    } else {
      // Inicializar estado vacío para cada alumno
      const estadoInicial = {}
      alumnosParaAsistencia.forEach((alumno) => {
        estadoInicial[alumno.id] = {
          presente: false,
          tarde: false,
          horaIngreso: null,
        }
      })
      setAsistencia(estadoInicial)
    }
  }, [alumnosParaAsistencia, cursoId])

  // Obtener fecha actual formateada
  const obtenerFecha = () => {
    const hoy = new Date()
    const opciones = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return hoy.toLocaleDateString('es-AR', opciones)
  }

  // Obtener hora actual (HH:MM)
  const obtenerHoraActual = () => {
    const ahora = new Date()
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    return `${horas}:${minutos}`
  }

  // Marcar como Presente
  const marcarPresente = (alumnoId) => {
    setAsistencia((prev) => ({
      ...prev,
      [alumnoId]: {
        presente: true,
        tarde: false,
        horaIngreso: null,
      },
    }))
    setMensajeGuardado(false)
  }

  // Marcar como Ausente
  const marcarAusente = (alumnoId) => {
    setAsistencia((prev) => ({
      ...prev,
      [alumnoId]: {
        presente: false,
        tarde: false,
        horaIngreso: null,
      },
    }))
    setMensajeGuardado(false)
  }

  // Marcar como Tarde (solo si está Presente)
  const marcarTarde = (alumnoId) => {
    setAsistencia((prev) => ({
      ...prev,
      [alumnoId]: {
        presente: true,
        tarde: true,
        horaIngreso: obtenerHoraActual(),
      },
    }))
    setMensajeGuardado(false)
  }

  // Marcar todos como presentes
  const marcarTodosPresentes = () => {
    const nuevoEstado = {}
    alumnosParaAsistencia.forEach((alumno) => {
      nuevoEstado[alumno.id] = {
        presente: true,
        tarde: false,
        horaIngreso: null,
      }
    })
    setAsistencia(nuevoEstado)
    setMensajeGuardado(false)
  }

  // Calcular contadores
  const contarPresentes = () => {
    return Object.values(asistencia).filter((estado) => estado.presente).length
  }

  const contarAusentes = () => {
    return Object.values(asistencia).filter((estado) => !estado.presente).length
  }

  const handleGuardar = () => {
    // Guardar en localStorage
    const fechaHoy = obtenerHoyArgentina()
    const idCurso = Number(cursoId)
    guardarAsistencia(fechaHoy, idCurso, asistencia)
    
    setMensajeGuardado(true)
    // Después de 3 segundos ocultar el mensaje
    setTimeout(() => {
      setMensajeGuardado(false)
    }, 3000)
  }

  const presentes = contarPresentes()
  const ausentes = contarAusentes()

  // Si no hay alumnos, mostrar mensaje simple
  if (alumnosParaAsistencia.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Asistencia – Curso {cursoId}
        </h2>
        <p className="text-gray-600">
          Este curso no tiene alumnos cargados
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Asistencia – Curso {cursoId}
      </h2>

      {/* Fecha */}
      <p className="text-gray-600 mb-4">
        {obtenerFecha()}
      </p>

      {/* Contadores */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <span className="text-lg font-semibold text-gray-900">
          Presentes: {presentes} | Ausentes: {ausentes}
        </span>
      </div>

      {/* Botón Todos presentes */}
      <div className="mb-6">
        <button
          onClick={marcarTodosPresentes}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                   font-medium hover:bg-gray-700 transition"
        >
          Todos presentes
        </button>
      </div>

      {/* Lista de alumnos */}
      <div className="space-y-3 mb-6">
        {alumnosParaAsistencia.map((alumno) => {
          const estado = asistencia[alumno.id]
          const estaPresente = estado?.presente || false
          const estaTarde = estado?.tarde || false
          
          // Determinar color según estado
          let colorClase = ''
          if (!estaPresente) {
            colorClase = 'border-red-500 bg-red-50'
          } else if (estaTarde) {
            colorClase = 'border-yellow-500 bg-yellow-50'
          } else {
            colorClase = 'border-green-500 bg-green-50'
          }

          return (
            <div
              key={alumno.id}
              className={`bg-white rounded-lg shadow p-4 border-2 transition ${colorClase}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium text-gray-900">
                  {alumno.apellido}, {alumno.nombre}
                  {alumno.dni && (
                    <span className="text-sm text-gray-500 ml-2">(DNI: {alumno.dni})</span>
                  )}
                </span>
                {estaTarde && estado?.horaIngreso && (
                  <span className="text-sm text-gray-600 font-medium">
                    Ingreso: {estado.horaIngreso}
                  </span>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={() => marcarPresente(alumno.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    estaPresente && !estaTarde
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Presente
                </button>
                <button
                  onClick={() => marcarAusente(alumno.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    !estaPresente
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Ausente
                </button>
                <button
                  onClick={() => marcarTarde(alumno.id)}
                  disabled={!estaPresente}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    estaTarde
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : estaPresente
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Tarde
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botón guardar y mensaje */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGuardar}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg 
                   font-medium hover:bg-blue-700 transition"
        >
          Guardar asistencia
        </button>
        {mensajeGuardado && (
          <span className="text-green-600 font-medium">
            Asistencia registrada
          </span>
        )}
      </div>
    </div>
  )
}

export default Asistencia
