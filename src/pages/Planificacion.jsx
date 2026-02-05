import { useState, useEffect } from 'react'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerHoyArgentina } from '../utils/fechas'
import { prepararDatosParaPlanificacion } from '../utils/datosDiagnosticos'
import {
  obtenerPlanificacion,
  guardarPrograma,
  guardarProgramaArchivo,
  guardarModeloArchivo,
  guardarPlan,
  generarPlanBaseDesdeDiagnostico
} from '../utils/datosPlanificacion'

function Planificacion({ cursoId }) {
  const [cursoNombre, setCursoNombre] = useState('')
  const [programaTexto, setProgramaTexto] = useState('')
  const [programaArchivo, setProgramaArchivo] = useState(null)
  const [modeloArchivo, setModeloArchivo] = useState(null)
  const [plan, setPlan] = useState(null)
  const [datosDiagnostico, setDatosDiagnostico] = useState({ alumnos: [], resumenGrupal: null, fechaActualizacion: '' })
  const [semanasPorUnidad, setSemanasPorUnidad] = useState(4)
  const [meta, setMeta] = useState({
    materia: '',
    docente: '',
    periodo: 'Cuatrimestre 1',
    anio: parseInt(obtenerHoyArgentina().split('-')[0], 10) // Parsear año desde YYYY-MM-DD
  })
  const [unidadesExpandidas, setUnidadesExpandidas] = useState({})

  // Cargar curso
  useEffect(() => {
    const todosLosCursos = obtenerCursos()
    const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
    if (cursoEncontrado) {
      setCursoNombre(cursoEncontrado.nombre || '')
    }
  }, [cursoId])

  // Cargar planificación guardada
  useEffect(() => {
    const planificacion = obtenerPlanificacion(cursoId)
    setProgramaTexto(planificacion.programaTexto || '')
    setProgramaArchivo(planificacion.programaArchivo || null)
    setModeloArchivo(planificacion.modeloArchivo || null)
    setPlan(planificacion.plan)
    
    // Cargar datos de diagnóstico
    const datos = prepararDatosParaPlanificacion(cursoId)
    setDatosDiagnostico(datos)
  }, [cursoId])

  const handleGuardarPrograma = () => {
    guardarPrograma(cursoId, programaTexto)
    alert('Programa guardado')
  }

  const handleSubirProgramaArchivo = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Validar tamaño (2MB)
    const maxSizeBytes = 2 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      alert('El archivo excede el límite de 2MB')
      event.target.value = '' // Limpiar input
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const programaData = {
        nombre: file.name,
        tipo: file.type,
        tamano: file.size,
        dataUrl: dataUrl
      }
      
      try {
        guardarProgramaArchivo(cursoId, programaData)
        setProgramaArchivo(programaData)
        alert('Archivo programa guardado')
      } catch (error) {
        alert(error.message || 'Error al guardar el archivo programa')
        event.target.value = ''
      }
    }
    reader.onerror = () => {
      alert('Error al leer el archivo')
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleQuitarProgramaArchivo = () => {
    try {
      guardarProgramaArchivo(cursoId, null)
      setProgramaArchivo(null)
      alert('Archivo programa eliminado')
    } catch (error) {
      alert(error.message || 'Error al eliminar el archivo programa')
    }
  }

  const handleSubirModelo = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Validar tamaño (2MB)
    const maxSizeBytes = 2 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      alert('El archivo excede el límite de 2MB')
      event.target.value = '' // Limpiar input
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const modeloData = {
        nombre: file.name,
        tipo: file.type,
        tamaño: file.size,
        dataUrl: dataUrl
      }
      
      try {
        guardarModeloArchivo(cursoId, modeloData)
        setModeloArchivo(modeloData)
        alert('Modelo de planificación guardado')
      } catch (error) {
        alert(error.message || 'Error al guardar el modelo')
        event.target.value = ''
      }
    }
    reader.onerror = () => {
      alert('Error al leer el archivo')
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleQuitarModelo = () => {
    try {
      guardarModeloArchivo(cursoId, null)
      setModeloArchivo(null)
      alert('Modelo de planificación eliminado')
    } catch (error) {
      alert(error.message || 'Error al eliminar el modelo')
    }
  }

  const handleGenerarPlanBase = () => {
    if (!programaTexto.trim()) {
      alert('Debe cargar el programa antes de generar la planificación base')
      return
    }
    
    if (!meta.materia.trim() || !meta.docente.trim()) {
      alert('Debe completar Materia y Docente')
      return
    }
    
    const planBase = generarPlanBaseDesdeDiagnostico(cursoId, {
      ...meta,
      cursoNombre
    }, programaTexto, datosDiagnostico, semanasPorUnidad)
    
    setPlan(planBase)
    guardarPlan(cursoId, planBase)
    alert('Planificación base generada. Puede editarla ahora.')
  }

  const handleGuardarPlan = () => {
    if (!plan) return
    // Guardar programa también si cambió
    guardarPrograma(cursoId, programaTexto)
    guardarPlan(cursoId, plan)
    alert('Planificación guardada')
  }

  const toggleUnidad = (unidadId) => {
    setUnidadesExpandidas(prev => ({
      ...prev,
      [unidadId]: !prev[unidadId]
    }))
  }

  const actualizarSemana = (unidadId, semanaId, campo, valor) => {
    setPlan(prev => {
      if (!prev) return null
      const nuevasUnidades = prev.unidades.map(unidad => {
        if (unidad.id === unidadId) {
          return {
            ...unidad,
            semanas: unidad.semanas.map(semana => {
              if (semana.id === semanaId) {
                return { ...semana, [campo]: valor }
              }
              return semana
            })
          }
        }
        return unidad
      })
      return { ...prev, unidades: nuevasUnidades }
    })
  }

  // Contar indicadores
  const contadores = { riesgo: 0, medio: 0, ok: 0 }
  datosDiagnostico.alumnos.forEach(alumno => {
    const indicador = alumno.indicador || 'ok'
    contadores[indicador] = (contadores[indicador] || 0) + 1
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Planificación – {cursoNombre || `Curso ${cursoId}`}
      </h2>

      {/* Sección A: Programa (insumo) */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Programa (insumo)</h3>
        
        {/* Subir archivo programa */}
        <div className="mb-4">
          <input
            type="file"
            onChange={handleSubirProgramaArchivo}
            accept=".pdf,.doc,.docx,.txt,.odt"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {!programaArchivo && (
            <p className="text-xs text-gray-500 mt-1">Máx 2MB</p>
          )}
        </div>
        {programaArchivo && (
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{programaArchivo.nombre}</p>
                <p className="text-xs text-gray-500">
                  {(programaArchivo.tamano / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={handleQuitarProgramaArchivo}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Quitar
              </button>
            </div>
          </div>
        )}
        
        {/* Textarea programa texto */}
        <textarea
          value={programaTexto}
          onChange={(e) => setProgramaTexto(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
          rows="8"
          placeholder="Pegue aquí el programa de la materia..."
        />
        <button
          onClick={handleGuardarPrograma}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Guardar programa
        </button>
      </div>

      {/* Sección A2: Modelo de planificación (insumo) */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Modelo de planificación (insumo)</h3>
        <div className="mb-3">
          <input
            type="file"
            onChange={handleSubirModelo}
            accept=".pdf,.doc,.docx,.txt"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="text-xs text-gray-500 mt-1">Tamaño máximo: 2MB</p>
        </div>
        {modeloArchivo && (
          <div className="p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{modeloArchivo.nombre}</p>
                <p className="text-xs text-gray-500">
                  {(modeloArchivo.tamaño / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={handleQuitarModelo}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Quitar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección B: Diagnóstico (resumen) */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnóstico (resumen)</h3>
        {datosDiagnostico.fechaActualizacion && (
          <p className="text-sm text-gray-600 mb-2">
            Última actualización: {datosDiagnostico.fechaActualizacion}
          </p>
        )}
        {datosDiagnostico.resumenGrupal && (
          <div className="mb-3 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium text-gray-700 mb-1">Resumen grupal:</p>
            <p className="text-sm text-gray-600">
              {datosDiagnostico.resumenGrupal.detalle.length > 200 
                ? datosDiagnostico.resumenGrupal.detalle.substring(0, 200) + '...' 
                : datosDiagnostico.resumenGrupal.detalle}
            </p>
          </div>
        )}
        <div className="flex gap-4">
          <span className="text-sm">
            <span className="font-medium">OK:</span> {contadores.ok}
          </span>
          <span className="text-sm">
            <span className="font-medium">Medio:</span> {contadores.medio}
          </span>
          <span className="text-sm">
            <span className="font-medium">Riesgo:</span> {contadores.riesgo}
          </span>
        </div>
      </div>

      {/* Sección C: Estructura de planificación */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estructura de planificación</h3>
        
        {/* Formulario Meta */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
            <input
              type="text"
              value={meta.materia}
              onChange={(e) => setMeta({ ...meta, materia: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Docente *</label>
            <input
              type="text"
              value={meta.docente}
              onChange={(e) => setMeta({ ...meta, docente: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              value={meta.periodo}
              onChange={(e) => setMeta({ ...meta, periodo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="Cuatrimestre 1">Cuatrimestre 1</option>
              <option value="Cuatrimestre 2">Cuatrimestre 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <input
              type="number"
              value={meta.anio}
              onChange={(e) => setMeta({ ...meta, anio: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semanas por unidad</label>
            <input
              type="number"
              min="1"
              max="20"
              value={semanasPorUnidad}
              onChange={(e) => setSemanasPorUnidad(Number(e.target.value) || 4)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {!plan ? (
          <button
            onClick={handleGenerarPlanBase}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Generar planificación base
          </button>
        ) : (
          <>
            {/* Lista de unidades (acordeón) */}
            <div className="space-y-3 mb-4">
              {plan.unidades.map((unidad) => (
                <div key={unidad.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleUnidad(unidad.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <span className="font-semibold text-gray-900">{unidad.titulo}</span>
                    <span>{unidadesExpandidas[unidad.id] ? '▼' : '▶'}</span>
                  </button>
                  
                  {unidadesExpandidas[unidad.id] && (
                    <div className="p-4 space-y-4">
                      {unidad.semanas.map((semana) => (
                        <div key={semana.id} className="border-l-2 border-indigo-200 pl-4">
                          <h4 className="font-medium text-gray-700 mb-2">Semana {semana.semanaNro}</h4>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Contenidos</label>
                              <textarea
                                value={semana.contenidos}
                                onChange={(e) => actualizarSemana(unidad.id, semana.id, 'contenidos', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                rows="2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Actividades</label>
                              <textarea
                                value={semana.actividades}
                                onChange={(e) => actualizarSemana(unidad.id, semana.id, 'actividades', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                rows="2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Recursos</label>
                              <textarea
                                value={semana.recursos}
                                onChange={(e) => actualizarSemana(unidad.id, semana.id, 'recursos', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                rows="2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Evaluación</label>
                              <textarea
                                value={semana.evaluacion}
                                onChange={(e) => actualizarSemana(unidad.id, semana.id, 'evaluacion', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                rows="2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Adaptaciones</label>
                              <textarea
                                value={semana.adaptaciones}
                                onChange={(e) => actualizarSemana(unidad.id, semana.id, 'adaptaciones', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                rows="2"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={handleGuardarPlan}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Guardar cambios
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Planificacion
