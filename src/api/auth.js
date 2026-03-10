import { apiClient } from './client'
import {
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  clearSession
} from './authStorage'

export {
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  clearSession
}

/**
 * Login contra POST /api/login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: Object }>}
 */
export async function login(email, password) {
  const { data } = await apiClient.post('/api/login', { email, password })
  // Laravel Sanctum puede devolver { token, user } o { data: { token, user } }
  const token = data?.data?.token ?? data?.token
  const user = data?.data?.user ?? data?.user
  if (token) {
    setToken(token)
    if (user) setStoredUser(user)
  }
  return { token, user }
}

/**
 * Obtener usuario actual vía GET /api/me
 * @returns {Promise<Object>}
 */
export async function getMe() {
  const { data } = await apiClient.get('/api/me')
  const user = data?.data ?? data
  if (user) setStoredUser(user)
  return user
}

/**
 * Logout voluntario: intenta POST /api/logout, luego limpia sesión local
 */
export async function logout() {
  try {
    await apiClient.post('/api/logout')
  } catch {
    // Ignorar error; igualmente limpiar sesión local
  } finally {
    clearSession()
  }
}
