import { useState } from 'react'
import { isValidAR } from '../../utils/dateAR'
import { guardarEventoMasivo } from '../../utils/datosEventosMasivos'
import { generarAlumnoKey } from '../../utils/datosTrayectorias'
import GrillaAlumnosEvento from './GrillaAlumnosEvento'

const TIPOS_EVENTO = ['Examen', 'Evaluación', 'Entrega', 'Otro']
const MODOS = [
  { value: 'nota_num', label: 'Nota numérica (1-10)' },
  { value: 'texto', label: 'Texto' },
  { value: 'marca', label: 'Marca (Presente/Ausente)' }
]

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
  Object.keys(nombresNormalizados).forEach(nombre => {
    if (nombresNormalizados[nombre] > 1) duplicados[nombre] = true
  })
  return duplicados
}

/**
 * Modal de 2 pasos para crear un evento masivo.
 * @param {Object} props
 * @param {string} props.cursoId
 * @param {Array} props.alumnos
 * @param {Function} props.onClose
 * @param {Function} props.onSuccess
 */
export default function ModalEventoMasivo({ cursoId, alumnos, onClose, onSuccess }) {
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({
    fecha: '',
    tipo: '',
    titulo: '',
    modo: 'nota_num'
  })
  const [detalles, setDetalles] = useState([])

  const duplicados = detectarDuplicados(alumnos)
  const filas = alumnos.map((alumno, idx) => {
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
    return { alumnoKey, alumno }
  })

  // Inicializar detalles cuando pasamos al paso 2
  const irPaso2 = () => {
    if (!form.fecha.trim()) {
      alert('La fecha es obligatoria')
      return
    }
    if (!isValidAR(form.fecha)) {
      alert('La fecha debe estar en formato DD-MM-AAAA')
      return
    }
    if (!form.titulo.trim()) {
      alert('El título es obligatorio')
      return
    }
    const dets = filas.map(f => {
      const existing = detalles.find(d => d.studentId === f.alumnoKey)
      return existing || { studentId: f.alumnoKey, valor: '', estado: null, obs: '' }
    })
    setDetalles(dets)
    setPaso(2)
  }

  const procesar = () => {
    if (!form.titulo.trim()) {
      alert('El título es obligatorio')
      return
    }
    if (form.modo === 'nota_num') {
      const invalidos = detalles.filter(d => {
        const v = d.valor?.trim()
        if (!v) return false
        const n = Number(v)
        return isNaN(n) || n < 1 || n > 10
      })
      if (invalidos.length > 0) {
        alert('Las notas deben estar entre 1 y 10')
        return
      }
    }
    const id = guardarEventoMasivo({
      courseId: cursoId,
      fecha: form.fecha.trim(),
      tipo: form.tipo.trim(),
      titulo: form.titulo.trim(),
      modo: form.modo,
      detalles
    })
    if (!id) {
      alert('Error al guardar. Verifique la fecha (DD-MM-AAAA).')
      return
    }
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-lg font-semibold mb-4">
          {paso === 1 ? 'Nuevo evento masivo - Datos' : 'Nuevo evento masivo - Alumnos'}
        </h3>

        {paso === 1 && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha (DD-MM-AAAA)</label>
                <input
                  type="text"
                  placeholder="DD-MM-AAAA"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.fecha}
                  onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.tipo}
                  onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  {TIPOS_EVENTO.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  placeholder="Título del evento"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.titulo}
                  onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modo de carga</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.modo}
                  onChange={(e) => setForm(f => ({ ...f, modo: e.target.value }))}
                >
                  {MODOS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={onClose} className="px-3 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={irPaso2} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Siguiente</button>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="mb-4 max-h-80 overflow-y-auto">
              <GrillaAlumnosEvento
                filas={filas}
                modo={form.modo}
                detalles={detalles}
                onDetallesChange={setDetalles}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPaso(1)} className="px-3 py-2 bg-gray-200 rounded-lg">Volver</button>
              <button onClick={procesar} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Procesar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
