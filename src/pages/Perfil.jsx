import { useState, useEffect } from 'react'
import { obtenerPerfilDocente, guardarPerfilDocente, normalizarCUIL } from '../utils/datosPerfil'

function Perfil() {
  const añoActual = new Date().getFullYear().toString()

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    dni: '',
    cuil: '',
    domicilio: '',
    telefono: '',
    email: '',
    cicloLectivo: añoActual
  })

  const [errores, setErrores] = useState({})
  const [mensajeExito, setMensajeExito] = useState('')

  // Cargar perfil al montar
  useEffect(() => {
    const perfil = obtenerPerfilDocente()
    if (perfil) {
      setFormData(perfil)
    }
  }, [])

  // Limpiar mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (mensajeExito) {
      const timer = setTimeout(() => {
        setMensajeExito('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [mensajeExito])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo al escribir
    if (errores[name]) {
      setErrores(prev => {
        const nuevo = { ...prev }
        delete nuevo[name]
        return nuevo
      })
    }
  }

  const validarFormulario = () => {
    const nuevosErrores = {}

    // Validar nombre completo
    if (!formData.nombreCompleto.trim()) {
      nuevosErrores.nombreCompleto = 'El apellido y nombre es obligatorio'
    }

    // Validar DNI
    if (!formData.dni.trim()) {
      nuevosErrores.dni = 'El DNI es obligatorio'
    } else if (!/^\d{7,8}$/.test(formData.dni.trim())) {
      nuevosErrores.dni = 'El DNI debe tener 7 u 8 dígitos numéricos'
    }

    // Validar CUIL
    if (!formData.cuil.trim()) {
      nuevosErrores.cuil = 'El CUIL es obligatorio'
    } else {
      const cuilNormalizado = normalizarCUIL(formData.cuil)
      if (!/^\d{2}-\d{8}-\d{1}$/.test(cuilNormalizado)) {
        nuevosErrores.cuil = 'El CUIL debe tener el formato XX-XXXXXXXX-X'
      }
    }

    // Validar domicilio
    if (!formData.domicilio.trim()) {
      nuevosErrores.domicilio = 'El domicilio es obligatorio'
    }

    // Validar teléfono
    if (!formData.telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es obligatorio'
    }

    // Validar email
    if (!formData.email.trim()) {
      nuevosErrores.email = 'El correo electrónico es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nuevosErrores.email = 'Ingresá un correo electrónico válido'
    }

    // Validar ciclo lectivo
    if (!formData.cicloLectivo.toString().trim()) {
      nuevosErrores.cicloLectivo = 'El ciclo lectivo es obligatorio'
    } else if (isNaN(Number(formData.cicloLectivo)) || Number(formData.cicloLectivo) <= 0) {
      nuevosErrores.cicloLectivo = 'El ciclo lectivo debe ser un número válido'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    // Normalizar CUIL antes de guardar
    const perfilAGuardar = {
      ...formData,
      cuil: normalizarCUIL(formData.cuil),
      nombreCompleto: formData.nombreCompleto.trim(),
      dni: formData.dni.trim(),
      domicilio: formData.domicilio.trim(),
      telefono: formData.telefono.trim(),
      email: formData.email.trim(),
      cicloLectivo: formData.cicloLectivo.toString().trim()
    }

    guardarPerfilDocente(perfilAGuardar)
    setFormData(perfilAGuardar)
    setMensajeExito('Perfil guardado correctamente')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Perfil del Docente
      </h2>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Apellido y Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido y Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errores.nombreCompleto ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Pérez, Juan"
            />
            {errores.nombreCompleto && (
              <p className="mt-1 text-sm text-red-600">{errores.nombreCompleto}</p>
            )}
          </div>

          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DNI <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errores.dni ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: 12345678"
              maxLength="8"
            />
            {errores.dni && (
              <p className="mt-1 text-sm text-red-600">{errores.dni}</p>
            )}
          </div>

          {/* CUIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CUIL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cuil"
              value={formData.cuil}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errores.cuil ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: 20-12345678-9"
            />
            {errores.cuil && (
              <p className="mt-1 text-sm text-red-600">{errores.cuil}</p>
            )}
          </div>

          {/* Domicilio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domicilio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="domicilio"
              value={formData.domicilio}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errores.domicilio ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Calle Falsa 123, CABA"
            />
            {errores.domicilio && (
              <p className="mt-1 text-sm text-red-600">{errores.domicilio}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errores.telefono ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: 11-1234-5678"
            />
            {errores.telefono && (
              <p className="mt-1 text-sm text-red-600">{errores.telefono}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errores.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: juan.perez@email.com"
            />
            {errores.email && (
              <p className="mt-1 text-sm text-red-600">{errores.email}</p>
            )}
          </div>

          {/* Ciclo lectivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciclo lectivo <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="cicloLectivo"
              value={formData.cicloLectivo}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errores.cicloLectivo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: 2025"
              min="2000"
              max="2100"
            />
            {errores.cicloLectivo && (
              <p className="mt-1 text-sm text-red-600">{errores.cicloLectivo}</p>
            )}
          </div>

          {/* Mensaje de éxito */}
          {mensajeExito && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">{mensajeExito}</p>
            </div>
          )}

          {/* Botón guardar */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Guardar perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Perfil
