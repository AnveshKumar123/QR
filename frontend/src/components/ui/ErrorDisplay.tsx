import { getErrorMessage, getStatusCode } from '../../utils/errors'

interface ErrorDisplayProps {
  error: unknown
  title?: string
}

export function ErrorDisplay({ error, title = 'Something went wrong' }: ErrorDisplayProps) {
  const status = getStatusCode(error)
  const message = getErrorMessage(error)

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      <p className="font-semibold">{title}</p>
      {status ? <p className="mt-1 text-xs uppercase tracking-wide">HTTP {status}</p> : null}
      <p className="mt-2 text-sm">{message}</p>
    </div>
  )
}
