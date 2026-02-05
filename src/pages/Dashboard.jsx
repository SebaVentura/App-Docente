import { useState, useEffect } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerHoyArgentina, obtenerDiaSemanaArgentina, normalizarDia, formatearFechaLargaArgentina } from '../utils/fechas'
import { obtenerEscuelas } from '../utils/datosEscuelas'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerAsistenciasPorFecha } from '../utils/datosAsistencia'

function Dashboard() {
  const { navegar } = useNavegacion()

  const [clasesHoy, setClasesHoy] = useState([])
  const [escuelas, setEscuelas] = useState([])
  const [escuelaFiltro, setEscuelaFiltro] = useState('todas')
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [fechaHoy, setFechaHoy] = useState('')
  const [diaSemana, setDiaSemana] = useState('')

  // Obtener datos al montar
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    
    try {
      // Obtener fecha y día de semana
      const hoy = obtenerHoyArgentina()
      const dia = obtenerDiaSemanaArgentina()
      setFechaHoy(hoy)
      setDiaSemana(dia)

      // Obtener escuelas
      const escuelasData = obtenerEscuelas()
      setEscuelas(escuelasData)

      // Obtener todos los cursos
      const todosLosCursos = obtenerCursos()

      // Crear mapa de escuelas para lookup rápido
      const mapaEscuelas = {}
      escuelasData.forEach(escuela => {
        mapaEscuelas[escuela.id] = escuela
      })

      // Normalizar día para comparación robusta (sin tildes, lowercase)
      const diaNormalizado = normalizarDia(dia)

      // Filtrar cursos que tengan horarios del día HOY (comparación normalizada)
      const cursosDelDia = todosLosCursos.filter(curso => 
        curso.horarios && curso.horarios.some(h => normalizarDia(h.dia) === diaNormalizado)
      )

      // Expandir: cada horario del día = 1 clase
      const clases = []
      cursosDelDia.forEach(curso => {
        const horariosDelDia = curso.horarios.filter(h => normalizarDia(h.dia) === diaNormalizado)
        const escuela = mapaEscuelas[curso.escuelaId]
        horariosDelDia.forEach(horario => {
          clases.push({
            cursoId: curso.id,
            cursoNombre: curso.nombre,
            escuelaId: curso.escuelaId,
            escuelaNombre: escuela?.nombre || '',
            desde: horario.desde,
            hasta: horario.hasta,
            asistenciaHecha: false, // Se actualizará con asistencia real
          })
        })
      })

      // Obtener asistencia (solo si hay clases, evitar N+1)
      // Una sola lectura de localStorage para todas las asistencias del día
      if (clases.length > 0) {
        const asistenciasDelDia = obtenerAsistenciasPorFecha(hoy)
        
        // Actualizar estado asistenciaHecha
        clases.forEach(clase => {
          clase.asistenciaHecha = asistenciasDelDia[String(clase.cursoId)] !== undefined
        })
      }

      // Ordenar por hora desde
      clases.sort((a, b) => a.desde.localeCompare(b.desde))
      
      setClasesHoy(clases)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setCargando(false)
    }
  }

  // Filtrar clases según filtros
  const clasesFiltradas = clasesHoy.filter(clase => {
    // Filtro por escuela (normalizar tipos)
    if (escuelaFiltro !== 'todas' && Number(clase.escuelaId) !== Number(escuelaFiltro)) {
      return false
    }
    
    // Filtro solo pendientes
    if (soloPendientes && clase.asistenciaHecha) {
      return false
    }
    
    return true
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Agenda del día
      </h2>

      {/* Fecha */}
      {fechaHoy && (
        <p className="text-gray-600 mb-6">
          {formatearFechaLargaArgentina(fechaHoy)}
        </p>
      )}

      {/* Filtros */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Escuela:
          </label>
          <select
            value={escuelaFiltro}
            onChange={(e) => setEscuelaFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     outline-none transition"
          >
            <option value="todas">Todas</option>
            {escuelas.map(escuela => (
              <option key={escuela.id} value={escuela.id}>
                {escuela.nombre}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={soloPendientes}
            onChange={(e) => setSoloPendientes(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded 
                     focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Solo pendientes
          </span>
        </label>
      </div>

      {/* Lista de clases */}
      {cargando ? (
        <p className="text-gray-600">Cargando...</p>
      ) : (
        <div className="space-y-4">
          {clasesFiltradas.map((clase, index) => (
            <div
              key={`${clase.cursoId}-${clase.desde}-${index}`}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {clase.desde}–{clase.hasta}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Escuela:</span> {clase.escuelaNombre}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Curso:</span> {clase.cursoNombre}
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      clase.asistenciaHecha
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {clase.asistenciaHecha ? 'Hecha' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navegar(`/cursos/${clase.cursoId}/asistencia`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                           hover:bg-blue-700 transition font-medium"
                >
                  Pasar asistencia
                </button>
                <button
                  onClick={() => navegar(`/cursos/${clase.cursoId}/registro`)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                           hover:bg-gray-700 transition font-medium"
                >
                  Registro de clase
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
