import { Outlet } from 'react-router-dom'

import { Card } from '../components/ui/Card'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <Outlet />
      </Card>
    </div>
  )
}
