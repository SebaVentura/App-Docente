import { useNavegacion } from '../../app/routes'

function Sidebar() {
  const { navegar } = useNavegacion()

  const menuItems = [
    { path: '/dashboard', label: 'Agenda', icon: '📅' },
    { path: '/escuelas', label: 'Escuelas', icon: '🏫' },
    { path: '/declaracion-jurada', label: 'Declaración Jurada', icon: '📄' },
    { path: '/perfil', label: 'Perfil', icon: '👤' },
  ]

  const rutaActual = window.location.hash.slice(1) || '/login'

  return (
    <nav className="p-4">
      <ul className="space-y-2">
        {menuItems.map((item) => {
          const estaActivo = rutaActual === item.path || rutaActual.startsWith(item.path + '/')
          return (
            <li key={item.path}>
              <button
                onClick={() => navegar(item.path)}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  estaActivo
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Sidebar
