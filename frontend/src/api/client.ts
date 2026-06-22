import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { getStoredToken } from '../utils/storage'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let onUnauthorized: (() => void) | null = null

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

export default apiClient
