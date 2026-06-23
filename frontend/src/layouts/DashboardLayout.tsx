import { Link, Outlet, useLocation } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { NotificationBadge } from '../components/ui/NotificationBadge'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useUnreadMessages } from '../context/UnreadMessagesContext'

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useUnreadMessages()
  const location = useLocation()
  const isMessagesPage = location.pathname === '/messages'

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-lg font-bold text-brand-700 dark:text-brand-100">
              QR Contact
            </Link>
            <Link to="/messages" className="relative text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              Messages
              {!isMessagesPage && <NotificationBadge count={unreadCount} />}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
              {user?.username}
            </span>
            <Button variant="ghost" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
