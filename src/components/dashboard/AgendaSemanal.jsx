import { useMemo } from 'react'
import { obtenerCursos } from '../../utils/datosCursos'
import { obtenerEscuelas } from '../../utils/datosEscuelas'
import { normalizarDia } from '../../utils/fechas'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTO = { Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb' }

function abreviarEscuela(nombre) {
  if (!nombre || typeof nombre !== 'string') return ''
  const n = nombre.trim()
  if (n.length <= 14) return n
  const numMatch = n.match(/N[°º]?\s*(\d+)/i)
  if (numMatch) {
    const sinNum = n.replace(/\s*N[°º]?\s*\d+.*$/i, '').trim()
    const siglas = sinNum.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 4)
    return siglas ? `${siglas} ${numMatch[1]}` : n.slice(0, 12) + '…'
  }
  return n.slice(0, 12) + '…'
}

/**
 * Construye la matriz semanal: franjas horarias × días.
 * Retorna { franjas, diasSemana, matriz }
 * matriz[franjaIdx][dia] = [{ escuelaNombre, cursoNombre }]
 */
function buildMatrizSemanal(cursos, mapaEscuelas) {
  const franjasSet = new Set()

  cursos.forEach(curso => {
    if (!curso.horarios || !Array.isArray(curso.horarios)) return
    curso.horarios.forEach(h => {
      if (h.desde && h.hasta) franjasSet.add(`${h.desde}–${h.hasta}`)
    })
  })

  const franjas = Array.from(franjasSet).sort((a, b) => {
    const desdeA = a.split('–')[0]
    const desdeB = b.split('–')[0]
    return desdeA.localeCompare(desdeB)
  })

  const diasSemana = [...DIAS_SEMANA]

  const matriz = franjas.map(() =>
    Object.fromEntries(diasSemana.map(d => [d, []]))
  )

  cursos.forEach(curso => {
    const escuela = mapaEscuelas[curso.escuelaId]
    const escuelaNombre = escuela?.nombre || ''
    const escuelaCorto = abreviarEscuela(escuelaNombre)
    const cursoNombre = curso.nombre || ''

    if (!curso.horarios || !Array.isArray(curso.horarios)) return

    curso.horarios.forEach(h => {
      if (!h.desde || !h.hasta) return
      const franjaKey = `${h.desde}–${h.hasta}`
      const dia = diasSemana.find(d => normalizarDia(d) === normalizarDia(h.dia))
      if (!dia) return

      const idx = franjas.indexOf(franjaKey)
      if (idx === -1) return

      matriz[idx][dia].push({
        escuelaNombre: escuelaCorto || escuelaNombre,
        cursoNombre
      })
    })
  })

  return { franjas, diasSemana, matriz }
}

export default function AgendaSemanal({ className = '' }) {
  const { franjas, diasSemana, matriz } = useMemo(() => {
    const cursos = obtenerCursos()
    const escuelas = obtenerEscuelas()
    const mapaEscuelas = {}
    escuelas.forEach(e => { mapaEscuelas[e.id] = e })
    return buildMatrizSemanal(cursos, mapaEscuelas)
  }, [])

  if (franjas.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Agenda semanal</h3>
        <p className="text-xs text-gray-500">Sin horarios cargados</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 px-3 py-2 border-b border-gray-200">
        Agenda semanal
      </h3>
      <div className="overflow-hidden">
        <table className="w-full table-fixed text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700 w-16">
                Horario
              </th>
              {diasSemana.map(dia => (
                <th key={dia} className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700" title={dia}>
                  {DIAS_CORTO[dia] ?? dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {franjas.map((franja, idx) => (
              <tr key={franja}>
                <td className="border border-gray-200 px-2 py-1 text-gray-600 font-medium w-16">
                  {franja}
                </td>
                {diasSemana.map(dia => {
                  const items = matriz[idx][dia] || []
                  const isEmpty = items.length === 0
                  return (
                    <td
                      key={dia}
                      className={`border border-gray-200 px-2 py-1 align-top ${
                        isEmpty ? 'bg-gray-50/60' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        {items.map((item, i) => (
                          <div key={i} className="text-gray-800 leading-tight">
                            <div className="font-medium">{item.escuelaNombre}</div>
                            <div className="text-gray-600">{item.cursoNombre}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
