// showActionableError — BMAD Story 4-3: Operator Failure Recovery UX
// Drop-in replacement for toast.error() with PT-BR actionable messages

import { toast } from 'sonner'
import { classifyError } from '@/lib/errorClassifier'

export interface ShowActionableErrorOptions {
  /** Optional retry callback shown as the toast action */
  onRetry?: () => void
  /** Force a specific action type override */
  actionTypeOverride?: 'retry' | 'login' | 'wait' | 'edit'
}

/**
 * Shows a user-friendly, actionable sonner toast for any error.
 * 
 * Usage:
 *   showActionableError(error, 'aprovação de carrossel LinkedIn')
 *   showActionableError(error, 'geração de conteúdo', { onRetry: () => handleGenerateClick() })
 */
export function showActionableError(
  error: any,
  context?: string,
  options: ShowActionableErrorOptions = {},
): void {
  const classified = classifyError(error)
  const { onRetry } = options

  // Build the toast description with context
  const description = context
    ? `Contexto: ${context}`
    : undefined

  // Build the action button based on action type
  let action: { label: string; onClick: () => void } | undefined

  const actionType = options.actionTypeOverride ?? classified.actionType

  if (actionType === 'retry' && onRetry) {
    action = {
      label: classified.actionLabel || 'Tentar novamente',
      onClick: onRetry,
    }
  } else if (actionType === 'login') {
    action = {
      label: classified.actionLabel || 'Fazer login',
      onClick: () => {
        window.location.href = '/admin/login'
      },
    }
  } else if (actionType === 'retry' && classified.retryable) {
    // Retryable but no retry callback — just show a label without onClick
    action = undefined
  }

  toast.error(classified.userMessage, {
    description,
    action,
    duration: classified.category === 'validation' ? 8000 : 6000,
  })
}
