import { useState, useEffect } from 'react'
import { obtenerCursos } from '../utils/datosCursos'

function RegistroClase({ cursoId }) {
  const [curso, setCurso] = useState(null)

  // Cargar curso al montar
  useEffect(() => {
    const todosLosCursos = obtenerCursos()
    // Comparar como String para evitar mismatch de tipos (timestamps vs números)
    const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
    if (cursoEncontrado) {
      setCurso(cursoEncontrado)
    }
  }, [cursoId])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Registro de clase – {curso ? curso.nombre : `Curso ${cursoId}`}
      </h2>
      
      <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
        <p className="text-gray-600 text-lg">
          Módulo en construcción
        </p>
      </div>
    </div>
  )
}

export default RegistroClase
