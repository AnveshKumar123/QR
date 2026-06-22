import { Link, Outlet } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-lg font-bold text-brand-700 dark:text-brand-100">
              QR Contact
            </Link>
            <Link to="/messages" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              Messages
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
