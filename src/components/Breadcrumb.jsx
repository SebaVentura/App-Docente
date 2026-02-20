import { useNavegacion } from '../app/routes'

function Breadcrumb({ items }) {
  const { navegar } = useNavegacion()
  
  if (!items || items.length === 0) return null
  
  return (
    <nav className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-gray-600">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-gray-400">/</span>}
            {item.path && !item.isActive ? (
              <button
                onClick={() => navegar(item.path)}
                className="hover:underline"
              >
                {item.label}
              </button>
            ) : (
              <span className={item.isActive ? 'text-gray-900 font-medium' : ''}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb
