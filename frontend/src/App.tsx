import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { OneSignalSetup } from './components/OneSignalSetup'
import { AuthProvider } from './context/AuthContext'
import { UnreadMessagesProvider } from './context/UnreadMessagesContext'
import { ThemeProvider } from './hooks/useTheme'
import { AppRoutes } from './routes/AppRoutes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <OneSignalSetup />
              <UnreadMessagesProvider>
                <AppRoutes />
              </UnreadMessagesProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
