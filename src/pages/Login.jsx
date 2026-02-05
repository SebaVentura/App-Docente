import { useState } from 'react'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    
    // Simulación de login (2 segundos)
    setTimeout(() => {
      setCargando(false)
      // Navegar después del login
      if (onLogin) {
        onLogin()
      }
    }, 2000)
  }

  const handleOlvidePassword = () => {
    // Lógica para "Olvidé mi contraseña" (por implementar)
    console.log('Olvidé mi contraseña')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              La APP del Docente
            </h1>
            <p className="text-sm text-gray-600">
              Acceso docente
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={cargando}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="tu@email.com"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={cargando}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg 
                       font-medium hover:bg-blue-700 focus:outline-none 
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                       transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Footer - Botón olvidé contraseña */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleOlvidePassword}
              disabled={cargando}
              className="text-sm text-blue-600 hover:text-blue-700 
                       hover:underline transition disabled:opacity-50 
                       disabled:cursor-not-allowed disabled:no-underline"
            >
              Olvidé mi contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
