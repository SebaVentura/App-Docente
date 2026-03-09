import { useState, useEffect } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerHoyArgentina, obtenerDiaSemanaArgentina, normalizarDia, formatearFechaLargaArgentina } from '../utils/fechas'
import { isoToAR } from '../utils/dateAR'
import { obtenerEscuelas } from '../utils/datosEscuelas'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerAsistenciasPorFecha } from '../utils/datosAsistencia'
import { addLeave, getLeaveForDate } from '../utils/datosLicencias'
import AgendaSemanal from '../components/dashboard/AgendaSemanal'

function Dashboard() {
  const { navegar } = useNavegacion()

  const [clasesHoy, setClasesHoy] = useState([])
  const [escuelas, setEscuelas] = useState([])
  const [escuelaFiltro, setEscuelaFiltro] = useState('todas')
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [fechaHoy, setFechaHoy] = useState('')
  const [diaSemana, setDiaSemana] = useState('')
  const [showImponderables, setShowImponderables] = useState(false)
  const [dictadoActivo, setDictadoActivo] = useState(null)
  const [tipoImponderable, setTipoImponderable] = useState('')
  const [observacion, setObservacion] = useState('')

  // Modal licencias
  const [showLicencias, setShowLicencias] = useState(false)
  const [licenciaForm, setLicenciaForm] = useState({
    tipo: '',
    desde: '',
    hasta: '',
    observacion: ''
  })

  // Tipos de imponderable y licencias
  const TIPOS_IMPONDERABLE = [
    'Injustificada',
    'Lic médico',
    'Lic adm',
    'Otra lic',
    'Paro',
    'Profilaxis',
    'Otro'
  ]

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

  // Función abrir modal
  const abrirModalImponderables = (dictado) => {
    setDictadoActivo(dictado)
    setShowImponderables(true)
  }

  // Licencia activa para la fecha del día (DD-MM-AAAA)
  const fechaHoyAR = fechaHoy ? isoToAR(fechaHoy) : ''
  const licenciaActiva = fechaHoyAR ? getLeaveForDate(fechaHoyAR) : null

  const guardarLicencia = () => {
    if (!licenciaForm.tipo.trim()) {
      alert('Seleccione el tipo de licencia')
      return
    }
    const id = addLeave(licenciaForm)
    if (!id) {
      alert('Verifique las fechas: deben ser DD-MM-AAAA y desde debe ser menor o igual que hasta')
      return
    }
    setShowLicencias(false)
    setLicenciaForm({ tipo: '', desde: '', hasta: '', observacion: '' })
  }

  // Función guardar (solo front por ahora)
  const guardarImponderable = () => {
    const payload = {
      cursoId: dictadoActivo?.cursoId,
      tipo: tipoImponderable,
      observacion,
      fecha: new Date()
    }

    console.log('Nuevo imponderable:', payload)

    setShowImponderables(false)
    setTipoImponderable('')
    setObservacion('')
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      {/* Columna principal: Agenda del día — ancho contenido, no crece */}
      <div className="min-w-0 lg:max-w-xl lg:flex-shrink-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Agenda del día
      </h2>

      {/* Fecha */}
      {fechaHoy && (
        <p className="text-gray-600 mb-6">
          {formatearFechaLargaArgentina(fechaHoy)}
        </p>
      )}

      {/* Banner licencia activa */}
      {licenciaActiva && (
        <div className="mb-6 p-4 bg-amber-100 border border-amber-300 rounded-lg text-amber-900">
          <strong>Licencia activa:</strong> {licenciaActiva.tipo} ({licenciaActiva.desde} – {licenciaActiva.hasta})
        </div>
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

        <button
          onClick={() => setShowLicencias(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition font-medium"
        >
          Cargar licencia
        </button>
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
              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-lg font-semibold text-gray-900">
                    {clase.desde}–{clase.hasta}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${
                      clase.asistenciaHecha
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {clase.asistenciaHecha ? 'Hecha' : 'Pendiente'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Escuela:</span> {clase.escuelaNombre}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Curso:</span> {clase.cursoNombre}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navegar(`/cursos/${clase.cursoId}/asistencia`)}
                  disabled={!!licenciaActiva}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                           hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pasar asistencia
                </button>
                <button
                  onClick={() => navegar(`/cursos/${clase.cursoId}/trayectorias`)}
                  disabled={!!licenciaActiva}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                           hover:bg-gray-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registro de clase
                </button>
                <button
                  onClick={() => abrirModalImponderables(clase)}
                  disabled={!!licenciaActiva}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Inasistencia / Imponderable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Panel derecho (desktop) / debajo (mobile): Agenda semanal — ocupa el resto del espacio */}
      <div className="mt-6 lg:mt-0 lg:flex-1 lg:min-w-0">
        <AgendaSemanal />
      </div>

      {/* Modal Cargar licencia */}
      {showLicencias && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Cargar licencia</h3>

            <select
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              value={licenciaForm.tipo}
              onChange={(e) => setLicenciaForm(f => ({ ...f, tipo: e.target.value }))}
            >
              <option value="">Seleccionar tipo</option>
              {TIPOS_IMPONDERABLE.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Desde (DD-MM-AAAA)"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              value={licenciaForm.desde}
              onChange={(e) => setLicenciaForm(f => ({ ...f, desde: e.target.value }))}
            />

            <input
              type="text"
              placeholder="Hasta (DD-MM-AAAA)"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              value={licenciaForm.hasta}
              onChange={(e) => setLicenciaForm(f => ({ ...f, hasta: e.target.value }))}
            />

            <textarea
              placeholder="Observación (opcional)"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              value={licenciaForm.observacion}
              onChange={(e) => setLicenciaForm(f => ({ ...f, observacion: e.target.value }))}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLicencias(false)
                  setLicenciaForm({ tipo: '', desde: '', hasta: '', observacion: '' })
                }}
                className="px-3 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={guardarLicencia}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imponderables */}
      {showImponderables && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Registro de inasistencia / imponderable
            </h3>

            <select
              className="w-full border rounded-lg p-2 mb-4"
              value={tipoImponderable}
              onChange={(e) => setTipoImponderable(e.target.value)}
            >
              <option value="">Seleccionar motivo</option>
              {TIPOS_IMPONDERABLE.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <textarea
              placeholder="Observación (opcional)"
              className="w-full border rounded-lg p-2 mb-4"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImponderables(false)}
                className="px-3 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={guardarImponderable}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
