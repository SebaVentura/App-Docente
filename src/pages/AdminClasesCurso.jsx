import { useState, useEffect } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerClasesCurso } from '../utils/datosClases'
import {
  obtenerMaterialClase,
  agregarArchivoClase,
  eliminarArchivoClase,
  agregarLinkClase,
  eliminarLinkClase
} from '../utils/datosClasesAdmin'
import { guardarArchivo, borrarArchivo } from '../utils/archivosLocal'

function AdminClasesCurso({ cursoId }) {
  const { navegar } = useNavegacion()
  const [cursoNombre, setCursoNombre] = useState('')
  const [totalClases, setTotalClases] = useState(32)
  const [claseSeleccionada, setClaseSeleccionada] = useState(1)
  const [material, setMaterial] = useState(null)
  
  // Estados para uploads
  const [archivoTeoria, setArchivoTeoria] = useState(null)
  const [archivoPractica, setArchivoPractica] = useState(null)
  const [linkTeoria, setLinkTeoria] = useState({ url: '', titulo: '' })
  const [linkPractica, setLinkPractica] = useState({ url: '', titulo: '' })
  const [subiendo, setSubiendo] = useState(false)
  
  const cargarMaterial = () => {
    const mat = obtenerMaterialClase(cursoId, claseSeleccionada)
    setMaterial(mat || {
      teoria: { archivos: [], links: [] },
      practica: { archivos: [], links: [] }
    })
  }
  
  useEffect(() => {
    // Cargar nombre del curso
    const cursos = obtenerCursos()
    const curso = cursos.find(c => String(c.id) === String(cursoId))
    if (curso) {
      setCursoNombre(curso.nombre || '')
    }
    
    // Cargar total de clases
    const config = obtenerClasesCurso(cursoId)
    if (config && config.totalClases) {
      setTotalClases(config.totalClases)
    }
    
    // Cargar material de la clase seleccionada
    const mat = obtenerMaterialClase(cursoId, claseSeleccionada)
    setMaterial(mat || {
      teoria: { archivos: [], links: [] },
      practica: { archivos: [], links: [] }
    })
  }, [cursoId, claseSeleccionada])
  
  // Validar PDF
  const validarPDF = (file) => {
    if (!file) return false
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  }
  
  // Validar URL
  const validarURL = (url) => {
    try {
      const u = new URL(url)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }
  
  // Agregar archivo PDF
  const handleAgregarArchivo = async (tipo) => {
    const archivo = tipo === 'teoria' ? archivoTeoria : archivoPractica
    if (!archivo) {
      alert('Seleccioná un archivo')
      return
    }
    
    if (!validarPDF(archivo)) {
      alert('Solo se permiten archivos PDF')
      return
    }
    
    setSubiendo(true)
    try {
      // Guardar en IndexedDB
      const resultado = await guardarArchivo({
        blob: archivo,
        nombre: archivo.name,
        tipo: archivo.type || 'application/pdf'
      })
      
      // Guardar metadata en localStorage
      agregarArchivoClase(cursoId, claseSeleccionada, tipo, resultado)
      
      // Limpiar input
      if (tipo === 'teoria') {
        setArchivoTeoria(null)
        // Resetear input file
        const input = document.querySelector('input[type="file"][data-tipo="teoria"]')
        if (input) input.value = ''
      } else {
        setArchivoPractica(null)
        const input = document.querySelector('input[type="file"][data-tipo="practica"]')
        if (input) input.value = ''
      }
      
      // Recargar material
      cargarMaterial()
      
      alert('Archivo agregado correctamente')
    } catch (error) {
      console.error('Error al agregar archivo:', error)
      alert(error.message || 'Error al agregar archivo')
    } finally {
      setSubiendo(false)
    }
  }
  
  // Eliminar archivo
  const handleEliminarArchivo = async (tipo, archivoKey) => {
    if (!confirm('¿Eliminar este archivo?')) return
    
    try {
      // Borrar de IndexedDB
      await borrarArchivo(archivoKey)
      
      // Borrar metadata de localStorage
      eliminarArchivoClase(cursoId, claseSeleccionada, tipo, archivoKey)
      
      // Recargar material
      cargarMaterial()
      
      alert('Archivo eliminado')
    } catch (error) {
      console.error('Error al eliminar archivo:', error)
      alert('Error al eliminar archivo')
    }
  }
  
  // Agregar link
  const handleAgregarLink = (tipo) => {
    const link = tipo === 'teoria' ? linkTeoria : linkPractica
    if (!link.url.trim()) {
      alert('Ingresá una URL válida')
      return
    }
    
    if (!validarURL(link.url)) {
      alert('URL inválida. Debe comenzar con http:// o https://')
      return
    }
    
    agregarLinkClase(cursoId, claseSeleccionada, tipo, link)
    
    // Limpiar inputs
    if (tipo === 'teoria') {
      setLinkTeoria({ url: '', titulo: '' })
    } else {
      setLinkPractica({ url: '', titulo: '' })
    }
    
    // Recargar material
    cargarMaterial()
    
    alert('Link agregado correctamente')
  }
  
  // Eliminar link
  const handleEliminarLink = (tipo, linkIndex) => {
    if (!confirm('¿Eliminar este link?')) return
    
    eliminarLinkClase(cursoId, claseSeleccionada, tipo, linkIndex)
    cargarMaterial()
    alert('Link eliminado')
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Admin de Clases – {cursoNombre || `Curso ${cursoId}`}
        </h2>
        <button
          onClick={() => navegar(`/cursos/${cursoId}/clases`)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                   hover:bg-gray-700 transition font-medium"
        >
          ← Volver
        </button>
      </div>
      
      {/* Selector de clase */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar clase:
        </label>
        <input
          type="range"
          min="1"
          max={totalClases}
          value={claseSeleccionada}
          onChange={(e) => setClaseSeleccionada(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="text-center mt-2 text-lg font-semibold text-gray-900">
          Clase {claseSeleccionada}
        </div>
      </div>
      
      {/* Sección Teoría */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Material Teoría</h3>
        
        {/* Upload archivo */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar archivo PDF:
          </label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            data-tipo="teoria"
            onChange={(e) => setArchivoTeoria(e.target.files[0] || null)}
            className="mb-2"
          />
          {archivoTeoria && (
            <p className="text-sm text-gray-600 mb-2">
              Archivo seleccionado: {archivoTeoria.name}
            </p>
          )}
          <button
            onClick={() => handleAgregarArchivo('teoria')}
            disabled={!archivoTeoria || subiendo}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !archivoTeoria || subiendo
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {subiendo ? 'Subiendo...' : 'Agregar archivo'}
          </button>
        </div>
        
        {/* Lista de archivos */}
        {material?.teoria?.archivos && material.teoria.archivos.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Archivos cargados:</p>
            <div className="space-y-2">
              {material.teoria.archivos.map((archivo, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-700">📄 {archivo.nombre}</span>
                  <button
                    onClick={() => handleEliminarArchivo('teoria', archivo.key)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Agregar link */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar link Drive:
          </label>
          <input
            type="text"
            placeholder="URL del link (ej: https://drive.google.com/...)"
            value={linkTeoria.url}
            onChange={(e) => setLinkTeoria({ ...linkTeoria, url: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
          />
          <input
            type="text"
            placeholder="Título (opcional)"
            value={linkTeoria.titulo}
            onChange={(e) => setLinkTeoria({ ...linkTeoria, titulo: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
          />
          <button
            onClick={() => handleAgregarLink('teoria')}
            disabled={!linkTeoria.url.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !linkTeoria.url.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Agregar link
          </button>
        </div>
        
        {/* Lista de links */}
        {material?.teoria?.links && material.teoria.links.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Links cargados:</p>
            <div className="space-y-2">
              {material.teoria.links.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    🔗 {link.titulo || link.url}
                  </a>
                  <button
                    onClick={() => handleEliminarLink('teoria', idx)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Sección Práctica */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Material Práctica</h3>
        
        {/* Upload archivo */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar archivo PDF:
          </label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            data-tipo="practica"
            onChange={(e) => setArchivoPractica(e.target.files[0] || null)}
            className="mb-2"
          />
          {archivoPractica && (
            <p className="text-sm text-gray-600 mb-2">
              Archivo seleccionado: {archivoPractica.name}
            </p>
          )}
          <button
            onClick={() => handleAgregarArchivo('practica')}
            disabled={!archivoPractica || subiendo}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !archivoPractica || subiendo
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {subiendo ? 'Subiendo...' : 'Agregar archivo'}
          </button>
        </div>
        
        {/* Lista de archivos */}
        {material?.practica?.archivos && material.practica.archivos.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Archivos cargados:</p>
            <div className="space-y-2">
              {material.practica.archivos.map((archivo, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-700">📄 {archivo.nombre}</span>
                  <button
                    onClick={() => handleEliminarArchivo('practica', archivo.key)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Agregar link */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar link Drive:
          </label>
          <input
            type="text"
            placeholder="URL del link (ej: https://drive.google.com/...)"
            value={linkPractica.url}
            onChange={(e) => setLinkPractica({ ...linkPractica, url: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
          />
          <input
            type="text"
            placeholder="Título (opcional)"
            value={linkPractica.titulo}
            onChange={(e) => setLinkPractica({ ...linkPractica, titulo: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
          />
          <button
            onClick={() => handleAgregarLink('practica')}
            disabled={!linkPractica.url.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !linkPractica.url.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Agregar link
          </button>
        </div>
        
        {/* Lista de links */}
        {material?.practica?.links && material.practica.links.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Links cargados:</p>
            <div className="space-y-2">
              {material.practica.links.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    🔗 {link.titulo || link.url}
                  </a>
                  <button
                    onClick={() => handleEliminarLink('practica', idx)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminClasesCurso
