import { useState, useEffect } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerCursos, guardarCursos } from '../utils/datosCursos'

function CursoHome({ cursoId }) {
  const { navegar } = useNavegacion()

  // Estado del curso actual
  const [curso, setCurso] = useState(null)

  // Estado para modal de alumno
  const [mostrarModal, setMostrarModal] = useState(false)
  const [alumnoEditando, setAlumnoEditando] = useState(null)

  // Estado del formulario de alumno
  const [formAlumno, setFormAlumno] = useState({
    apellido: '',
    nombre: '',
    dni: '',
    condiciones: [],
    materias: [],
    contenidos: '',
    nuevaMateria: ''
  })

  // Estado para búsqueda de alumnos
  const [busquedaAlumno, setBusquedaAlumno] = useState('')

  // Estados para modal de importación
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isWord, setIsWord] = useState(false)
  const [importError, setImportError] = useState('')

  // Cargar curso al montar
  useEffect(() => {
    const todosLosCursos = obtenerCursos()
    const idCurso = Number(cursoId)
    const cursoEncontrado = todosLosCursos.find(c => c.id === idCurso)
    
    if (cursoEncontrado) {
      // Crear clon sin mutar el original
      const cursoConAlumnos = {
        ...cursoEncontrado,
        alumnos: Array.isArray(cursoEncontrado.alumnos) ? cursoEncontrado.alumnos : []
      }
      setCurso(cursoConAlumnos)
    }
  }, [cursoId])

  // Inicializar formulario vacío
  const inicializarFormAlumno = () => {
    setFormAlumno({
      apellido: '',
      nombre: '',
      dni: '',
      condiciones: [],
      materias: [],
      contenidos: '',
      nuevaMateria: ''
    })
  }

  // Abrir modal para nuevo alumno
  const handleAgregarAlumno = () => {
    inicializarFormAlumno()
    setAlumnoEditando(null)
    setMostrarModal(true)
  }

  // Abrir modal de importación
  const openImportModal = () => {
    setShowImportModal(true)
    setSelectedFile(null)
    setIsWord(false)
    setImportError('')
  }

  // Cerrar modal de importación
  const closeImportModal = () => {
    setShowImportModal(false)
    setSelectedFile(null)
    setIsWord(false)
    setImportError('')
  }

  // Manejar selección de archivo
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setIsWord(false)
      setImportError('')
      return
    }

    const fileName = file.name.toLowerCase()
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    // Extensiones permitidas
    const allowedExtensions = ['xlsx', 'xls', 'csv', 'doc', 'docx']
    
    if (!allowedExtensions.includes(extension)) {
      setImportError(`Extensión no permitida. Use: ${allowedExtensions.join(', ')}`)
      setSelectedFile(null)
      setIsWord(false)
      e.target.value = '' // Limpiar input
      return
    }

    // Validación exitosa
    setImportError('')
    setSelectedFile(file)
    
    // Detectar si es Word
    const wordExtensions = ['doc', 'docx']
    setIsWord(wordExtensions.includes(extension))
  }

  // Procesar archivo
  const onProcesar = () => {
    if (!selectedFile || isWord) return
    
    const fileName = selectedFile.name
    const fileType = fileName.split('.').pop()?.toLowerCase()
    
    console.log({
      cursoId: cursoId,
      fileName: fileName,
      fileType: fileType
    })
    
    closeImportModal()
  }

  // Abrir modal para editar alumno
  const handleEditarAlumno = (alumno) => {
    setFormAlumno({
      apellido: alumno.apellido || '',
      nombre: alumno.nombre || '',
      dni: alumno.dni || '',
      condiciones: alumno.condiciones || [],
      materias: alumno.materias || [],
      contenidos: alumno.contenidos || '',
      nuevaMateria: ''
    })
    setAlumnoEditando(alumno)
    setMostrarModal(true)
  }

  // Cerrar modal
  const handleCerrarModal = () => {
    setMostrarModal(false)
    setAlumnoEditando(null)
    inicializarFormAlumno()
  }

  // Toggle condición
  const handleToggleCondicion = (condicion) => {
    setFormAlumno(prev => {
      const nuevasCondiciones = prev.condiciones.includes(condicion)
        ? prev.condiciones.filter(c => c !== condicion)
        : [...prev.condiciones, condicion]
      
      if (condicion === 'INTENSIFICA' && !nuevasCondiciones.includes('INTENSIFICA')) {
        return {
          ...prev,
          condiciones: nuevasCondiciones,
          materias: [],
          contenidos: '',
          nuevaMateria: ''
        }
      }
      
      return {
        ...prev,
        condiciones: nuevasCondiciones
      }
    })
  }

  // Agregar materia
  const handleAgregarMateria = () => {
    const materia = formAlumno.nuevaMateria.trim()
    if (!materia) return
    
    setFormAlumno(prev => ({
      ...prev,
      materias: [...prev.materias, materia],
      nuevaMateria: ''
    }))
  }

  // Eliminar materia
  const handleEliminarMateria = (index) => {
    setFormAlumno(prev => ({
      ...prev,
      materias: prev.materias.filter((_, i) => i !== index)
    }))
  }

  // Guardar alumno
  const handleGuardarAlumno = () => {
    if (!formAlumno.apellido.trim() || !formAlumno.nombre.trim()) {
      alert('Apellido y Nombre son obligatorios')
      return
    }
    
    if (formAlumno.condiciones.length === 0) {
      alert('Debe marcar al menos una condición')
      return
    }
    
    const todosLosCursos = obtenerCursos()
    const idCurso = Number(cursoId)
    const cursoIndex = todosLosCursos.findIndex(c => c.id === idCurso)
    
    if (cursoIndex === -1) return
    
    const alumnoData = {
      id: alumnoEditando ? alumnoEditando.id : Date.now(),
      apellido: formAlumno.apellido.trim(),
      nombre: formAlumno.nombre.trim(),
      dni: formAlumno.dni.trim() || null,
      condiciones: formAlumno.condiciones,
      materias: formAlumno.condiciones.includes('INTENSIFICA') ? formAlumno.materias : [],
      contenidos: formAlumno.condiciones.includes('INTENSIFICA') ? formAlumno.contenidos : ''
    }
    
    const cursoActualizado = { ...todosLosCursos[cursoIndex] }
    
    if (alumnoEditando) {
      cursoActualizado.alumnos = cursoActualizado.alumnos.map(a =>
        a.id === alumnoEditando.id ? alumnoData : a
      )
    } else {
      if (!cursoActualizado.alumnos) {
        cursoActualizado.alumnos = []
      }
      cursoActualizado.alumnos.push(alumnoData)
    }
    
    todosLosCursos[cursoIndex] = cursoActualizado
    guardarCursos(todosLosCursos)
    
    setCurso(cursoActualizado)
    handleCerrarModal()
  }

  // Quitar alumno
  const handleQuitarAlumno = (alumno) => {
    if (!window.confirm(`¿Estás seguro de quitar a ${alumno.apellido}, ${alumno.nombre} del curso?`)) {
      return
    }
    
    const todosLosCursos = obtenerCursos()
    const idCurso = Number(cursoId)
    const cursoIndex = todosLosCursos.findIndex(c => c.id === idCurso)
    
    if (cursoIndex === -1) return
    
    const cursoActualizado = { ...todosLosCursos[cursoIndex] }
    cursoActualizado.alumnos = cursoActualizado.alumnos.filter(a => a.id !== alumno.id)
    
    todosLosCursos[cursoIndex] = cursoActualizado
    guardarCursos(todosLosCursos)
    
    setCurso(cursoActualizado)
  }

  // Ordenar alumnos por apellido y luego nombre (ascendente)
  const alumnosOrdenados = curso && curso.alumnos && curso.alumnos.length > 0
    ? [...curso.alumnos].sort((a, b) => {
        // Normalizar espacios: múltiples espacios -> uno solo
        const apellidoA = (a.apellido || '').trim().replace(/\s+/g, ' ')
        const apellidoB = (b.apellido || '').trim().replace(/\s+/g, ' ')
        
        // Comparar apellidos con localeCompare es-AR
        const comparacionApellido = apellidoA.localeCompare(apellidoB, 'es-AR')
        if (comparacionApellido !== 0) return comparacionApellido
        
        // Si apellidos iguales, comparar nombres
        const nombreA = (a.nombre || '').trim().replace(/\s+/g, ' ')
        const nombreB = (b.nombre || '').trim().replace(/\s+/g, ' ')
        return nombreA.localeCompare(nombreB, 'es-AR')
      })
    : []

  // Filtrar alumnos por búsqueda (case-insensitive)
  const alumnosFiltrados = busquedaAlumno.trim()
    ? alumnosOrdenados.filter(alumno => {
        const busqueda = busquedaAlumno.trim().toLowerCase()
        const apellido = (alumno.apellido || '').toLowerCase()
        const nombre = (alumno.nombre || '').toLowerCase()
        return apellido.includes(busqueda) || nombre.includes(busqueda)
      })
    : alumnosOrdenados

  if (!curso) {
    return (
      <div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {curso.nombre}
      </h2>
      
      <div className="mb-6">
        <button
          onClick={() => navegar(`/cursos/${cursoId}/asistencia`)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg 
                   font-medium hover:bg-blue-700 transition"
        >
          Pasar asistencia
        </button>
        <button
          onClick={() => navegar(`/cursos/${cursoId}/trayectorias`)}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg 
                   font-medium hover:bg-green-700 transition ml-4"
        >
          Trayectorias
        </button>
        <button
          onClick={() => navegar(`/cursos/${cursoId}/diagnosticos`)}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-lg 
                   font-medium hover:bg-purple-700 transition ml-4"
        >
          Diagnósticos
        </button>
        <button
          onClick={() => navegar(`/cursos/${cursoId}/planificacion`)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg 
                   font-medium hover:bg-indigo-700 transition ml-4"
        >
          Planificación
        </button>
      </div>

      {/* Sección Alumnos */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Alumnos del curso</h3>
          <div className="flex gap-2">
            <button
              onClick={handleAgregarAlumno}
              className="bg-green-600 text-white px-4 py-2 rounded-lg 
                       hover:bg-green-700 transition font-medium"
            >
              + Agregar alumno
            </button>
            <button
              onClick={openImportModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg 
                       hover:bg-indigo-700 transition font-medium"
            >
              📄 Cargar lista (Excel/Word)
            </button>
          </div>
        </div>
        
        {/* Buscador de alumnos */}
        {curso.alumnos && curso.alumnos.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              value={busquedaAlumno}
              onChange={(e) => setBusquedaAlumno(e.target.value)}
              placeholder="Buscar alumno..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        )}
        
        {/* Lista de alumnos */}
        {alumnosFiltrados.length > 0 ? (
          <div className="space-y-3">
            {alumnosFiltrados.map((alumno) => (
              <div
                key={alumno.id}
                className="border border-gray-200 rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {alumno.apellido}, {alumno.nombre}
                  </div>
                  {alumno.dni && (
                    <div className="text-sm text-gray-600">DNI: {alumno.dni}</div>
                  )}
                  <div className="text-sm text-gray-600 mt-1">
                    Condiciones: {alumno.condiciones.join(', ')}
                  </div>
                  {alumno.condiciones.includes('INTENSIFICA') && alumno.materias.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Materias: {alumno.materias.join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditarAlumno(alumno)}
                    className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg 
                             hover:bg-yellow-700 transition text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleQuitarAlumno(alumno)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg 
                             hover:bg-red-700 transition text-sm font-medium"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : curso.alumnos && curso.alumnos.length > 0 ? (
          <p className="text-gray-600 text-center py-4">
            No se encontraron alumnos que coincidan con la búsqueda
          </p>
        ) : (
          <p className="text-gray-600 text-center py-4">
            No hay alumnos cargados en este curso
          </p>
        )}
      </div>

      {/* Modal Agregar/Editar Alumno */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {alumnoEditando ? 'Editar alumno' : 'Agregar alumno'}
            </h3>
            
            <div className="space-y-4">
              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formAlumno.apellido}
                  onChange={(e) => setFormAlumno(prev => ({ ...prev, apellido: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formAlumno.nombre}
                  onChange={(e) => setFormAlumno(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={formAlumno.dni}
                  onChange={(e) => setFormAlumno(prev => ({ ...prev, dni: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              {/* Condiciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condiciones * (marcar al menos una)
                </label>
                <div className="space-y-2">
                  {['CURSA', 'RECURSA', 'INTENSIFICA'].map(condicion => (
                    <label key={condicion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formAlumno.condiciones.includes(condicion)}
                        onChange={() => handleToggleCondicion(condicion)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded 
                                 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{condicion}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Sección INTENSIFICA */}
              {formAlumno.condiciones.includes('INTENSIFICA') && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <h4 className="font-medium text-gray-900">Información de Intensificación</h4>
                  
                  {/* Materias */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materias
                    </label>
                    
                    {/* Input para agregar materia */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={formAlumno.nuevaMateria}
                        onChange={(e) => setFormAlumno(prev => ({ ...prev, nuevaMateria: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAgregarMateria()
                          }
                        }}
                        placeholder="Nombre de la materia"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg 
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarMateria}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                                 hover:bg-blue-700 transition font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                    
                    {/* Lista de materias */}
                    {formAlumno.materias.length > 0 && (
                      <div className="space-y-2">
                        {formAlumno.materias.map((materia, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                              {materia}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEliminarMateria(index)}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg 
                                       hover:bg-red-700 transition text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Contenidos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenidos
                    </label>
                    <textarea
                      value={formAlumno.contenidos}
                      onChange={(e) => setFormAlumno(prev => ({ ...prev, contenidos: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      rows="3"
                      placeholder="Contenidos de intensificación (opcional)"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Botones del modal */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleGuardarAlumno}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg 
                         hover:bg-green-700 transition font-medium"
              >
                Guardar
              </button>
              <button
                onClick={handleCerrarModal}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg 
                         hover:bg-gray-700 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Alumnos */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Importar alumnos
            </h3>

            {/* Input file */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.doc,.docx"
                onChange={onFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Error */}
            {importError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{importError}</p>
              </div>
            )}

            {/* Info del archivo seleccionado */}
            {selectedFile && !importError && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                </p>
              </div>
            )}

            {/* Mensaje de éxito para Excel/CSV */}
            {selectedFile && !isWord && !importError && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Archivo listo para procesar.
                </p>
              </div>
            )}

            {/* Warning para Word */}
            {selectedFile && isWord && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  Word detectado. Para importar automáticamente, convertí este archivo a Excel (.xlsx) o CSV (.csv).
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={onProcesar}
                disabled={!selectedFile || isWord || !!importError}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  !selectedFile || isWord || !!importError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Procesar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CursoHome
