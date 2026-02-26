import { useState, useEffect } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerClasesCurso, guardarClasesCurso } from '../utils/datosClases'

function ClasesCurso({ cursoId }) {
  const { navegar } = useNavegacion()
  const [cursoNombre, setCursoNombre] = useState('')
  const [totalClases, setTotalClases] = useState(32) // Default
  const [claseSeleccionada, setClaseSeleccionada] = useState(1)
  
  // Cargar datos al montar
  useEffect(() => {
    // Cargar nombre del curso
    const todosLosCursos = obtenerCursos()
    const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
    if (cursoEncontrado) {
      setCursoNombre(cursoEncontrado.nombre || '')
    }
    
    // Cargar configuración de clases desde localStorage
    const config = obtenerClasesCurso(cursoId)
    if (config) {
      setTotalClases(config.totalClases || 32)
      setClaseSeleccionada(config.claseSeleccionada || 1)
    }
  }, [cursoId])
  
  // Guardar cuando cambia totalClases o claseSeleccionada
  useEffect(() => {
    guardarClasesCurso(cursoId, {
      totalClases,
      claseSeleccionada
    })
  }, [cursoId, totalClases, claseSeleccionada])
  
  // Clases de acceso rápido (1, 5, 10, 15, 20, 25, 30, última)
  const clasesAccesoRapido = [1, 5, 10, 15, 20, 25, 30].filter(c => c <= totalClases)
  if (totalClases > 30 && !clasesAccesoRapido.includes(totalClases)) {
    clasesAccesoRapido.push(totalClases)
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Clases – {cursoNombre || `Curso ${cursoId}`}
      </h2>
      
      {/* Grid Acceso rápido */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Acceso rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {clasesAccesoRapido.map((num) => (
            <button
              key={num}
              onClick={() => {
                setClaseSeleccionada(num)
                navegar(`/cursos/${cursoId}/clases/${num}`)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                claseSeleccionada === num
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Clase {num}
            </button>
          ))}
        </div>
      </div>
      
      {/* Slider/Selector de clase */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar clase
        </label>
        <input
          type="range"
          min="1"
          max={totalClases}
          value={claseSeleccionada}
          onChange={(e) => setClaseSeleccionada(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex justify-between mt-2">
          <span className="text-sm text-gray-600">Clase 1</span>
          <span className="text-lg font-semibold">Clase {claseSeleccionada}</span>
          <span className="text-sm text-gray-600">Clase {totalClases}</span>
        </div>
      </div>
      
      {/* Botón Abrir Clase */}
      <div className="mb-6">
        <button
          onClick={() => navegar(`/cursos/${cursoId}/clases/${claseSeleccionada}`)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg 
                   font-medium hover:bg-blue-700 transition"
        >
          Abrir Clase {claseSeleccionada}
        </button>
      </div>
      
      {/* Botón Administrar clases */}
      <div className="mb-6">
        <button
          onClick={() => navegar(`/cursos/${cursoId}/clases/admin`)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-lg 
                   font-medium hover:bg-orange-700 transition"
        >
          ⚙️ Administrar clases
        </button>
      </div>
      
      {/* Configuración: Total de clases */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total de clases del curso
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={totalClases}
          onChange={(e) => {
            const nuevoTotal = parseInt(e.target.value, 10) || 32
            setTotalClases(nuevoTotal)
            if (claseSeleccionada > nuevoTotal) {
              setClaseSeleccionada(nuevoTotal)
            }
          }}
          className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>
    </div>
  )
}

export default ClasesCurso
