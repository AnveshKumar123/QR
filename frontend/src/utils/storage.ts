const TOKEN_KEY = 'qr_app_access_token'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}
