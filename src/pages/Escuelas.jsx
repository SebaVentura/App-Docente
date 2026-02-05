import { useState } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerEscuelas, guardarEscuelas, generarIdEscuela } from '../utils/datosEscuelas'

function Escuelas() {
  const { navegar } = useNavegacion()

  // Estado local de escuelas
  const [escuelas, setEscuelas] = useState(() => obtenerEscuelas())

  // Estado para formulario de creación
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [nombreNuevaEscuela, setNombreNuevaEscuela] = useState('')

  // Estado para edición
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')

  // Agregar nueva escuela
  const handleAgregar = () => {
    const nombre = nombreNuevaEscuela.trim()
    if (!nombre) return

    const nuevaEscuela = {
      id: generarIdEscuela(escuelas),
      nombre: nombre,
    }

    const nuevasEscuelas = [...escuelas, nuevaEscuela]
    setEscuelas(nuevasEscuelas)
    guardarEscuelas(nuevasEscuelas)
    setNombreNuevaEscuela('')
    setMostrarFormulario(false)
  }

  // Cancelar creación
  const handleCancelarCreacion = () => {
    setNombreNuevaEscuela('')
    setMostrarFormulario(false)
  }

  // Iniciar edición
  const handleIniciarEdicion = (escuela) => {
    setEditandoId(escuela.id)
    setNombreEditado(escuela.nombre)
  }

  // Guardar edición
  const handleGuardarEdicion = (id) => {
    const nombre = nombreEditado.trim()
    if (!nombre) return

    const nuevasEscuelas = escuelas.map((escuela) =>
      escuela.id === id ? { ...escuela, nombre: nombre } : escuela
    )
    setEscuelas(nuevasEscuelas)
    guardarEscuelas(nuevasEscuelas)
    setEditandoId(null)
    setNombreEditado('')
  }

  // Cancelar edición
  const handleCancelarEdicion = () => {
    setEditandoId(null)
    setNombreEditado('')
  }

  // Eliminar escuela
  const handleEliminar = (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      const nuevasEscuelas = escuelas.filter((escuela) => escuela.id !== id)
      setEscuelas(nuevasEscuelas)
      guardarEscuelas(nuevasEscuelas)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Escuelas</h2>
        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                     hover:bg-blue-700 transition font-medium"
          >
            + Agregar escuela
          </button>
        )}
      </div>

      {/* Formulario de creación */}
      {mostrarFormulario && (
        <div className="mb-4 bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nueva escuela
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={nombreNuevaEscuela}
              onChange={(e) => setNombreNuevaEscuela(e.target.value)}
              placeholder="Nombre de la escuela"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       outline-none transition"
              autoFocus
            />
            <button
              onClick={handleAgregar}
              className="bg-green-600 text-white px-4 py-2 rounded-lg 
                       hover:bg-green-700 transition font-medium"
            >
              Guardar
            </button>
            <button
              onClick={handleCancelarCreacion}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                       hover:bg-gray-700 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de escuelas */}
      <div className="space-y-4">
        {escuelas.map((escuela) => (
          <div
            key={escuela.id}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            {editandoId === escuela.id ? (
              // Modo edición
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                             outline-none transition"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGuardarEdicion(escuela.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-green-700 transition font-medium"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={handleCancelarEdicion}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-gray-700 transition font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {escuela.nombre}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navegar(`/escuelas/${escuela.id}/cursos`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-blue-700 transition font-medium"
                  >
                    Ir a cursos
                  </button>
                  <button
                    onClick={() => handleIniciarEdicion(escuela)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-yellow-700 transition font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(escuela.id, escuela.nombre)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg 
                             hover:bg-red-700 transition font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Escuelas
