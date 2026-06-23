import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from 'react'

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
