import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { getMessages } from '../api/contact'
import { useAuth } from './AuthContext'

interface UnreadMessagesContextValue {
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  decrementUnread: () => void
}

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | undefined>(
  undefined,
)

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const { isAuthenticated } = useAuth()

  // Fetch unread count on mount and when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const messages = await getMessages()
        const unread = messages.filter((m) => !m.is_read).length
        setUnreadCount(unread)
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    fetchUnreadCount()

    // Refetch every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const incrementUnread = useCallback(() => {
    setUnreadCount((prev) => prev + 1)
  }, [])

  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  return (
    <UnreadMessagesContext.Provider
      value={{ unreadCount, setUnreadCount, incrementUnread, decrementUnread }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export function useUnreadMessages(): UnreadMessagesContextValue {
  const context = useContext(UnreadMessagesContext)
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider')
  }
  return context
}
