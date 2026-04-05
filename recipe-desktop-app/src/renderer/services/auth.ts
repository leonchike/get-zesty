import api from './api'
import { ENDPOINTS } from './endpoints'
import type { AuthResponse, User } from '@/types'

// Decode JWT to check expiration
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    return decoded.exp ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token)
  if (!expiry) return true
  return Date.now() >= expiry
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(ENDPOINTS.LOGIN, {
    data: { email, password }
  })
  await window.api.auth.storeToken(data.token)
  await window.api.store.set('user', data.user)
  return data
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(ENDPOINTS.REGISTER, {
    data: { email, password, name }
  })
  await window.api.auth.storeToken(data.token)
  await window.api.store.set('user', data.user)
  return data
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>(ENDPOINTS.GET_CURRENT_USER)
  return data
}

export async function logout(): Promise<void> {
  await window.api.auth.clearToken()
  await window.api.store.delete('user')
}

export async function getStoredUser(): Promise<User | null> {
  const user = await window.api.store.get('user')
  return (user as User) || null
}

export async function getStoredToken(): Promise<string | null> {
  return window.api.auth.getToken()
}
