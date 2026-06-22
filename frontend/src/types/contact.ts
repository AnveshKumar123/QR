export interface ContactValidateResponse {
  message: string
  status: string
  options: string[]
}

export interface MessageRequest {
  message: string
  sender_name?: string
}

export interface ContactActionResponse {
  message: string
}

export interface Message {
  id: number
  sender_phone: string
  sender_name: string | null
  message_content: string
  action_type: string
  is_read: boolean
  twilio_sid: string | null
  created_at: string
}

export type ContactAction = 'call' | 'message' | 'notify'
