import { useState, useEffect } from 'react'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerHoyArgentina } from '../utils/fechas'
import { prepararDatosParaPlanificacion } from '../utils/datosDiagnosticos'
import {
  obtenerPlanificacion,
  guardarPlan
} from '../utils/datosPlanificacion'
import {
  obtenerInsumos,
  guardarInsumos,
  validarInsumosParaIA,
  migrarInsumosV1
} from '../utils/insumosPlanificacion'
import { generarPlanificacionIA } from '../utils/planificacionesIA'
import { obtenerPerfilDocente } from '../utils/datosPerfil'
import {
  guardarMetaPlanificacion,
  obtenerMetaPlanificacion,
  guardarBorradorIA,
  obtenerBorradorIA
} from '../utils/planificacionPersistencia'
import { obtenerOrigenTexto, formatearOrigen, esTextoValidoParaExtracto } from '../utils/planificacionesIA'
import InsumoCard from '../components/planificacion/InsumoCard'
import EvidenciaPanel from '../components/planificacion/EvidenciaPanel'

function Planificacion({ cursoId }) {
  const [cursoNombre, setCursoNombre] = useState('')
  const [insumos, setInsumos] = useState({
    programa: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
    modelo: { fileRef: null, texto: '', textoExtraido: '', updatedAt: '' },
    adicionales: []
  })
  const [plan, setPlan] = useState(null)
  const [planificacionIA, setPlanificacionIA] = useState(null)
  const [evidencia, setEvidencia] = useState([])
  const [fuentesUsadas, setFuentesUsadas] = useState([])
  const [warningsIA, setWarningsIA] = useState([])
  const [datosDiagnostico, setDatosDiagnostico] = useState({ alumnos: [], resumenGrupal: null, fechaActualizacion: '' })
  const [semanasPorUnidad, setSemanasPorUnidad] = useState(4)
  const [meta, setMeta] = useState({
    materia: '',
    docente: '',
    periodo: 'Cuatrimestre 1',
    anio: parseInt(obtenerHoyArgentina().split('-')[0], 10)
  })
  const [unidadesExpandidas, setUnidadesExpandidas] = useState({})
  const [seccionActiva, setSeccionActiva] = useState('fundamentacion')
  const [mostrandoEvidencia, setMostrandoEvidencia] = useState(null)
  const [generandoIA, setGenerandoIA] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [debounceTimer, setDebounceTimer] = useState(null)

  // Resolver materia y docente automáticamente
  const resolverMeta = () => {
    // Materia: desde curso.nombre o curso.materia
    const todosLosCursos = obtenerCursos()
    const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
    const materia = cursoEncontrado?.materia || cursoEncontrado?.nombre || ''

    // Docente: desde perfil del docente
    const perfil = obtenerPerfilDocente()
    const docente = perfil?.nombreCompleto || ''

    return { materia, docente }
  }

  // Cargar curso y resolver meta automáticamente
  useEffect(() => {
    const todosLosCursos = obtenerCursos()
    const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
    if (cursoEncontrado) {
      setCursoNombre(cursoEncontrado.nombre || '')
    }

    // Resolver materia y docente automáticamente
    const { materia, docente } = resolverMeta()
    setMeta(prev => ({
      ...prev,
      materia,
      docente
    }))
  }, [cursoId])

  // Rehidratación completa al montar
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true)
      try {
        // 1. Cargar insumos (con migración si aplica)
        const insumosMigrados = await migrarInsumosV1(cursoId)
        if (insumosMigrados) {
          await guardarInsumos(cursoId, insumosMigrados)
          setInsumos(insumosMigrados)
        } else {
          const insumosCargados = await obtenerInsumos(cursoId)
          setInsumos(insumosCargados)
        }

        // 2. Cargar meta guardada
        const metaGuardada = obtenerMetaPlanificacion(cursoId)
        if (metaGuardada) {
          setMeta(prev => ({
            ...prev,
            ...metaGuardada
          }))
          if (metaGuardada.semanasPorUnidad) {
            setSemanasPorUnidad(metaGuardada.semanasPorUnidad)
          }
        } else {
          // Si no hay meta guardada, resolver automáticamente
          const { materia, docente } = resolverMeta()
          setMeta(prev => ({
            ...prev,
            materia,
            docente
          }))
        }

        // 3. Cargar borrador IA si existe
        const borradorIA = obtenerBorradorIA(cursoId)
        if (borradorIA) {
          setPlanificacionIA(borradorIA.planificacion)
          setEvidencia(borradorIA.evidencia || [])
          setFuentesUsadas(borradorIA.fuentesUsadas || [])
          setWarningsIA(borradorIA.warnings || [])
        }

        // 4. Cargar planificación existente (v1 o v2)
        const planificacion = obtenerPlanificacion(cursoId)
        setPlan(planificacion.plan)
        
        // 5. Cargar datos de diagnóstico
        const datos = prepararDatosParaPlanificacion(cursoId)
        setDatosDiagnostico(datos)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        alert('Error al cargar los datos de planificación')
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [cursoId])

  // Autosave de insumos (con debounce para texto)
  useEffect(() => {
    if (cargando) return

    // Limpiar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Guardar después de 500ms de inactividad
    const timer = setTimeout(() => {
      guardarInsumos(cursoId, insumos).catch(err => {
        console.error('Error al guardar insumos:', err)
      })
    }, 500)

    setDebounceTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [insumos, cursoId, cargando])

  // Autosave de meta
  useEffect(() => {
    if (cargando) return
    guardarMetaPlanificacion(cursoId, {
      ...meta,
      semanasPorUnidad
    })
  }, [meta, semanasPorUnidad, cursoId, cargando])

  // Autosave de borrador IA
  useEffect(() => {
    if (cargando || !planificacionIA) return
    guardarBorradorIA(cursoId, {
      planificacion: planificacionIA,
      evidencia,
      fuentesUsadas,
      warnings: warningsIA
    })
  }, [planificacionIA, evidencia, fuentesUsadas, warningsIA, cursoId, cargando])

  const handleProgramaChange = (nuevoPrograma) => {
    setInsumos(prev => ({
      ...prev,
      programa: nuevoPrograma
    }))
  }

  const handleModeloChange = (nuevoModelo) => {
    setInsumos(prev => ({
      ...prev,
      modelo: nuevoModelo
    }))
  }

  const handleAgregarInsumo = () => {
    const nuevoInsumo = {
      id: `insumo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tipo: 'Diseño curricular oficial',
      titulo: '',
      fileRef: null,
      texto: '',
      usarComoFuente: true,
      updatedAt: ''
    }
    setInsumos(prev => ({
      ...prev,
      adicionales: [...prev.adicionales, nuevoInsumo]
    }))
  }

  const handleInsumoAdicionalChange = (id, nuevoInsumo) => {
    setInsumos(prev => ({
      ...prev,
      adicionales: prev.adicionales.map(ins => ins.id === id ? nuevoInsumo : ins)
    }))
  }

  const handleInsumoAdicionalTipoChange = (id, tipo) => {
    setInsumos(prev => ({
      ...prev,
      adicionales: prev.adicionales.map(ins => ins.id === id ? { ...ins, tipo } : ins)
    }))
  }

  const handleInsumoAdicionalTituloChange = (id, titulo) => {
    setInsumos(prev => ({
      ...prev,
      adicionales: prev.adicionales.map(ins => ins.id === id ? { ...ins, titulo } : ins)
    }))
  }

  const handleInsumoAdicionalFuenteChange = (id, usarComoFuente) => {
    setInsumos(prev => ({
      ...prev,
      adicionales: prev.adicionales.map(ins => ins.id === id ? { ...ins, usarComoFuente } : ins)
    }))
  }

  const handleQuitarInsumoAdicional = (id) => {
    const insumo = insumos.adicionales.find(ins => ins.id === id)
    if (insumo && insumo.fileRef) {
      // Borrar archivo de IndexedDB
      import('../utils/insumosPlanificacion').then(({ borrarArchivoInsumo }) => {
        borrarArchivoInsumo(insumo.fileRef).catch(err => {
          console.warn('Error al borrar archivo:', err)
        })
      })
    }
    setInsumos(prev => ({
      ...prev,
      adicionales: prev.adicionales.filter(ins => ins.id !== id)
    }))
  }

  const handleGenerarConIA = async () => {
    // Validar insumos
    const validacion = validarInsumosParaIA(insumos)
    if (!validacion.valido) {
      alert(validacion.error)
      return
    }

    // Resolver materia y docente automáticamente
    const { materia, docente } = resolverMeta()
    
    // Validar que se pudieron resolver
    if (!materia.trim() || !docente.trim()) {
      alert('No se pudo determinar la materia o el docente desde el curso. Por favor, asegurate de que el curso tenga un nombre y que tu perfil esté completo.')
      return
    }

    // Actualizar meta con valores resueltos
    const metaResuelta = {
      ...meta,
      materia,
      docente
    }
    setMeta(metaResuelta)

    setGenerandoIA(true)
    try {
      const resultado = await generarPlanificacionIA({
        cursoId,
        meta: {
          ...metaResuelta,
          cursoNombre
        },
        insumos
      })

      setPlanificacionIA(resultado.planificacion)
      setEvidencia(resultado.evidencia)
      setFuentesUsadas(resultado.fuentesUsadas)
      setWarningsIA(resultado.warnings || [])
      setPlan(resultado.planificacion.unidades ? { ...resultado.planificacion, meta: metaResuelta } : plan)
      
      // Guardar borrador IA inmediatamente
      guardarBorradorIA(cursoId, {
        planificacion: resultado.planificacion,
        evidencia: resultado.evidencia,
        fuentesUsadas: resultado.fuentesUsadas,
        warnings: resultado.warnings || []
      })
    } catch (error) {
      console.error('Error al generar planificación con IA:', error)
      alert('Error al generar la planificación con IA')
    } finally {
      setGenerandoIA(false)
    }
  }

  const handleGuardarPlan = () => {
    if (!plan && !planificacionIA) return
    
    const planAGuardar = plan || {
      meta,
      unidades: planificacionIA?.unidades || []
    }
    
    guardarPlan(cursoId, planAGuardar)
    alert('Planificación guardada')
  }

  const handleActualizarSeccionIA = (seccion, valor) => {
    if (!planificacionIA) return
    const actualizado = {
      ...planificacionIA,
      [seccion]: valor
    }
    setPlanificacionIA(actualizado)
    // Guardar inmediatamente al editar
    guardarBorradorIA(cursoId, {
      planificacion: actualizado,
      evidencia,
      fuentesUsadas
    })
  }

  const toggleUnidad = (unidadId) => {
    setUnidadesExpandidas(prev => ({
      ...prev,
      [unidadId]: !prev[unidadId]
    }))
  }

  const actualizarSemana = (unidadId, semanaId, campo, valor) => {
    const planActual = plan || (planificacionIA ? { unidades: planificacionIA.unidades } : null)
    if (!planActual) return

    const nuevasUnidades = planActual.unidades.map(unidad => {
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

    if (plan) {
      setPlan({ ...planActual, unidades: nuevasUnidades })
    } else if (planificacionIA) {
      const actualizado = { ...planificacionIA, unidades: nuevasUnidades }
      setPlanificacionIA(actualizado)
      // Guardar inmediatamente al editar unidades
      guardarBorradorIA(cursoId, {
        planificacion: actualizado,
        evidencia,
        fuentesUsadas
      })
    }
  }

  // Helper para obtener estado de lectura de un insumo
  const obtenerEstadoLectura = (insumo) => {
    const origen = obtenerOrigenTexto(insumo)
    if (origen === 'extraido_docx') {
      return <span className="ml-2 text-xs text-green-600">✅ Leído (DOCX)</span>
    }
    if (origen === 'extraido_pdf') {
      return <span className="ml-2 text-xs text-green-600">✅ Leído (PDF)</span>
    }
    if (origen === 'pegado') {
      return <span className="ml-2 text-xs text-blue-600">✍️ Texto pegado</span>
    }
    // Si hay fileRef DOCX o PDF pero no texto válido
    if (insumo?.fileRef) {
      const nombreArchivo = insumo.fileRef.nombre.toLowerCase()
      if (nombreArchivo.endsWith('.docx') || nombreArchivo.endsWith('.pdf')) {
        return <span className="ml-2 text-xs text-gray-500">⏳ Pendiente</span>
      }
    }
    return null
  }

  // Contar indicadores
  const contadores = { riesgo: 0, medio: 0, ok: 0 }
  datosDiagnostico.alumnos.forEach(alumno => {
    const indicador = alumno.indicador || 'ok'
    contadores[indicador] = (contadores[indicador] || 0) + 1
  })

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  const planActual = plan || (planificacionIA ? { unidades: planificacionIA.unidades } : null)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Planificación – {cursoNombre || `Curso ${cursoId}`}
      </h2>

      {/* Sección: Insumos curriculares (fuentes) */}
      <div id="insumos-curriculares" className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insumos curriculares (fuentes)</h3>
        
        {/* Insumos obligatorios */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Insumos obligatorios</h4>
          <div className="space-y-4">
            <InsumoCard
              titulo="Programa (insumo)"
              required={true}
              insumo={{
                fileRef: insumos.programa?.fileRef || null,
                texto: insumos.programa?.texto || '',
                textoExtraido: insumos.programa?.textoExtraido || '',
                updatedAt: insumos.programa?.updatedAt || ''
              }}
              onChange={handleProgramaChange}
            />
            <InsumoCard
              titulo="Modelo de planificación (insumo)"
              required={true}
              insumo={{
                fileRef: insumos.modelo?.fileRef || null,
                texto: insumos.modelo?.texto || '',
                textoExtraido: insumos.modelo?.textoExtraido || '',
                updatedAt: insumos.modelo?.updatedAt || ''
              }}
              onChange={handleModeloChange}
            />
          </div>
        </div>

        {/* Insumos adicionales */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Insumos adicionales</h4>
            <button
              onClick={handleAgregarInsumo}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              + Agregar insumo
            </button>
          </div>
          <div className="space-y-4">
            {insumos.adicionales.map(adicional => (
              <InsumoCard
                key={adicional.id}
                titulo={adicional.titulo || 'Insumo adicional (sin título)'}
                required={false}
                insumo={{ fileRef: adicional.fileRef, texto: adicional.texto, textoExtraido: adicional.textoExtraido, updatedAt: adicional.updatedAt, titulo: adicional.titulo }}
                onChange={(nuevoInsumo) => {
                  // Si el nuevo insumo tiene título, actualizarlo también
                  const insumoActualizado = { ...adicional, ...nuevoInsumo }
                  if (nuevoInsumo.titulo !== undefined) {
                    insumoActualizado.titulo = nuevoInsumo.titulo
                  }
                  handleInsumoAdicionalChange(adicional.id, insumoActualizado)
                }}
                onQuitar={() => handleQuitarInsumoAdicional(adicional.id)}
                tipo={adicional.tipo}
                onTipoChange={(tipo) => handleInsumoAdicionalTipoChange(adicional.id, tipo)}
                onTituloChange={(titulo) => handleInsumoAdicionalTituloChange(adicional.id, titulo)}
                mostrarCheckboxFuente={true}
                usarComoFuente={adicional.usarComoFuente}
                onFuenteChange={(value) => handleInsumoAdicionalFuenteChange(adicional.id, value)}
              />
            ))}
            {insumos.adicionales.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay insumos adicionales. Hacé click en "+ Agregar insumo" para agregar uno.
              </p>
            )}
          </div>
        </div>

        {/* Selector de modo */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Modo de generación</h4>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" name="modo" value="repositorio" defaultChecked className="mr-2" />
              <span className="text-sm text-gray-700">Solo mi repositorio</span>
            </label>
            <label className="flex items-center opacity-50 cursor-not-allowed" title="Próximamente">
              <input type="radio" name="modo" value="web" disabled className="mr-2" />
              <span className="text-sm text-gray-700">Repo + web</span>
            </label>
          </div>
        </div>

        {/* Botón generar con IA */}
        <button
          onClick={handleGenerarConIA}
          disabled={generandoIA}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            generandoIA
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {generandoIA ? 'Generando...' : 'Generar planificación con IA'}
        </button>
      </div>

      {/* Sección: Diagnóstico (resumen) */}
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

      {/* Sección: Planificación generada (borrador IA) */}
      {planificacionIA && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Planificación generada (borrador IA)
            <span className="ml-2 text-xs font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Requiere revisión
            </span>
          </h3>

          {/* Resumen de insumos */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Resumen de insumos</h4>
              <button
                onClick={() => {
                  document.getElementById('insumos-curriculares')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Ir a Insumos →
              </button>
            </div>
            {Array.isArray(warningsIA) && warningsIA.length > 0 && (
              <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                <div className="font-medium">
                  ⚠️ Algunos insumos no se pudieron leer:
                </div>
                <div className="mt-1 space-y-1">
                  {warningsIA.map((w, idx) => {
                    const titulo = w?.titulo || 'Insumo'
                    return (
                      <div key={`${titulo}_${idx}`}>
                        - {titulo}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2">
                  Convertí .DOC a .DOCX y volvé a cargar.
                </div>
              </div>
            )}
            <div className="space-y-2 text-sm text-gray-700">
              {insumos.programa?.fileRef && (
                <p>
                  <span className="font-medium">Programa:</span> {insumos.programa.fileRef.nombre}
                  {obtenerEstadoLectura(insumos.programa)}
                </p>
              )}
              {insumos.modelo?.fileRef && (
                <p>
                  <span className="font-medium">Modelo:</span> {insumos.modelo.fileRef.nombre}
                  {obtenerEstadoLectura(insumos.modelo)}
                </p>
              )}
              {insumos.adicionales?.filter(a => a.fileRef && a.usarComoFuente).map(adicional => (
                <p key={adicional.id}>
                  <span className="font-medium">Adicional:</span> {adicional.titulo || 'Insumo adicional (sin título)'} - {adicional.fileRef.nombre}
                  {obtenerEstadoLectura(adicional)}
                </p>
              ))}
            </div>
          </div>

          {/* Tabs de secciones */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            {['fundamentacion', 'propositos', 'objetivos', 'contenidos', 'evaluacion'].map(seccion => (
              <button
                key={seccion}
                onClick={() => setSeccionActiva(seccion)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  seccionActiva === seccion
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {seccion === 'fundamentacion' ? 'Fundamentación' :
                 seccion === 'propositos' ? 'Propósitos' :
                 seccion === 'objetivos' ? 'Objetivos' :
                 seccion === 'contenidos' ? 'Contenidos' :
                 'Evaluación'}
              </button>
            ))}
            <button
              onClick={() => setSeccionActiva('unidades')}
              className={`px-4 py-2 text-sm font-medium transition ${
                seccionActiva === 'unidades'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unidades
            </button>
          </div>

          {/* Contenido de sección activa */}
          {seccionActiva !== 'unidades' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {seccionActiva === 'fundamentacion' ? 'Fundamentación' :
                   seccionActiva === 'propositos' ? 'Propósitos' :
                   seccionActiva === 'objetivos' ? 'Objetivos' :
                   seccionActiva === 'contenidos' ? 'Contenidos' :
                   'Evaluación'}
                </label>
                <button
                  onClick={() => setMostrandoEvidencia(seccionActiva)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Ver evidencia
                </button>
              </div>
              <textarea
                value={planificacionIA[seccionActiva] || ''}
                onChange={(e) => handleActualizarSeccionIA(seccionActiva, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                rows="8"
              />
            </div>
          ) : (
            <div>
              <div className="space-y-3 mb-4">
                {planificacionIA.unidades.map((unidad) => (
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
                              {['contenidos', 'actividades', 'recursos', 'evaluacion', 'adaptaciones'].map(campo => (
                                <div key={campo}>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {campo === 'contenidos' ? 'Contenidos' :
                                     campo === 'actividades' ? 'Actividades' :
                                     campo === 'recursos' ? 'Recursos' :
                                     campo === 'evaluacion' ? 'Evaluación' :
                                     'Adaptaciones'}
                                  </label>
                                  <textarea
                                    value={semana[campo] || ''}
                                    onChange={(e) => actualizarSemana(unidad.id, semana.id, campo, e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    rows="2"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bibliografía */}
          {planificacionIA.bibliografia && planificacionIA.bibliografia.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bibliografía</h4>
              <ul className="list-disc list-inside space-y-1">
                {planificacionIA.bibliografia.map((bib, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{bib}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleGuardarPlan}
            className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Guardar planificación
          </button>
        </div>
      )}

      {/* Sección: Estructura de planificación (si no hay IA generada) */}
      {!planificacionIA && planActual && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estructura de planificación</h3>
          
          {/* Información automática */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Materia:</span> {meta.materia || 'No determinada'}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Docente:</span> {meta.docente || 'No determinado'}
            </p>
          </div>

          {/* Formulario Meta */}
          <div className="grid grid-cols-2 gap-4 mb-4">
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

          {/* Lista de unidades */}
          <div className="space-y-3 mb-4">
            {planActual.unidades.map((unidad) => (
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
                          {['contenidos', 'actividades', 'recursos', 'evaluacion', 'adaptaciones'].map(campo => (
                            <div key={campo}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {campo === 'contenidos' ? 'Contenidos' :
                                 campo === 'actividades' ? 'Actividades' :
                                 campo === 'recursos' ? 'Recursos' :
                                 campo === 'evaluacion' ? 'Evaluación' :
                                 'Adaptaciones'}
                              </label>
                              <textarea
                                value={semana[campo] || ''}
                                onChange={(e) => actualizarSemana(unidad.id, semana.id, campo, e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                rows="2"
                              />
                            </div>
                          ))}
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
        </div>
      )}

      {/* Panel de evidencia */}
      {mostrandoEvidencia && (
        <EvidenciaPanel
          seccion={mostrandoEvidencia}
          evidencia={evidencia}
          fuentesUsadas={fuentesUsadas}
          onCerrar={() => setMostrandoEvidencia(null)}
        />
      )}
    </div>
  )
}

export default Planificacion
