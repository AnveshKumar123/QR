import { describe, expect, it, vi } from 'vitest'

import { validateContact } from '../api/contact'
import apiClient from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('contact api', () => {
  it('calls validation endpoint with public code', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { message: 'ok', status: 'valid', options: ['call'] },
    })

    const result = await validateContact('abc123')

    expect(apiClient.get).toHaveBeenCalledWith('/api/contact/abc123')
    expect(result.status).toBe('valid')
  })
})
