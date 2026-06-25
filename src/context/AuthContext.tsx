import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Session, UserRole } from '../utils/auth'
import { getSession, login as doLogin, logout as doLogout, initDefaultUsers } from '../utils/auth'
import { sendTelegram, msgLogin, msgLogout } from '../utils/telegram'

interface AuthContextType {
  session:  Session | null
  loading:  boolean
  isAdmin:  boolean
  role:     UserRole | null
  login:    (username: string, password: string) => Promise<'ok' | 'invalid'>
  logout:   () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDefaultUsers().then(() => {
      setSession(getSession())
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<'ok' | 'invalid'> => {
    const s = await doLogin(username, password)
    if (s) {
      setSession(s)
      sendTelegram(msgLogin(s.username, s.role)) // fire-and-forget
      return 'ok'
    }
    return 'invalid'
  }, [])

  const logout = useCallback(() => {
    const current = getSession()
    if (current) sendTelegram(msgLogout(current.username, current.role, current.loginAt))
    doLogout()
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      isAdmin: session?.role === 'admin',
      role:    session?.role ?? null,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
