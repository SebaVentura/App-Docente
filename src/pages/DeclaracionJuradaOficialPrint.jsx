import { useEffect } from 'react'
import { mapearSituacionRevista } from '../utils/dj'

function DeclaracionJuradaOficialPrint({ djSnapshotGlobal, onClose }) {
  // Días de la semana en orden
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  // Ejecutar print después de renderizar
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (!djSnapshotGlobal || !djSnapshotGlobal.filas || djSnapshotGlobal.filas.length === 0) return null

  return (
    <div className="print-container">
      <style>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4 landscape;
          }
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .print-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            background: white;
          }
        }
        .celda-diagonal {
          background: linear-gradient(to bottom right, transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px));
        }
      `}</style>

      {/* Bloque superior: Título y datos personales */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          DECLARACIÓN JURADA
        </h1>
        
        {/* Datos personales del docente */}
        <div className="mb-4 space-y-2">
          <p className="text-gray-700">
            <span className="font-medium">Nombre:</span> {djSnapshotGlobal.docente.nombre || '-'}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">DNI:</span> {djSnapshotGlobal.docente.dni || '-'}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">CUIL:</span> {djSnapshotGlobal.docente.cuil || '-'}
          </p>
          {djSnapshotGlobal.docente.domicilio && (
            <p className="text-gray-700">
              <span className="font-medium">Domicilio:</span> {djSnapshotGlobal.docente.domicilio}
            </p>
          )}
          {djSnapshotGlobal.docente.telefono && (
            <p className="text-gray-700">
              <span className="font-medium">Teléfono:</span> {djSnapshotGlobal.docente.telefono}
            </p>
          )}
          {djSnapshotGlobal.docente.email && (
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {djSnapshotGlobal.docente.email}
            </p>
          )}
          {djSnapshotGlobal.docente.cicloLectivo && (
            <p className="text-gray-700">
              <span className="font-medium">Ciclo lectivo:</span> {djSnapshotGlobal.docente.cicloLectivo}
            </p>
          )}
        </div>
        
        {/* Fecha */}
        <p className="text-sm text-gray-500">
          Fecha: {djSnapshotGlobal.fecha}
        </p>
      </div>

      {/* Tabla única continua con formato Excel oficial */}
      <table className="w-full border-collapse border border-gray-800 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 px-2 py-2 text-center font-bold">Distrito/Servicio educativo</th>
            <th className="border border-gray-800 px-2 py-2 text-center font-bold">Cargo</th>
            <th className="border border-gray-800 px-2 py-2 text-center font-bold">Situación de revista</th>
            <th className="border border-gray-800 px-2 py-2 text-center font-bold" colSpan="3">
              Cant Hs Cátedra
            </th>
            <th className="border border-gray-800 px-2 py-2 text-center font-bold" colSpan="3">
              Cant Módulos
            </th>
            <th className="border border-gray-800 px-2 py-2 text-center font-bold">Toma de posesión</th>
            <th className="border border-gray-800 px-2 py-2 text-center font-bold" colSpan="6">
              Horario de prestación de servicios
            </th>
            <th className="border border-gray-800 px-2 py-2 text-center font-bold">Conformidad del Superior Jerárquico</th>
          </tr>
          <tr className="bg-gray-50">
            <th className="border border-gray-800 px-2 py-1"></th>
            <th className="border border-gray-800 px-2 py-1"></th>
            <th className="border border-gray-800 px-2 py-1"></th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">T</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">P</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">S</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">T</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">P</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">S</th>
            <th className="border border-gray-800 px-2 py-1"></th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">Lunes</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">Martes</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">Miércoles</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">Jueves</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">Viernes</th>
            <th className="border border-gray-800 px-1 py-1 text-center font-medium">Sábado</th>
            <th className="border border-gray-800 px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {djSnapshotGlobal.filas.map((fila, index) => {
            const situacion = mapearSituacionRevista(fila.situacionRevista)
            const esHorasCatedra = fila.tipoCarga === 'HORAS_CATEDRA'
            const esModulos = fila.tipoCarga === 'MODULOS'
            
            return (
              <tr key={index}>
                {/* Distrito / Servicio educativo */}
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {fila.distritoServicioEducativo}
                </td>
                {/* Cargo */}
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {fila.cargo}
                </td>
                {/* Situación de revista */}
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {fila.situacionRevista}
                </td>
                {/* Hs. Cátedra T/P/S */}
                <td className="border border-gray-800 px-1 py-2 text-center">
                  {esHorasCatedra && situacion === 'T' ? fila.cantidadCarga : '-'}
                </td>
                <td className="border border-gray-800 px-1 py-2 text-center">
                  {esHorasCatedra && situacion === 'P' ? fila.cantidadCarga : '-'}
                </td>
                <td className="border border-gray-800 px-1 py-2 text-center">
                  {esHorasCatedra && situacion === 'S' ? fila.cantidadCarga : '-'}
                </td>
                {/* Módulos T/P/S */}
                <td className="border border-gray-800 px-1 py-2 text-center">
                  {esModulos && situacion === 'T' ? fila.cantidadCarga : '-'}
                </td>
                <td className="border border-gray-800 px-1 py-2 text-center">
                  {esModulos && situacion === 'P' ? fila.cantidadCarga : '-'}
                </td>
                <td className="border border-gray-800 px-1 py-2 text-center">
                  {esModulos && situacion === 'S' ? fila.cantidadCarga : '-'}
                </td>
                {/* Toma de posesión */}
                <td className="border border-gray-800 px-2 py-2 text-center"></td>
                {/* Horarios por día */}
                {diasSemana.map(dia => (
                  <td key={dia} className={`border border-gray-800 px-1 py-2 text-center text-xs ${!fila.horariosPorDia[dia] ? 'celda-diagonal' : ''}`}>
                    {fila.horariosPorDia[dia] || ''}
                  </td>
                ))}
                {/* Conformidad */}
                <td className="border border-gray-800 px-2 py-2 text-center"></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Botón cerrar (solo en pantalla, no en impresión) */}
      <div className="no-print mt-6 text-center">
        <button
          onClick={onClose}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default DeclaracionJuradaOficialPrint
