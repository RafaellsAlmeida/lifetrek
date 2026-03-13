import { classifyError, ClassifiedError } from '@/lib/errorClassifier'
import { cn } from '@/lib/utils'
import { AlertCircle, Wifi, ShieldAlert, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  /** Raw error object (from React Query's `error` field) */
  error: any
  /** Context for the error message (e.g. "carregamento do conteúdo") */
  context?: string
  /** Retry callback — if provided and error is retryable, shows a retry button */
  onRetry?: () => void
  className?: string
}

const categoryIcon: Record<ClassifiedError['category'], React.ElementType> = {
  auth: ShieldAlert,
  rate_limit: Clock,
  service_unavailable: AlertTriangle,
  network: Wifi,
  validation: AlertCircle,
  unknown: AlertCircle,
}

const categoryColors: Record<ClassifiedError['category'], string> = {
  auth: 'bg-destructive/10 border-destructive/30 text-destructive',
  rate_limit: 'bg-amber-50 border-amber-200 text-amber-800',
  service_unavailable: 'bg-orange-50 border-orange-200 text-orange-800',
  network: 'bg-blue-50 border-blue-200 text-blue-800',
  validation: 'bg-amber-50 border-amber-200 text-amber-800',
  unknown: 'bg-destructive/10 border-destructive/30 text-destructive',
}

/**
 * ErrorBanner — Story 4-3: Operator Failure Recovery UX
 * 
 * Shown inline (not as a toast) when a data fetch fails, so the operator
 * can see a persistent error with context and an optional retry button.
 *
 * Usage:
 *   const { data, error, refetch } = useContentApprovalItems()
 *   {error && <ErrorBanner error={error} context="listagem de aprovações" onRetry={refetch} />}
 */
export function ErrorBanner({ error, context, onRetry, className }: ErrorBannerProps) {
  if (!error) return null

  const classified = classifyError(error)
  const Icon = categoryIcon[classified.category]
  const colors = categoryColors[classified.category]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        colors,
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {context ? `Erro ao carregar ${context}` : 'Ocorreu um erro'}
        </p>
        <p className="mt-0.5 text-sm opacity-80">{classified.userMessage}</p>
      </div>
      {onRetry && classified.retryable && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0"
        >
          {classified.actionLabel || 'Tentar novamente'}
        </Button>
      )}
    </div>
  )
}
