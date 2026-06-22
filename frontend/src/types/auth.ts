export interface SignupRequest {
  username: string
  phone_number: string
  password: string
}

export interface SignupResponse {
  message: string
  user_id: number
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  id: number
  username: string
  phone_number: string
}

export interface AuthContextValue {
  token: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (payload: SignupRequest) => Promise<void>
  logout: () => void
}
