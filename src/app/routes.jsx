import { useState, useEffect } from 'react'
import Login from '../pages/Login'
import LayoutApp from './LayoutApp'
import Escuelas from '../pages/Escuelas'
import Cursos from '../pages/Cursos'
import CursoHome from '../pages/CursoHome'
import Asistencia from '../pages/Asistencia'
import Dashboard from '../pages/Dashboard'
import Trayectorias from '../pages/Trayectorias'
import Diagnosticos from '../pages/Diagnosticos'
import Planificacion from '../pages/Planificacion'
import RegistroClase from '../pages/RegistroClase'
import ClasesCurso from '../pages/ClasesCurso'
import DetalleClase from '../pages/DetalleClase'
import AdminClasesCurso from '../pages/AdminClasesCurso'
import DeclaracionJurada from '../pages/DeclaracionJurada'
import Perfil from '../pages/Perfil'

function Router() {
  const [ruta, setRuta] = useState(() => {
    // Inicializar con la ruta del hash o por defecto /login
    const hash = window.location.hash.slice(1)
    if (!hash) {
      window.location.hash = '/login'
      return '/login'
    }
    return hash
  })

  // Sincronizar con cambios en el hash
  useEffect(() => {
    const handleHashChange = () => {
      setRuta(window.location.hash.slice(1) || '/login')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Función de navegación
  const navegar = (path) => {
    window.location.hash = path
    setRuta(path)
  }

  // Renderizar según la ruta
  const renderizarRuta = () => {
    // Login (sin layout)
    if (ruta === '/login') {
      return <Login onLogin={() => navegar('/escuelas')} />
    }

    // Rutas con layout
    if (ruta.startsWith('/escuelas/') && ruta.includes('/cursos')) {
      // /escuelas/:escuelaId/cursos
      const match = ruta.match(/^\/escuelas\/(\d+)\/cursos$/)
      if (match) {
        const escuelaId = match[1]
        return (
          <LayoutApp>
            <Cursos escuelaId={escuelaId} />
          </LayoutApp>
        )
      }
    }

    // Ruta de asistencia: /cursos/:cursoId/asistencia
    if (ruta.startsWith('/cursos/') && ruta.includes('/asistencia')) {
      const match = ruta.match(/^\/cursos\/(\d+)\/asistencia$/)
      if (match) {
        const cursoId = match[1]
        return (
          <LayoutApp>
            <Asistencia cursoId={cursoId} />
          </LayoutApp>
        )
      }
    }

    // Ruta de registro de clase: /cursos/:cursoId/registro
    if (ruta.startsWith('/cursos/') && ruta.includes('/registro')) {
      const match = ruta.match(/^\/cursos\/(\d+)\/registro$/)
      if (match) {
        const cursoId = match[1]
        return (
          <LayoutApp>
            <RegistroClase cursoId={cursoId} />
          </LayoutApp>
        )
      }
    }

    // Ruta de trayectorias: /cursos/:cursoId/trayectorias
    if (ruta.startsWith('/cursos/') && ruta.includes('/trayectorias')) {
      const match = ruta.match(/^\/cursos\/(\d+)\/trayectorias$/)
      if (match) {
        const cursoId = match[1]
        return (
          <LayoutApp>
            <Trayectorias cursoId={cursoId} />
          </LayoutApp>
        )
      }
    }

    // Ruta de diagnósticos: /cursos/:cursoId/diagnosticos
    if (ruta.startsWith('/cursos/') && ruta.includes('/diagnosticos')) {
      const match = ruta.match(/^\/cursos\/(\d+)\/diagnosticos$/)
      if (match) {
        const cursoId = match[1]
        return (
          <LayoutApp>
            <Diagnosticos cursoId={cursoId} />
          </LayoutApp>
        )
      }
    }

    // Ruta de planificación: /cursos/:cursoId/planificacion
    if (ruta.startsWith('/cursos/') && ruta.includes('/planificacion')) {
      const match = ruta.match(/^\/cursos\/(\d+)\/planificacion$/)
      if (match) {
        const cursoId = match[1]
        return (
          <LayoutApp>
            <Planificacion cursoId={cursoId} />
          </LayoutApp>
        )
      }
    }

    // Ruta de clases: /cursos/:cursoId/clases
    if (ruta.startsWith('/cursos/') && ruta.includes('/clases')) {
      // Admin: /cursos/:cursoId/clases/admin (PRIMERO, más específico)
      const matchAdmin = ruta.match(/^\/cursos\/([^/]+)\/clases\/admin$/)
      if (matchAdmin) {
        const cursoId = matchAdmin[1]
        return (
          <LayoutApp>
            <AdminClasesCurso cursoId={cursoId} />
          </LayoutApp>
        )
      }
      
      // Detalle: /cursos/:cursoId/clases/:numeroClase
      const matchDetalle = ruta.match(/^\/cursos\/([^/]+)\/clases\/(\d+)$/)
      if (matchDetalle) {
        const cursoId = matchDetalle[1]
        const numeroClase = matchDetalle[2]
        return (
          <LayoutApp>
            <DetalleClase cursoId={cursoId} numeroClase={parseInt(numeroClase, 10)} />
          </LayoutApp>
        )
      }
      
      // Lista: /cursos/:cursoId/clases
      const match = ruta.match(/^\/cursos\/([^/]+)\/clases$/)
      if (match) {
        const cursoId = match[1]
        return (
          <LayoutApp>
            <ClasesCurso cursoId={cursoId} />
          </LayoutApp>
        )
      }
    }

    // Ruta de Declaración Jurada: /declaracion-jurada
    if (ruta === '/declaracion-jurada') {
      return (
        <LayoutApp>
          <DeclaracionJurada />
        </LayoutApp>
      )
    }

    // Ruta de Perfil: /perfil
    if (ruta === '/perfil') {
      return (
        <LayoutApp>
          <Perfil />
        </LayoutApp>
      )
    }

    if (ruta.startsWith('/cursos/')) {
      // /cursos/:cursoId
      const match = ruta.match(/^\/cursos\/(\d+)$/)
      if (match) {
        const cursoId = match[1]
        return (
          <LayoutApp>
            <CursoHome cursoId={cursoId} />
          </LayoutApp>
        )
      }
    }

    if (ruta === '/escuelas') {
      return (
        <LayoutApp>
          <Escuelas />
        </LayoutApp>
      )
    }

    if (ruta === '/dashboard') {
      return (
        <LayoutApp>
          <Dashboard />
        </LayoutApp>
      )
    }

    // Ruta no encontrada, redirigir a login
    return <Login onLogin={() => navegar('/escuelas')} />
  }

  return (
    <div>
      {renderizarRuta()}
    </div>
  )
}

// Hook para usar la navegación en componentes
export const useNavegacion = () => {
  const navegar = (path) => {
    window.location.hash = path
  }
  return { navegar }
}

export default Router
