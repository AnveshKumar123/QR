import apiClient from './client'
import type { CreateQRResponse, DeleteQRResponse, QRCodeItem } from '../types/qr'

export async function createQRCode(): Promise<CreateQRResponse> {
  const { data } = await apiClient.get<CreateQRResponse>('/api/qr_code')
  return data
}

export async function getQRCodeImage(): Promise<{ public_code: string; contact_url: string; qr_image: string }> {
  const { data } = await apiClient.get<{ public_code: string; contact_url: string; qr_image: string }>('/api/qr_code/image')
  return data
}

export async function listQRCodes(): Promise<QRCodeItem[]> {
  const { data } = await apiClient.get<QRCodeItem[]>('/api/my-qr-codes')
  return data
}

export async function deleteQRCode(qrId: number): Promise<DeleteQRResponse> {
  const { data } = await apiClient.delete<DeleteQRResponse>(`/api/qr-codes/${qrId}`)
  return data
}

export function buildContactUrl(publicCode: string): string {
  return `${window.location.origin}/contact/${publicCode}`
}
