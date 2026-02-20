import { useState } from 'react'
import { guardarArchivoInsumo, borrarArchivoInsumo } from '../../utils/insumosPlanificacion'
import { extraerTextoDOCX } from '../../utils/extraccionTexto'
import { extraerTextoPDF } from '../../utils/extraccionPdf'

/**
 * Componente reutilizable para mostrar/editar un insumo
 * @param {Object} props
 * @param {string} props.titulo - Título del insumo (fijo para obligatorios, editable para adicionales)
 * @param {boolean} props.required - Si es obligatorio (Programa/Modelo)
 * @param {Object} props.insumo - { fileRef?, texto?, textoExtraido?, updatedAt }
 * @param {Function} props.onChange - (insumo) => void
 * @param {Function} props.onQuitar - () => void (solo si no es required)
 * @param {string} props.tipo - Para adicionales: tipo de insumo
 * @param {Function} props.onTipoChange - (tipo) => void (solo para adicionales)
 * @param {Function} props.onTituloChange - (titulo) => void (solo para adicionales)
 * @param {boolean} props.mostrarCheckboxFuente - Si mostrar checkbox "Usar como fuente"
 * @param {boolean} props.usarComoFuente - Valor del checkbox
 * @param {Function} props.onFuenteChange - (value) => void
 */
function InsumoCard({
  titulo,
  required = false,
  insumo = { fileRef: null, texto: '', updatedAt: '' },
  onChange,
  onQuitar,
  tipo,
  onTipoChange,
  onTituloChange,
  mostrarCheckboxFuente = false,
  usarComoFuente = true,
  onFuenteChange
}) {
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [extrayendoTexto, setExtrayendoTexto] = useState(false)

  const handleSubirArchivo = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setSubiendoArchivo(true)
    try {
      const fileRef = await guardarArchivoInsumo(file)
      
      // Autocompletar título con nombre del archivo (sin extensión) si está vacío
      // Solo para insumos adicionales (cuando onTituloChange existe)
      let tituloActualizado = titulo
      if (onTituloChange && !titulo.trim()) {
        // Extraer nombre sin extensión
        tituloActualizado = file.name.replace(/\.[^/.]+$/, '')
        onTituloChange(tituloActualizado)
      }
      
      // Inicializar insumo con fileRef
      let nuevoInsumo = {
        ...insumo,
        fileRef,
        titulo: tituloActualizado
      }

      // Extraer texto automáticamente si es DOCX o PDF y no existe textoExtraido
      const esDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file.name.toLowerCase().endsWith('.docx')
      const esPDF = file.name.toLowerCase().endsWith('.pdf')
      
      if ((esDOCX || esPDF) && !insumo.textoExtraido) {
        setExtrayendoTexto(true)
        try {
          let textoExtraido = null
          if (esDOCX) {
            textoExtraido = await extraerTextoDOCX(file)
          } else if (esPDF) {
            textoExtraido = await extraerTextoPDF(file)
          }
          
          if (textoExtraido) {
            nuevoInsumo.textoExtraido = textoExtraido
          }
        } catch (error) {
          console.warn('No se pudo extraer texto del archivo:', error)
          // No mostrar error al usuario, solo continuar sin texto extraído
        } finally {
          setExtrayendoTexto(false)
        }
      }

      onChange(nuevoInsumo)
    } catch (error) {
      alert(error.message || 'Error al subir el archivo')
      event.target.value = ''
    } finally {
      setSubiendoArchivo(false)
    }
  }

  const handleQuitarArchivo = async () => {
    if (insumo.fileRef) {
      try {
        await borrarArchivoInsumo(insumo.fileRef)
      } catch (e) {
        console.warn('Error al borrar archivo de IndexedDB:', e)
      }
    }
    onChange({
      ...insumo,
      fileRef: null,
      textoExtraido: '' // Limpiar texto extraído al quitar archivo
    })
  }

  const handleTextoChange = (texto) => {
    onChange({
      ...insumo,
      texto
    })
  }

  const formatearFecha = (iso) => {
    if (!iso) return ''
    try {
      const fecha = new Date(iso)
      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        {required ? (
          <h4 className="text-sm font-semibold text-gray-900">
            {titulo}
            <span className="text-red-600 ml-1">*</span>
          </h4>
        ) : (
          <>
            {onTituloChange ? (
              <input
                type="text"
                value={titulo}
                onChange={(e) => onTituloChange(e.target.value)}
                placeholder="Título del insumo"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold"
              />
            ) : (
              <h4 className="text-sm font-semibold text-gray-900">{titulo}</h4>
            )}
            {onQuitar && (
              <button
                onClick={onQuitar}
                className="ml-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Quitar
              </button>
            )}
          </>
        )}
      </div>

      {/* Tipo (solo para adicionales) */}
      {onTipoChange && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={tipo || ''}
            onChange={(e) => onTipoChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="Diseño curricular oficial">Diseño curricular oficial</option>
            <option value="Acuerdo institucional">Acuerdo institucional</option>
            <option value="Proyecto de área">Proyecto de área</option>
            <option value="Planificación anterior">Planificación anterior</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      )}

      {/* Subir archivo */}
      <div className="mb-3">
        <input
          type="file"
          onChange={handleSubirArchivo}
          accept=".pdf,.doc,.docx,.txt,.odt"
          disabled={subiendoArchivo}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 mt-1">Máx 2MB</p>
      </div>

      {/* Archivo cargado */}
      {insumo.fileRef && (
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{insumo.fileRef.nombre}</p>
              <p className="text-xs text-gray-500">
                {(insumo.fileRef.tamano / 1024).toFixed(2)} KB
              </p>
              {/* Estado de extracción de texto */}
              {extrayendoTexto && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <span className="animate-spin">⏳</span> Extrayendo texto {insumo.fileRef?.nombre.toLowerCase().endsWith('.pdf') ? '(PDF)' : '(DOCX)'}...
                </p>
              )}
              {!extrayendoTexto && insumo.textoExtraido && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  ✅ Texto extraído {insumo.fileRef?.nombre.toLowerCase().endsWith('.pdf') ? '(PDF)' : '(DOCX)'}
                </p>
              )}
              {!extrayendoTexto && insumo.fileRef && !insumo.textoExtraido && 
               (insumo.fileRef.nombre.toLowerCase().endsWith('.docx') || 
                insumo.fileRef.nombre.toLowerCase().endsWith('.pdf') ||
                insumo.fileRef.tipo === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') && (
                <p className="text-xs text-gray-500 mt-1">
                  ⏳ Pendiente
                </p>
              )}
            </div>
            <button
              onClick={handleQuitarArchivo}
              className="text-red-600 hover:text-red-700 text-sm font-medium ml-2"
            >
              Quitar
            </button>
          </div>
        </div>
      )}

      {/* Textarea texto */}
      <div className="mb-3">
        <textarea
          value={insumo.texto || ''}
          onChange={(e) => handleTextoChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows="4"
          placeholder="O pegá aquí el texto..."
        />
      </div>

      {/* Checkbox "Usar como fuente" (solo para adicionales) */}
      {mostrarCheckboxFuente && (
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={usarComoFuente}
              onChange={(e) => onFuenteChange(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Usar como fuente para IA</span>
          </label>
        </div>
      )}

      {/* Última actualización */}
      {insumo.updatedAt && (
        <p className="text-xs text-gray-500">
          Última actualización: {formatearFecha(insumo.updatedAt)}
        </p>
      )}
    </div>
  )
}

export default InsumoCard
