import { useState, useEffect } from 'react'
import { useNavegacion } from '../app/routes'
import { obtenerEscuelas } from '../utils/datosEscuelas'
import { obtenerCursos } from '../utils/datosCursos'
import { obtenerPerfilDocente, validarPerfilCompleto } from '../utils/datosPerfil'
import { buildDJGlobal } from '../utils/dj'
import { exportarDJExcel } from '../utils/exportDJExcel'
import DeclaracionJuradaOficialPrint from './DeclaracionJuradaOficialPrint'

function DeclaracionJurada() {
  const { navegar } = useNavegacion()
  const [djSnapshotGlobal, setDjSnapshotGlobal] = useState(null)
  const [tieneCursosIncompletos, setTieneCursosIncompletos] = useState(false)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [mostrarVistaImprimible, setMostrarVistaImprimible] = useState(false)
  const [exportandoExcel, setExportandoExcel] = useState(false)

  // Cargar todas las escuelas y cursos al montar
  useEffect(() => {
    const escuelas = obtenerEscuelas()
    const todosLosCursos = obtenerCursos()
    
    // Obtener y validar perfil del docente
    const perfil = obtenerPerfilDocente()
    const perfilValido = validarPerfilCompleto(perfil)
    setPerfilCompleto(perfilValido)
    
    // Mapear perfil a estructura docente para buildDJGlobal
    const docente = perfil ? {
      nombre: perfil.nombreCompleto || '',
      dni: perfil.dni || '',
      cuil: perfil.cuil || '',
      domicilio: perfil.domicilio || '',
      telefono: perfil.telefono || '',
      email: perfil.email || '',
      cicloLectivo: perfil.cicloLectivo || ''
    } : null
    
    // Generar snapshot global con estructura plana
    const snapshot = buildDJGlobal({ escuelas, cursos: todosLosCursos, docente })
    setDjSnapshotGlobal(snapshot)
    
    // Verificar si hay filas incompletas
    const incompletos = snapshot.filas.some(fila => fila.incompleto)
    setTieneCursosIncompletos(incompletos)
  }, [])

  // Si no hay snapshot o no hay filas
  if (!djSnapshotGlobal || djSnapshotGlobal.filas.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Declaración Jurada
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">
            No hay escuelas o cursos cargados. Debes crear al menos una escuela con cursos para generar la Declaración Jurada.
          </p>
          <button
            onClick={() => navegar('/escuelas')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Ir a Escuelas
          </button>
        </div>
      </div>
    )
  }

  // Handler para imprimir
  const handleImprimir = () => {
    if (tieneCursosIncompletos || !perfilCompleto || !djSnapshotGlobal) {
      return
    }
    setMostrarVistaImprimible(true)
  }
  
  const tieneProblemas = tieneCursosIncompletos || !perfilCompleto

  const handleCerrarVistaImprimible = () => {
    setMostrarVistaImprimible(false)
  }

  // Handler para exportar Excel
  const handleExportarExcel = async () => {
    if (tieneProblemas || !djSnapshotGlobal) {
      return
    }
    
    try {
      setExportandoExcel(true)
      await exportarDJExcel(djSnapshotGlobal)
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      alert(`Error al exportar: ${error.message}`)
    } finally {
      setExportandoExcel(false)
    }
  }
  
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Declaración Jurada
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          tieneProblemas
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {tieneProblemas ? 'DJ incompleta' : 'DJ lista'}
        </span>
      </div>

      {/* Aviso de perfil incompleto */}
      {!perfilCompleto && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Completá tus datos en{' '}
            <button
              onClick={() => navegar('/perfil')}
              className="underline font-medium hover:text-yellow-900"
            >
              Perfil del Docente
            </button>
            {' '}para exportar la DJ
          </p>
        </div>
      )}

      {/* Aviso de cursos incompletos */}
      {tieneCursosIncompletos && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">
            ⚠️ Algunos cursos no tienen completos los datos de Declaración Jurada. Debes completar: Situación de revista, Tipo de carga y Cantidad de carga en cada curso.
          </p>
        </div>
      )}

      {/* Botones de exportación */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleImprimir}
          disabled={tieneProblemas || !djSnapshotGlobal}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            tieneProblemas || !djSnapshotGlobal
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Imprimir / Guardar PDF
        </button>
        
        <button
          onClick={handleExportarExcel}
          disabled={tieneProblemas || !djSnapshotGlobal || exportandoExcel}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            tieneProblemas || !djSnapshotGlobal || exportandoExcel
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {exportandoExcel ? 'Generando...' : 'Descargar DJ (Excel oficial)'}
        </button>
        
        {tieneProblemas && (
          <p className="text-sm text-gray-600">
            {!perfilCompleto 
              ? 'Completá tu perfil para exportar'
              : 'Completá los cargos marcados en rojo para exportar'
            }
          </p>
        )}
      </div>

      {/* Tabla única continua */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Distrito / Servicio educativo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Cargo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Situación de revista
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Cant. Hs. Cátedra
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Cant. Módulos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Horarios
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {djSnapshotGlobal.filas.map((fila, index) => (
                <tr key={index} className={fila.incompleto ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {fila.distritoServicioEducativo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {fila.cargo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {fila.situacionRevista}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {fila.tipoCarga === 'HORAS_CATEDRA' && fila.cantidadCarga !== null ? fila.cantidadCarga : '–'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {fila.tipoCarga === 'MODULOS' && fila.cantidadCarga !== null ? fila.cantidadCarga : '–'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {Object.entries(fila.horariosPorDia)
                      .filter(([_, valor]) => valor !== null)
                      .map(([dia, horario]) => `${dia}: ${horario}`)
                      .join(' | ') || 'Sin horarios'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista imprimible oficial */}
      {mostrarVistaImprimible && djSnapshotGlobal && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <DeclaracionJuradaOficialPrint 
            djSnapshotGlobal={djSnapshotGlobal}
            onClose={handleCerrarVistaImprimible}
          />
        </div>
      )}
    </div>
  )
}

export default DeclaracionJurada
