import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('gym_token'))
  const [user, setUser] = useState(() => {
  const u = sessionStorage.getItem('gym_user')
  return u ? JSON.parse(u) : null
})

  const login = useCallback((tokenValue, userData) => {
  sessionStorage.setItem('gym_token', tokenValue)
  sessionStorage.setItem('gym_user', JSON.stringify(userData))
  setToken(tokenValue)
  setUser(userData)
}, [])

const logout = useCallback(() => {
  sessionStorage.removeItem('gym_token')
  sessionStorage.removeItem('gym_user')
  setToken(null)
  setUser(null)
}, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}