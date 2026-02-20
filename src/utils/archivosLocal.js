/**
 * Utilidades para guardar archivos en IndexedDB
 * Evita guardar base64 en localStorage (frágil por tamaño)
 */

const DB_NAME = 'app_docente_archivos'
const DB_VERSION = 1
const STORE_NAME = 'archivos'

let dbInstance = null

/**
 * Inicializa la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Error al abrir IndexedDB'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Guarda un archivo en IndexedDB
 * @param {Object} params - { blob: Blob, nombre: string, tipo: string }
 * @returns {Promise<{ key: string, nombre: string, tipo: string, tamano: number }>}
 */
export async function guardarArchivo({ blob, nombre, tipo }) {
  // Validar tamaño (2MB)
  const maxSizeBytes = 2 * 1024 * 1024
  if (blob.size > maxSizeBytes) {
    throw new Error('El archivo excede el límite de 2MB')
  }

  const db = await initDB()
  const key = `archivo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const item = {
      key,
      nombre,
      tipo,
      tamano: blob.size,
      blob: blob,
      createdAt: new Date().toISOString()
    }

    const request = store.add(item)

    request.onsuccess = () => {
      resolve({
        key,
        nombre,
        tipo,
        tamano: blob.size
      })
    }

    request.onerror = () => {
      reject(new Error('Error al guardar archivo en IndexedDB'))
    }
  })
}

/**
 * Obtiene un archivo desde IndexedDB
 * @param {string} key - Clave del archivo
 * @returns {Promise<Blob | null>}
 */
export async function obtenerArchivo(key) {
  if (!key) return null

  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)

    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.blob : null)
    }

    request.onerror = () => {
      reject(new Error('Error al obtener archivo de IndexedDB'))
    }
  })
}

/**
 * Borra un archivo de IndexedDB
 * @param {string} key - Clave del archivo
 * @returns {Promise<void>}
 */
export async function borrarArchivo(key) {
  if (!key) return

  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Error al borrar archivo de IndexedDB'))
    }
  })
}

/**
 * Convierte un File a Blob (helper)
 * @param {File} file
 * @returns {Blob}
 */
export function fileToBlob(file) {
  return file
}
