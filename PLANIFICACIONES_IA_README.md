# Planificaciones con IA - Guía de Uso

## Resumen

El módulo de Planificaciones ahora soporta múltiples insumos curriculares y generación de planificaciones con IA (actualmente usando mock).

## Archivos Creados/Modificados

### Nuevos archivos:
- `src/utils/archivosLocal.js` - Gestión de archivos en IndexedDB
- `src/utils/insumosPlanificacion.js` - Persistencia de insumos múltiples
- `src/utils/planificacionesIA.js` - Generación IA (mock)
- `src/components/planificacion/InsumoCard.jsx` - Componente reutilizable para insumos
- `src/components/planificacion/EvidenciaPanel.jsx` - Panel modal de evidencia

### Archivos modificados:
- `src/pages/Planificacion.jsx` - UI completa con insumos múltiples e IA
- `src/utils/datosPlanificacion.js` - Mantiene compatibilidad con v1

## Funcionalidades

### 1. Insumos Curriculares

#### Insumos Obligatorios:
- **Programa (insumo)**: Siempre cuenta como fuente para IA
- **Modelo de planificación (insumo)**: Siempre cuenta como fuente para IA

Cada uno permite:
- Subir archivo (PDF/DOCX/TXT/ODT, máx 2MB)
- Pegar texto directamente
- Ver "Última actualización"

#### Insumos Adicionales:
- Botón "+ Agregar insumo" para agregar múltiples fuentes
- Cada insumo adicional tiene:
  - Tipo (select): Diseño curricular, Acuerdo institucional, Proyecto de área, Planificación anterior, Otro
  - Título (editable, requerido)
  - Archivo y/o texto
  - Checkbox "Usar como fuente para IA" (default ON)

### 2. Generación con IA

1. Completar insumos obligatorios (Programa y Modelo)
2. Opcionalmente agregar insumos adicionales
3. Completar Materia y Docente
4. Click en "Generar planificación con IA"

**Validaciones:**
- Programa debe tener archivo o texto
- Modelo debe tener archivo o texto
- Materia y Docente deben estar completos

### 3. Planificación Generada

La planificación generada incluye:
- **Secciones editables**: Fundamentación, Propósitos, Objetivos, Contenidos, Evaluación
- **Tab "Unidades"**: Estructura de unidades y semanas (similar al sistema anterior)
- **Bibliografía**: Generada automáticamente desde títulos de insumos marcados como fuente
- **Evidencia**: Cada sección tiene un botón "Ver evidencia" que muestra:
  - Fuentes usadas
  - Fragmentos extraídos
  - Páginas/secciones
  - Nivel de confianza (alta/media/baja)
  - Badge "Requiere revisión"

### 4. Persistencia

- **Archivos**: Guardados en IndexedDB (nativo del navegador)
- **Referencias**: Guardadas en localStorage (solo metadata: key, nombre, tipo, tamaño)
- **Migración automática**: Si existe `planificacion_v1`, se migra automáticamente a la nueva estructura

## Estructura de Datos

### Insumos (localStorage: `planificacion_insumos_v2`):
```javascript
{
  programa: {
    fileRef: { key, nombre, tipo, tamano } | null,
    texto: string | '',
    updatedAt: string
  },
  modelo: {
    fileRef: { key, nombre, tipo, tamano } | null,
    texto: string | '',
    updatedAt: string
  },
  adicionales: [
    {
      id: string,
      tipo: string,
      titulo: string,
      fileRef: { key, nombre, tipo, tamano } | null,
      texto: string | '',
      usarComoFuente: boolean,
      updatedAt: string
    }
  ]
}
```

### Planificación IA (resultado):
```javascript
{
  planificacion: {
    fundamentacion: string,
    propositos: string,
    objetivos: string,
    contenidos: string,
    evaluacion: string,
    bibliografia: string[],
    unidades: [...]
  },
  evidencia: [
    {
      seccion: string,
      fuente: { tipo, id, titulo },
      fragmento: string,
      pagina: string,
      confidence: 'alta' | 'media' | 'baja',
      requiere_revision: true
    }
  ],
  fuentesUsadas: [...]
}
```

## TODO: Reemplazar Mock por Endpoint Real

### Paso 1: Configurar endpoint

En `src/utils/planificacionesIA.js`, reemplazar la función `generarPlanificacionIA`:

```javascript
export async function generarPlanificacionIA({ cursoId, meta, insumos }) {
  // 1. Preparar payload
  const payload = {
    cursoId,
    meta,
    insumos: {
      programa: {
        // Si hay archivo, obtener Blob y convertir a base64 o subir a storage
        // Si hay texto, enviar texto
      },
      modelo: { ... },
      adicionales: insumos.adicionales.filter(a => a.usarComoFuente).map(a => {
        // Preparar cada insumo adicional marcado como fuente
      })
    }
  }

  // 2. Llamar al endpoint
  const response = await fetch('/api/planificaciones/generar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Agregar token de autenticación si aplica
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error('Error al generar planificación')
  }

  // 3. Retornar resultado (debe tener la misma estructura que el mock)
  return await response.json()
}
```

### Paso 2: Manejo de archivos

Si el endpoint requiere archivos:
- Opción A: Convertir Blobs a base64 y enviar en JSON
- Opción B: Subir archivos a storage (S3, Supabase Storage, etc.) y enviar URLs
- Opción C: Usar FormData para multipart/form-data

Ejemplo con base64:
```javascript
import { obtenerArchivoInsumo } from './insumosPlanificacion'

// En generarPlanificacionIA:
if (insumos.programa.fileRef) {
  const blob = await obtenerArchivoInsumo(insumos.programa.fileRef)
  const base64 = await blobToBase64(blob)
  payload.insumos.programa.archivoBase64 = base64
}
```

### Paso 3: Manejo de errores

Agregar manejo robusto de errores:
```javascript
try {
  const resultado = await generarPlanificacionIA(...)
  return resultado
} catch (error) {
  if (error.message.includes('timeout')) {
    throw new Error('La generación está tardando más de lo esperado. Por favor, intentá nuevamente.')
  }
  if (error.message.includes('429')) {
    throw new Error('Demasiadas solicitudes. Por favor, esperá unos minutos.')
  }
  throw error
}
```

### Paso 4: Loading states

El componente ya tiene `generandoIA` state. Asegurarse de que el botón muestre "Generando..." y esté deshabilitado.

### Paso 5: Validar estructura de respuesta

El endpoint debe retornar exactamente la misma estructura que el mock:
- `planificacion`: objeto con secciones y unidades
- `evidencia`: array de items de evidencia
- `fuentesUsadas`: array de fuentes

### Paso 6: Testing

1. Probar con insumos mínimos (solo Programa y Modelo)
2. Probar con insumos adicionales
3. Probar con archivos grandes (cerca del límite 2MB)
4. Probar con solo texto (sin archivos)
5. Validar que la evidencia se muestre correctamente

## Notas Técnicas

- **IndexedDB**: Los archivos se guardan como Blobs en IndexedDB para evitar problemas de tamaño en localStorage
- **Migración**: La migración desde v1 es automática y solo ocurre una vez
- **Validaciones**: Todas las validaciones están en `validarInsumosParaIA()`
- **Bibliografía**: Se genera automáticamente desde títulos de insumos con `usarComoFuente === true`

## Compatibilidad

- Mantiene compatibilidad con planificaciones v1 existentes
- La migración es transparente para el usuario
- Los archivos antiguos (base64 en localStorage) se migran automáticamente a IndexedDB
