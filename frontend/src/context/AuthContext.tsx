import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { getCurrentUser, login as loginRequest, signup as signupRequest } from '../api/auth'
import { registerUnauthorizedHandler } from '../api/client'
import type { AuthContextValue, SignupRequest, UserProfile } from '../types/auth'
import { clearStoredToken, getStoredToken, setStoredToken } from '../utils/storage'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    getCurrentUser()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile)
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout()
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, logout])

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest(username, password)
    setStoredToken(response.access_token)
    setToken(response.access_token)
    const profile = await getCurrentUser()
    setUser(profile)
  }, [])

  const signup = useCallback(async (payload: SignupRequest) => {
    await signupRequest(payload)
    await login(payload.username, payload.password)
  }, [login])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      signup,
      logout,
    }),
    [token, user, isLoading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
