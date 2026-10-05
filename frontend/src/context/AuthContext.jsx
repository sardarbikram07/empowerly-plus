import React, { createContext, useContext, useState, useCallback } from 'react'

/**
 * AuthContext – lightweight auth state holder.
 * Stores the JWT token and decoded user info.
 * Later tasks will extend this with proper refresh-token logic.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser]   = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback((newToken, userInfo) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userInfo))
    setToken(newToken)
    setUser(userInfo)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
