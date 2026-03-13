// Error classifier for BMAD Story 4-3: Operator Failure Recovery UX
// Converts raw errors into user-friendly, actionable PT-BR messages

export interface ClassifiedError {
  category: 'validation' | 'auth' | 'rate_limit' | 'service_unavailable' | 'network' | 'unknown'
  userMessage: string       // PT-BR, actionable
  actionLabel?: string      // Button text
  actionType?: 'retry' | 'login' | 'wait' | 'edit'
  retryable: boolean
  retryDelayMs?: number     // Suggested wait before retry
}

export function classifyError(error: any): ClassifiedError {
  const status = error?.status || error?.statusCode || error?.code
  const message = (error?.message || error?.error_description || '') as string

  // Auth errors
  if (status === 401 || status === 403) {
    return {
      category: 'auth',
      userMessage: 'Sessão expirada. Faça login novamente.',
      actionLabel: 'Fazer login',
      actionType: 'login',
      retryable: false,
    }
  }

  // Rate limit
  if (status === 429) {
    const retryAfter = error?.headers?.['retry-after']
    const waitSec = retryAfter ? parseInt(retryAfter, 10) : 30
    return {
      category: 'rate_limit',
      userMessage: `Limite de requisições atingido. Aguarde ${waitSec} segundos e tente novamente.`,
      actionLabel: `Aguardar ${waitSec}s`,
      actionType: 'wait',
      retryable: true,
      retryDelayMs: waitSec * 1000,
    }
  }

  // Service unavailable / server errors
  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return {
      category: 'service_unavailable',
      userMessage: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
      actionLabel: 'Tentar novamente',
      actionType: 'retry',
      retryable: true,
      retryDelayMs: 60_000,
    }
  }

  // Network / connectivity errors
  if (
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('load failed') ||
    message === 'Network Error'
  ) {
    return {
      category: 'network',
      userMessage: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
      actionLabel: 'Tentar novamente',
      actionType: 'retry',
      retryable: true,
      retryDelayMs: 5_000,
    }
  }

  // Validation errors — preserve the original PT-BR message if it's already actionable
  if (
    message.includes('Preencha') ||
    message.includes('precisa de') ||
    message.includes('obrigatório') ||
    message.includes('precisa ter') ||
    message.includes('Carrossel precisa') ||
    message.includes('Recurso precisa') ||
    message.includes('Blog precisa') ||
    message.includes('é obrigatório') ||
    status === 400
  ) {
    return {
      category: 'validation',
      userMessage: message || 'Dados inválidos. Verifique os campos e tente novamente.',
      actionLabel: 'Corrigir',
      actionType: 'edit',
      retryable: false,
    }
  }

  // Unknown / catch-all
  return {
    category: 'unknown',
    userMessage: message
      ? `Erro inesperado: ${message.slice(0, 120)}`
      : 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
    actionLabel: 'Tentar novamente',
    actionType: 'retry',
    retryable: true,
    retryDelayMs: 5_000,
  }
}
