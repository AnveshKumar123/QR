import type { AxiosError } from 'axios'

export interface ApiErrorBody {
  detail?: string | { msg: string }[]
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'string') {
    return error
  }

  const axiosError = error as AxiosError<ApiErrorBody>
  const detail = axiosError.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join(', ')
  }

  if (axiosError.message) {
    return axiosError.message
  }

  return fallback
}

export function getStatusCode(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status
}
