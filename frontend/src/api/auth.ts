import apiClient from './client'
import type { LoginResponse, SignupRequest, SignupResponse, UserProfile } from '../types/auth'

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>('/api/auth/signup', payload)
  return data
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)

  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function getCurrentUser(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/api/auth/me')
  return data
}
