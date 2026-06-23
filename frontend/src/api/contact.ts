import apiClient from './client'
import type {
  ContactActionResponse,
  ContactValidateResponse,
  MessageRequest,
  Message,
} from '../types/contact'

export async function validateContact(publicCode: string): Promise<ContactValidateResponse> {
  const { data } = await apiClient.get<ContactValidateResponse>(`/api/contact/${publicCode}`)
  return data
}

export async function initiateCall(
  publicCode: string,
  idempotentKey: string,
): Promise<ContactActionResponse> {
  const { data } = await apiClient.post<ContactActionResponse>(
    `/api/contact/${publicCode}/call`,
    {},
    { headers: { idempotent_key: idempotentKey } },
  )
  return data
}

export async function sendMessage(
  publicCode: string,
  payload: MessageRequest,
  idempotentKey: string,
): Promise<ContactActionResponse> {
  const { data } = await apiClient.post<ContactActionResponse>(
    `/api/contact/${publicCode}/message`,
    payload,
    { headers: { idempotent_key: idempotentKey } },
  )
  return data
}

export async function sendNotify(
  publicCode: string,
  idempotentKey: string,
): Promise<ContactActionResponse> {
  const { data } = await apiClient.post<ContactActionResponse>(
    `/api/contact/${publicCode}/notify`,
    {},
    { headers: { idempotent_key: idempotentKey } },
  )
  return data
}

export async function getMessages(): Promise<Message[]> {
  const { data } = await apiClient.get<Message[]>('/api/messages')
  return data
}

export async function markMessageRead(messageId: number): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(`/api/messages/${messageId}/read`)
  return data
}

export async function markAllMessagesRead(): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>('/api/messages/read-all')
  return data
}
