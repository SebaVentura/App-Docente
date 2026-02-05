import { useEffect } from 'react'
import { mapearSituacionRevista } from '../utils/dj'

function DeclaracionJuradaPrint({ djSnapshot, onClose }) {
  // Función para obtener valor en celda correcta (T/P/S)
  const obtenerValorCelda = (cargo) => {
    const situacion = mapearSituacionRevista(cargo.situacionRevista)
    if (!situacion) return null
    
    if (cargo.cantidadHorasCatedra !== null) {
      // Si tiene horas cátedra, va en la grilla de Hs.Cátedra
      return { tipo: 'HORAS_CATEDRA', situacion, valor: cargo.cantidadHorasCatedra }
    } else if (cargo.cantidadModulos !== null) {
      // Si tiene módulos, va en la grilla de Módulos
      return { tipo: 'MODULOS', situacion, valor: cargo.cantidadModulos }
    }
    return null
  }

  // Ejecutar print después de renderizar
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (!djSnapshot) return null

  return (
    <div className="print-container">
      <style>{`
        @media print {
          @page {
            margin: 1cm;
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
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
        }
      `}</style>

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Declaración Jurada
        </h1>
        <p className="text-gray-700">
          <span className="font-medium">Establecimiento:</span> {djSnapshot.establecimientoNombre}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Fecha de generación: {djSnapshot.fechaGeneracion}
        </p>
      </div>

      {/* Tabla con formato Excel */}
      <table className="w-full border-collapse border border-gray-800 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 px-3 py-2 text-left font-bold">Curso/Cargo</th>
            <th className="border border-gray-800 px-3 py-2 text-left font-bold">Situación de revista</th>
            <th className="border border-gray-800 px-3 py-2 text-center font-bold" colSpan="3">
              Cant. Hs. Cátedra
            </th>
            <th className="border border-gray-800 px-3 py-2 text-center font-bold" colSpan="3">
              Cant. Módulos
            </th>
            <th className="border border-gray-800 px-3 py-2 text-left font-bold">Horarios</th>
          </tr>
          <tr className="bg-gray-50">
            <th className="border border-gray-800 px-3 py-2"></th>
            <th className="border border-gray-800 px-3 py-2"></th>
            <th className="border border-gray-800 px-2 py-1 text-center font-medium">T</th>
            <th className="border border-gray-800 px-2 py-1 text-center font-medium">P</th>
            <th className="border border-gray-800 px-2 py-1 text-center font-medium">S</th>
            <th className="border border-gray-800 px-2 py-1 text-center font-medium">T</th>
            <th className="border border-gray-800 px-2 py-1 text-center font-medium">P</th>
            <th className="border border-gray-800 px-2 py-1 text-center font-medium">S</th>
            <th className="border border-gray-800 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {djSnapshot.cargos.map((cargo, index) => {
            const valorCelda = obtenerValorCelda(cargo)
            const esHorasCatedra = valorCelda?.tipo === 'HORAS_CATEDRA'
            const esModulos = valorCelda?.tipo === 'MODULOS'
            
            return (
              <tr key={index}>
                <td className="border border-gray-800 px-3 py-2">{cargo.cursoNombre}</td>
                <td className="border border-gray-800 px-3 py-2">{cargo.situacionRevista}</td>
                {/* Hs. Cátedra T/P/S */}
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {esHorasCatedra && valorCelda.situacion === 'T' ? valorCelda.valor : '-'}
                </td>
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {esHorasCatedra && valorCelda.situacion === 'P' ? valorCelda.valor : '-'}
                </td>
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {esHorasCatedra && valorCelda.situacion === 'S' ? valorCelda.valor : '-'}
                </td>
                {/* Módulos T/P/S */}
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {esModulos && valorCelda.situacion === 'T' ? valorCelda.valor : '-'}
                </td>
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {esModulos && valorCelda.situacion === 'P' ? valorCelda.valor : '-'}
                </td>
                <td className="border border-gray-800 px-2 py-2 text-center">
                  {esModulos && valorCelda.situacion === 'S' ? valorCelda.valor : '-'}
                </td>
                <td className="border border-gray-800 px-3 py-2 text-xs">{cargo.horariosTexto}</td>
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

export default DeclaracionJuradaPrint
