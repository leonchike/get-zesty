import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode
} from 'react'
import type { User } from '@/types'
import {
  loginWithEmail,
  registerWithEmail,
  logout as logoutService,
  getCurrentUser,
  getStoredUser,
  getStoredToken,
  isTokenExpired
} from '@/services/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })
  const tokenCheckRef = useRef<ReturnType<typeof setInterval>>()
  const userCheckRef = useRef<ReturnType<typeof setInterval>>()

  const performLogout = useCallback(async () => {
    await logoutService()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  // Restore session on mount
  useEffect(() => {
    async function restore(): Promise<void> {
      try {
        const [token, user] = await Promise.all([getStoredToken(), getStoredUser()])
        if (token && !isTokenExpired(token) && user) {
          setState({ user, isAuthenticated: true, isLoading: false })
        } else if (token && !isTokenExpired(token)) {
          // Token valid but no cached user — fetch from server
          const freshUser = await getCurrentUser()
          await window.api.store.set('user', freshUser)
          setState({ user: freshUser, isAuthenticated: true, isLoading: false })
        } else {
          await performLogout()
        }
      } catch {
        await performLogout()
      }
    }
    restore()
  }, [performLogout])

  // Token expiry check every 60s
  useEffect(() => {
    if (!state.isAuthenticated) return

    tokenCheckRef.current = setInterval(async () => {
      const token = await getStoredToken()
      if (!token || isTokenExpired(token)) {
        await performLogout()
      }
    }, 60_000)

    return () => clearInterval(tokenCheckRef.current)
  }, [state.isAuthenticated, performLogout])

  // Account status check every 10min
  useEffect(() => {
    if (!state.isAuthenticated) return

    userCheckRef.current = setInterval(async () => {
      try {
        const user = await getCurrentUser()
        if (user.isAccountDisabled) {
          await performLogout()
        } else {
          await window.api.store.set('user', user)
          setState((s) => ({ ...s, user }))
        }
      } catch {
        // Network error — don't log out, just skip
      }
    }, 600_000)

    return () => clearInterval(userCheckRef.current)
  }, [state.isAuthenticated, performLogout])

  // Listen for forced logout from API interceptor
  useEffect(() => {
    const handler = (): void => {
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await loginWithEmail(email, password)
    setState({ user, isAuthenticated: true, isLoading: false })
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { user } = await registerWithEmail(email, password, name)
    setState({ user, isAuthenticated: true, isLoading: false })
  }, [])

  const refreshUser = useCallback(async () => {
    const user = await getCurrentUser()
    await window.api.store.set('user', user)
    setState((s) => ({ ...s, user }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout: performLogout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
