import { useRef } from 'react'

/**
 * Grilla editable con alumnos, valor y observación.
 * Soporta paste desde Excel (split por \n y \t).
 * @param {Object} props
 * @param {Array<{alumnoKey, alumno}>} props.filas - Filas con alumnoKey y datos alumno
 * @param {string} props.modo - nota_num | texto | marca
 * @param {Array<{studentId, valor, estado, obs}>} props.detalles
 * @param {Function} props.onDetallesChange
 */
export default function GrillaAlumnosEvento({ filas, modo, detalles, onDetallesChange }) {
  const grillaRef = useRef(null)

  const getValor = (alumnoKey) => {
    const d = detalles.find(x => x.studentId === alumnoKey)
    return d?.valor ?? ''
  }

  const getObs = (alumnoKey) => {
    const d = detalles.find(x => x.studentId === alumnoKey)
    return d?.obs ?? ''
  }

  const setValor = (alumnoKey, valor) => {
    const idx = detalles.findIndex(d => d.studentId === alumnoKey)
    if (idx >= 0) {
      onDetallesChange(detalles.map((d, i) => 
        i === idx ? { ...d, valor: String(valor) } : d
      ))
    } else {
      onDetallesChange([...detalles, { studentId: alumnoKey, valor: String(valor), estado: null, obs: '' }])
    }
  }

  const setObs = (alumnoKey, obs) => {
    const idx = detalles.findIndex(d => d.studentId === alumnoKey)
    if (idx >= 0) {
      onDetallesChange(detalles.map((d, i) => 
        i === idx ? { ...d, obs: String(obs) } : d
      ))
    } else {
      onDetallesChange([...detalles, { studentId: alumnoKey, valor: '', estado: null, obs: String(obs) }])
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (!text || !text.trim()) return
    const rows = text.trim().split(/\r?\n/)
    const values = rows.map(row => {
      const cols = row.split(/\t/)
      return cols[0]?.trim() ?? ''
    })
    const newDetalles = filas.map((fila, idx) => {
      const valor = values[idx] ?? ''
      const existing = detalles.find(d => d.studentId === fila.alumnoKey)
      return existing 
        ? { ...existing, valor }
        : { studentId: fila.alumnoKey, valor, estado: null, obs: '' }
    })
    onDetallesChange(newDetalles)
  }

  return (
    <div
      ref={grillaRef}
      onPaste={handlePaste}
      className="overflow-x-auto border border-gray-200 rounded-lg"
    >
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Alumno</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Valor</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Observación</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ alumnoKey, alumno }) => (
            <tr key={alumnoKey} className="border-t border-gray-100">
              <td className="px-3 py-2 text-gray-900">
                {alumno.apellido}, {alumno.nombre}
              </td>
              <td className="px-3 py-2">
                {modo === 'nota_num' && (
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-20 border border-gray-300 rounded px-2 py-1"
                    value={getValor(alumnoKey)}
                    onChange={(e) => setValor(alumnoKey, e.target.value)}
                  />
                )}
                {modo === 'texto' && (
                  <input
                    type="text"
                    className="w-full max-w-xs border border-gray-300 rounded px-2 py-1"
                    value={getValor(alumnoKey)}
                    onChange={(e) => setValor(alumnoKey, e.target.value)}
                  />
                )}
                {modo === 'marca' && (
                  <select
                    className="border border-gray-300 rounded px-2 py-1"
                    value={getValor(alumnoKey)}
                    onChange={(e) => setValor(alumnoKey, e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="presente">Presente</option>
                    <option value="ausente">Ausente</option>
                  </select>
                )}
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  placeholder="Opcional"
                  className="w-full max-w-xs border border-gray-300 rounded px-2 py-1"
                  value={getObs(alumnoKey)}
                  onChange={(e) => setObs(alumnoKey, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2 px-2">
        Podés pegar una columna desde Excel para llenar los valores por alumno.
      </p>
    </div>
  )
}
