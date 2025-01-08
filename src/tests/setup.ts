import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Configurar el entorno global básico
Object.defineProperty(global, 'TextEncoder', { value: TextEncoder })
Object.defineProperty(global, 'TextDecoder', { value: TextDecoder })

// Importar mocks en orden correcto
jest.mock('next/server', () => {
  const { NextResponse, NextRequest } = require('./mocks/next-mocks')
  return {
    NextResponse,
    NextRequest
  }
})

import './mocks/headers-mocks'  // Primero Headers
import './mocks/request-mocks'  // Luego Request
import './mocks/next-mocks'     // Finalmente Response y NextResponse

// Variables de entorno
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
}

// Mock de fetch usando nuestros mocks personalizados
global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const { Response } = global
  return Promise.resolve(
    new Response(JSON.stringify({ data: 'mocked response' }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    })
  )
}) as jest.Mock

// Configuración de Jest para pruebas
beforeAll(() => {
  // Silenciar warnings específicos
  const originalError = console.error
  const originalWarn = console.warn

  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Error: Not implemented: navigation') ||
        args[0].includes('Invalid hook call') ||
        args[0].includes('❌ [API]')) // Silenciar errores de API en pruebas
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: useLayoutEffect does nothing on the server') ||
        args[0].includes('Warning: React.createFactory()'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks()
})