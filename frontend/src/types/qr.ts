export interface QRCodeItem {
  id: number
  public_code: string
  is_active: boolean
  created_at: string | null
  scan_count: number
  last_scanned_at: string | null
}

export interface CreateQRResponse {
  public_code: string
}

export interface DeleteQRResponse {
  message: string
}
