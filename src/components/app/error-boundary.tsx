import { browser } from "wxt/browser"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Component } from "react"
import { Button } from "@/components/ui/button"
import { log } from "@/utils/logger"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * React Error Boundary 组件
 * 捕获子组件树中的 JavaScript 错误，防止整个应用崩溃
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    log.app.error("ErrorBoundary caught an error", error, errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <AlertTriangle className="size-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {browser.i18n.getMessage("error_boundary_title")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
            {browser.i18n.getMessage("error_boundary_description")}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleReset} className="gap-2">
              <RefreshCcw className="size-4" />
              {browser.i18n.getMessage("error_boundary_retry")}
            </Button>
          </div>
          {this.state.error && (
            <details className="mt-4 text-xs text-muted-foreground max-w-lg">
              <summary className="cursor-pointer hover:text-foreground">
                {browser.i18n.getMessage("error_boundary_details")}
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-auto whitespace-pre-wrap">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 页面级 Error Boundary 包装器
 * 用于包裹关键页面组件
 */
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
