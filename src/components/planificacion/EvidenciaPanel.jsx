/**
 * Panel modal para mostrar evidencia de una sección
 */

import { formatearOrigen } from '../../utils/planificacionesIA'

function EvidenciaPanel({ seccion, evidencia, fuentesUsadas, onCerrar }) {
  // Filtrar evidencia por sección
  const evidenciaSeccion = evidencia.filter(e => e.seccion === seccion)

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'alta':
        return 'bg-green-100 text-green-800'
      case 'media':
        return 'bg-yellow-100 text-yellow-800'
      case 'baja':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceLabel = (confidence) => {
    switch (confidence) {
      case 'alta':
        return 'Alta'
      case 'media':
        return 'Media'
      case 'baja':
        return 'Baja'
      default:
        return confidence
    }
  }

  const getSeccionLabel = (seccion) => {
    const labels = {
      fundamentacion: 'Fundamentación',
      propositos: 'Propósitos',
      objetivos: 'Objetivos',
      contenidos: 'Contenidos',
      evaluacion: 'Evaluación'
    }
    return labels[seccion] || seccion
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Evidencia: {getSeccionLabel(seccion)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {evidenciaSeccion.length} {evidenciaSeccion.length === 1 ? 'referencia' : 'referencias'}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {evidenciaSeccion.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay evidencia disponible para esta sección.
            </p>
          ) : (
            <div className="space-y-4">
              {evidenciaSeccion.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  {/* Fuente */}
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      Fuente: {item.fuente.titulo}
                      {item.origen && (
                        <span className="ml-2 text-xs font-normal text-gray-600">
                          — {formatearOrigen(item.origen)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Tipo: {item.fuente.tipo === 'programa' ? 'Programa' : item.fuente.tipo === 'modelo' ? 'Modelo' : 'Insumo adicional'}
                      {item.pagina && ` • ${item.pagina}`}
                    </p>
                  </div>

                  {/* Fragmento */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Fragmento:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-indigo-400">
                      "{item.fragmento}"
                    </p>
                  </div>

                  {/* Confidence y requiere revisión */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getConfidenceColor(item.confidence)}`}>
                      Confianza: {getConfidenceLabel(item.confidence)}
                    </span>
                    {item.requiere_revision && (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-orange-100 text-orange-800">
                        Requiere revisión
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Fuentes usadas: {fuentesUsadas.length} {fuentesUsadas.length === 1 ? 'insumo' : 'insumos'}
            </p>
            <button
              onClick={onCerrar}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EvidenciaPanel
