import { useNavegacion } from '../../app/routes'

function BottomNav() {
  const { navegar } = useNavegacion()

  const menuItems = [
    { path: '/dashboard', label: 'Agenda', icon: '📅' },
    { path: '/escuelas', label: 'Escuelas', icon: '🏫' },
    { path: '/declaracion-jurada', label: 'DJ', icon: '📄' },
    { path: '/perfil', label: 'Perfil', icon: '👤' },
  ]

  const rutaActual = window.location.hash.slice(1) || '/login'

  return (
    <nav className="flex justify-around items-center h-16">
      {menuItems.map((item) => {
        const estaActivo = rutaActual === item.path || rutaActual.startsWith(item.path + '/')
        return (
          <button
            key={item.path}
            onClick={() => navegar(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition ${
              estaActivo
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
