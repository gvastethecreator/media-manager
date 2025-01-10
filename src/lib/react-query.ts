import { QueryClient } from '@tanstack/react-query'
import { logger } from './logger'

const queryLogger = logger.withContext('ReactQuery')

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      cacheTime: 1000 * 60 * 5, // 5 minutos
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        queryLogger.error('Error en consulta', { error })
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        queryLogger.error('Error en mutación', { error })
      },
    },
  },
})
