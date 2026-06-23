import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMessages, markMessageRead } from '../api/contact'
import type { Message } from '../types/contact'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function MessagesPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages'],
    queryFn: getMessages,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const markAsReadMutation = useMutation({
    mutationFn: markMessageRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })

  if (!isAuthenticated) {
    return <div className="p-8 text-center">Please log in to view your messages.</div>
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading messages...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load messages.</div>
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <Card className="p-8 text-center text-gray-500">
          No messages yet. When people scan your QR code and send messages, they'll appear here.
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="space-y-4">
        {messages.map((message: Message) => (
          <Card
            key={message.id}
            className={`p-4 ${!message.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    {message.sender_name || 'Anonymous'}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({message.sender_phone})
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    message.action_type === 'message' ? 'bg-blue-100 text-blue-800' :
                    message.action_type === 'call' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {message.action_type}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{message.message_content}</p>
                <p className="text-xs text-gray-400">
                  {formatRelativeTime(message.created_at)}
                </p>
              </div>
              {!message.is_read && (
                <Button
                  onClick={() => markAsReadMutation.mutate(message.id)}
                  variant="secondary"
                  disabled={markAsReadMutation.isPending}
                >
                  Mark as Read
                </Button>
              )}
            </div>
            {message.twilio_sid && (
              <div className="text-xs text-green-600 mt-2">
                ✓ Sent via SMS
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
