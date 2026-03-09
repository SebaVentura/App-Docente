import { useState, useEffect } from 'react'
import { generarAlumnoKey } from '../../utils/datosTrayectorias'
import {
  obtenerBorrador,
  guardarBorrador,
  getFilaVacia
} from '../../utils/datosPlanillaCalificaciones'

function detectarDuplicados(alumnos) {
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
  Object.keys(nombresNormalizados).forEach((nombre) => {
    if (nombresNormalizados[nombre] > 1) duplicados[nombre] = true
  })
  return duplicados
}

function condicionAR(condiciones) {
  if (!Array.isArray(condiciones)) return ''
  if (condiciones.includes('RECURSA')) return 'R'
  if (condiciones.includes('CURSA')) return 'C'
  return ''
}

export default function ModalPlanillaCalificaciones({
  cursoId,
  cursoNombre,
  alumnos,
  onClose
}) {
  const [encabezado, setEncabezado] = useState({
    materia: '',
    profesor: '',
    preceptor: '',
    anio: '',
    seccion: '',
    turno: ''
  })
  const [filas, setFilas] = useState({})
  const [guardado, setGuardado] = useState(false)

  const duplicados = detectarDuplicados(alumnos || [])
  const filasOrdenadas = (alumnos || []).map((alumno, idx) => {
    let hayDuplicado = false
    if (!alumno.legajo && !alumno.id) {
      const apellido = (alumno.apellido || '').toUpperCase().trim()
      const nombre = (alumno.nombre || '').toUpperCase().trim()
      const nombreNormalizado = `${apellido},${nombre}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      hayDuplicado = duplicados[nombreNormalizado] === true
    }
    const alumnoKey = generarAlumnoKey(alumno, idx, cursoId, hayDuplicado)
    return { alumnoKey, alumno, idx }
  })

  useEffect(() => {
    const borrador = obtenerBorrador(cursoId)
    const dups = detectarDuplicados(alumnos || [])
    const lista = (alumnos || []).map((alumno, idx) => {
      let hayDuplicado = false
      if (!alumno.legajo && !alumno.id) {
        const apellido = (alumno.apellido || '').toUpperCase().trim()
        const nombre = (alumno.nombre || '').toUpperCase().trim()
        const nombreNormalizado = `${apellido},${nombre}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        hayDuplicado = dups[nombreNormalizado] === true
      }
      return {
        alumnoKey: generarAlumnoKey(alumno, idx, cursoId, hayDuplicado),
        alumno,
        idx
      }
    })

    if (borrador) {
      setEncabezado(borrador.encabezado || { materia: '', profesor: '', preceptor: '', anio: '', seccion: '', turno: '' })
      const mergedFilas = { ...(borrador.filas || {}) }
      lista.forEach(({ alumnoKey, alumno }) => {
        if (!mergedFilas[alumnoKey]) {
          mergedFilas[alumnoKey] = { ...getFilaVacia(), cursRecurs: condicionAR(alumno.condiciones) }
        }
      })
      setFilas(mergedFilas)
    } else {
      const filasIniciales = {}
      lista.forEach(({ alumnoKey, alumno }) => {
        filasIniciales[alumnoKey] = {
          ...getFilaVacia(),
          cursRecurs: condicionAR(alumno.condiciones)
        }
      })
      setFilas(filasIniciales)
    }
  }, [cursoId, alumnos])

  const getValor = (alumnoKey, campo) => {
    return filas[alumnoKey]?.[campo] ?? ''
  }

  const setValor = (alumnoKey, campo, valor) => {
    setFilas((prev) => ({
      ...prev,
      [alumnoKey]: {
        ...(prev[alumnoKey] || getFilaVacia()),
        [campo]: String(valor ?? '')
      }
    }))
    setGuardado(false)
  }

  const handleGuardar = () => {
    guardarBorrador(cursoId, { encabezado, filas })
    setGuardado(true)
  }

  if (!alumnos || alumnos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md shadow-xl">
          <p className="text-gray-600 mb-4">No hay alumnos en este curso.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  const COLUMNAS = [
    { key: 'cursRecurs', label: 'C/R', tipo: 'select', opts: ['', 'C', 'R'] },
    { key: 'parciales1', label: 'Parciales 1°', tipo: 'text' },
    { key: 'valoracion1', label: 'Valoración 1°', tipo: 'text' },
    { key: 'calif1', label: 'Calif. 1°', tipo: 'number' },
    { key: 'intensif1', label: 'Intensif. 1°', tipo: 'text' },
    { key: 'inasist1', label: 'Inasist. 1°', tipo: 'number' },
    { key: 'parciales2', label: 'Parciales 2°', tipo: 'text' },
    { key: 'valoracion2', label: 'Valoración 2°', tipo: 'text' },
    { key: 'calif2', label: 'Calif. 2°', tipo: 'number' },
    { key: 'intensif2', label: 'Intensif. 2°', tipo: 'text' },
    { key: 'inasist2', label: 'Inasist. 2°', tipo: 'number' },
    { key: 'diciembre', label: 'Diciembre', tipo: 'text' },
    { key: 'febrero', label: 'Febrero', tipo: 'text' },
    { key: 'califFinal', label: 'Calif. final', tipo: 'text' }
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-[95vw] max-w-[1400px] h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Planilla de calificaciones – {cursoNombre || `Curso ${cursoId}`}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleGuardar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Guardar borrador
            </button>
            {guardado && (
              <span className="text-sm text-green-600 font-medium self-center">Guardado</span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto p-6">
          {/* Encabezado */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Materia / espacio curricular</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={encabezado.materia}
                onChange={(e) => { setEncabezado((p) => ({ ...p, materia: e.target.value })); setGuardado(false) }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Profesor/a</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={encabezado.profesor}
                onChange={(e) => { setEncabezado((p) => ({ ...p, profesor: e.target.value })); setGuardado(false) }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preceptor/a</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={encabezado.preceptor}
                onChange={(e) => { setEncabezado((p) => ({ ...p, preceptor: e.target.value })); setGuardado(false) }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="2025"
                value={encabezado.anio}
                onChange={(e) => { setEncabezado((p) => ({ ...p, anio: e.target.value })); setGuardado(false) }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sección</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={encabezado.seccion}
                onChange={(e) => { setEncabezado((p) => ({ ...p, seccion: e.target.value })); setGuardado(false) }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Turno</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="Mañana / Tarde / Noche"
                value={encabezado.turno}
                onChange={(e) => { setEncabezado((p) => ({ ...p, turno: e.target.value })); setGuardado(false) }}
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-700 w-10">
                    N°
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-700 min-w-[160px]">
                    Apellido y nombre
                  </th>
                  {COLUMNAS.map((col) => (
                    <th
                      key={col.key}
                      className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-700"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasOrdenadas.map(({ alumnoKey, alumno, idx }) => (
                  <tr key={alumnoKey} className="border-t border-gray-100">
                    <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-200 px-2 py-1 text-gray-900">
                      {alumno.apellido}, {alumno.nombre}
                    </td>
                    {COLUMNAS.map((col) => (
                      <td key={col.key} className="border border-gray-200 p-0">
                        {col.tipo === 'select' ? (
                          <select
                            className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                            value={getValor(alumnoKey, col.key)}
                            onChange={(e) => setValor(alumnoKey, col.key, e.target.value)}
                          >
                            {col.opts.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt || '—'}
                              </option>
                            ))}
                          </select>
                        ) : col.tipo === 'number' ? (
                          <input
                            type="number"
                            min="0"
                            className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                            value={getValor(alumnoKey, col.key)}
                            onChange={(e) => setValor(alumnoKey, col.key, e.target.value)}
                          />
                        ) : (
                          <input
                            type="text"
                            className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 min-w-[60px]"
                            value={getValor(alumnoKey, col.key)}
                            onChange={(e) => setValor(alumnoKey, col.key, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Espacio para futura exportación/impresión */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-2">
            <button
              disabled
              className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
              title="Próximamente"
            >
              Exportar / Imprimir
            </button>
            <span className="text-xs text-gray-500">(próximamente)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
