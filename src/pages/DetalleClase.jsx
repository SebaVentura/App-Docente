import { useState, useEffect } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerDetalleClase, guardarDetalleClase } from '../utils/datosClases'
import { obtenerMaterialClase } from '../utils/datosClasesAdmin'
import { obtenerArchivo } from '../utils/archivosLocal'

function DetalleClase({ cursoId, numeroClase }) {
  const { navegar } = useNavegacion()
  const [cursoNombre, setCursoNombre] = useState('')
  const [detalle, setDetalle] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [materialClase, setMaterialClase] = useState(null)
  
  useEffect(() => {
    const todosLosCursos = obtenerCursos()
    const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
    if (cursoEncontrado) {
      setCursoNombre(cursoEncontrado.nombre || '')
    }
    
    // Cargar detalle de la clase desde localStorage
    const datos = obtenerDetalleClase(cursoId, numeroClase)
    if (datos) {
      setDetalle(datos.detalle || '')
    }
    
    // Cargar material de la clase (solo lectura)
    const material = obtenerMaterialClase(cursoId, numeroClase)
    if (material) {
      setMaterialClase(material)
    }
  }, [cursoId, numeroClase])
  
  const handleGuardar = () => {
    setGuardando(true)
    guardarDetalleClase(cursoId, numeroClase, { detalle })
    setTimeout(() => {
      setGuardando(false)
    }, 300)
  }
  
  const handleVolver = () => {
    // Guardar antes de volver
    guardarDetalleClase(cursoId, numeroClase, { detalle })
    navegar(`/cursos/${cursoId}/clases`)
  }
  
  const abrirArchivo = async (archivoKey) => {
    try {
      const blob = await obtenerArchivo(archivoKey)
      if (!blob) {
        alert('Archivo no encontrado')
        return
      }
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Error al abrir archivo:', error)
      alert('Error al abrir el archivo')
    }
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Clase {numeroClase} – {cursoNombre || `Curso ${cursoId}`}
        </h2>
        <button
          onClick={handleVolver}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                   hover:bg-gray-700 transition font-medium"
        >
          ← Volver
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registro de la clase
          </label>
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Ingresá aquí el registro de la clase..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[400px] 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        
        {/* Material Teoría */}
        {materialClase?.teoria && (
          (materialClase.teoria.archivos?.length > 0 || materialClase.teoria.links?.length > 0) && (
            <div className="mb-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Material Teoría</h3>
              
              {/* Archivos PDF */}
              {materialClase.teoria.archivos && materialClase.teoria.archivos.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Archivos:</p>
                  <div className="space-y-2">
                    {materialClase.teoria.archivos.map((archivo, idx) => (
                      <button
                        key={idx}
                        onClick={() => abrirArchivo(archivo.key)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline mr-4"
                      >
                        📄 {archivo.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Links Drive */}
              {materialClase.teoria.links && materialClase.teoria.links.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Links Drive:</p>
                  <div className="space-y-2">
                    {materialClase.teoria.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline block"
                      >
                        🔗 {link.titulo || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* Material Práctica */}
        {materialClase?.practica && (
          (materialClase.practica.archivos?.length > 0 || materialClase.practica.links?.length > 0) && (
            <div className="mb-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Material Práctica</h3>
              
              {/* Archivos PDF */}
              {materialClase.practica.archivos && materialClase.practica.archivos.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Archivos:</p>
                  <div className="space-y-2">
                    {materialClase.practica.archivos.map((archivo, idx) => (
                      <button
                        key={idx}
                        onClick={() => abrirArchivo(archivo.key)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline mr-4"
                      >
                        📄 {archivo.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Links Drive */}
              {materialClase.practica.links && materialClase.practica.links.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Links Drive:</p>
                  <div className="space-y-2">
                    {materialClase.practica.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline block"
                      >
                        🔗 {link.titulo || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              guardando
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetalleClase
