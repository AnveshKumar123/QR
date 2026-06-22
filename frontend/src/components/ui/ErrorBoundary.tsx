import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorDisplay } from './ErrorDisplay'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI error boundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg p-6">
          <ErrorDisplay error={this.state.error} title="Unexpected UI error" />
        </div>
      )
    }

    return this.props.children
  }
}
