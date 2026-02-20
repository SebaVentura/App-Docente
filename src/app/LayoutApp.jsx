import { useState, useEffect } from 'react'
import Sidebar from '../components/nav/Sidebar'
import BottomNav from '../components/nav/BottomNav'
import Breadcrumb from '../components/Breadcrumb'
import { obtenerCursos } from '../utils/datosCursos'

// Función para obtener el título según la ruta
const obtenerTitulo = (ruta) => {
  if (ruta === '/dashboard') return 'Agenda del día'
  if (ruta === '/escuelas') return 'Escuelas'
  if (ruta.startsWith('/escuelas/') && ruta.includes('/cursos')) return 'Cursos'
  if (ruta.startsWith('/cursos/') && ruta.includes('/asistencia')) return 'Asistencia'
  if (ruta.startsWith('/cursos/') && ruta.includes('/registro')) return 'Registro de clase'
  if (ruta.startsWith('/cursos/')) return 'Curso'
  return 'La APP del Docente'
}

// Función para obtener el breadcrumb según la ruta
const obtenerBreadcrumb = (ruta) => {
  // Dashboard
  if (ruta === '/dashboard') {
    return [{ label: 'Agenda', isActive: true }]
  }
  
  // Escuelas
  if (ruta === '/escuelas') {
    return [{ label: 'Escuelas', isActive: true }]
  }
  
  // Cursos de una escuela
  if (ruta.startsWith('/escuelas/') && ruta.includes('/cursos')) {
    const match = ruta.match(/^\/escuelas\/([^/]+)\/cursos$/)
    if (match) {
      const escuelaId = match[1]
      return [
        { label: 'Escuelas', path: '/escuelas' },
        { label: 'Cursos', isActive: true }
      ]
    }
    return [{ label: 'Escuelas', path: '/escuelas' }, { label: 'Cursos', isActive: true }]
  }
  
  // Planificación (navegable)
  if (ruta.startsWith('/cursos/') && ruta.includes('/planificacion')) {
    const match = ruta.match(/^\/cursos\/([^/]+)\/planificacion$/)
    if (match) {
      const cursoId = match[1]
      const todosLosCursos = obtenerCursos()
      const cursoEncontrado = todosLosCursos.find(c => String(c.id) === String(cursoId))
      const escuelaId = cursoEncontrado?.escuelaId
      
      // "Cursos" siempre navegable: si hay escuelaId va a esa escuela, sino fallback a /escuelas
      const pathCursos = escuelaId ? `/escuelas/${escuelaId}/cursos` : '/escuelas'
      
      return [
        { label: 'Escuelas', path: '/escuelas' },
        { label: 'Cursos', path: pathCursos },
        { label: 'Curso', isActive: true }
      ]
    }
  }
  
  // Asistencia
  if (ruta.startsWith('/cursos/') && ruta.includes('/asistencia')) {
    return [
      { label: 'Escuelas', path: '/escuelas' },
      { label: 'Cursos' },
      { label: 'Curso' },
      { label: 'Asistencia', isActive: true }
    ]
  }
  
  // Registro
  if (ruta.startsWith('/cursos/') && ruta.includes('/registro')) {
    return [
      { label: 'Escuelas', path: '/escuelas' },
      { label: 'Cursos' },
      { label: 'Curso' },
      { label: 'Registro', isActive: true }
    ]
  }
  
  // Curso (genérico)
  if (ruta.startsWith('/cursos/')) {
    return [
      { label: 'Escuelas', path: '/escuelas' },
      { label: 'Cursos' },
      { label: 'Curso', isActive: true }
    ]
  }
  
  return []
}

function LayoutApp({ children }) {
  const [esMobile, setEsMobile] = useState(false)
  const [ruta, setRuta] = useState(() => window.location.hash.slice(1) || '/login')

  useEffect(() => {
    const verificarTamaño = () => {
      setEsMobile(window.innerWidth < 768)
    }

    const actualizarRuta = () => {
      setRuta(window.location.hash.slice(1) || '/login')
    }

    verificarTamaño()
    window.addEventListener('resize', verificarTamaño)
    window.addEventListener('hashchange', actualizarRuta)
    
    return () => {
      window.removeEventListener('resize', verificarTamaño)
      window.removeEventListener('hashchange', actualizarRuta)
    }
  }, [])

  const handleCerrarSesion = () => {
    window.location.hash = '/login'
  }

  const titulo = obtenerTitulo(ruta)
  const breadcrumb = obtenerBreadcrumb(ruta)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header superior */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">
              La APP del Docente
            </span>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">
              {titulo}
            </h1>
          </div>
          <button
            onClick={handleCerrarSesion}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 
                     rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenedor principal con sidebar o sin sidebar según tamaño */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (solo desktop) */}
        {!esMobile && (
          <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
            <Sidebar />
          </aside>
        )}

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
          {children}
        </main>
      </div>

      {/* BottomNav (solo mobile) */}
      {esMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <BottomNav />
        </nav>
      )}

      {/* Espacio para BottomNav en mobile */}
      {esMobile && <div className="h-16" />}
    </div>
  )
}

export default LayoutApp
