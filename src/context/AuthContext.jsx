import { createContext, useContext, useState, useEffect } from 'react'
import { getToken, getMe, clearSession, login as authLogin, logout as authLogout } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const isAuthenticated = !!user && !!token

  useEffect(() => {
    const hydrate = async () => {
      const storedToken = getToken()
      if (!storedToken) {
        setUser(null)
        setTokenState(null)
        setIsLoadingAuth(false)
        return
      }
      try {
        const userData = await getMe()
        setUser(userData)
        setTokenState(storedToken)
      } catch (err) {
        if (err.response?.status === 401) {
          clearSession()
        }
        setUser(null)
        setTokenState(null)
      } finally {
        setIsLoadingAuth(false)
      }
    }
    hydrate()
  }, [])

  const login = async (email, password) => {
    const { token: t, user: u } = await authLogin(email, password)
    setTokenState(t)
    setUser(u ?? (await getMe()))
  }

  const logout = async () => {
    await authLogout()
    setUser(null)
    setTokenState(null)
    window.location.hash = '/login'
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isLoadingAuth,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
