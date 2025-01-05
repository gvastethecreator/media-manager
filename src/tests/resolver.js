const path = require('path')

module.exports = (request, options) => {
  const defaultResolver = options.defaultResolver

  // Lista de módulos de Next.js que necesitan manejo especial
  const nextjsPackages = [
    'next/server',
    'next/navigation',
    'next/headers',
    'next/router',
    'next/link',
    'next/image',
    'next/dynamic',
    'next/jest'
  ]

  // Manejar módulos de Next.js
  if (nextjsPackages.includes(request)) {
    try {
      // Primero intentar resolver usando require.resolve
      return require.resolve(request)
    } catch (error) {
      try {
        // Si falla, intentar resolver normalmente
        return defaultResolver(request, {
          ...options,
          packageFilter: pkg => {
            if (pkg.name === 'next') {
              return { ...pkg, main: pkg.module || pkg.main }
            }
            return pkg
          }
        })
      } catch (innerError) {
        try {
          // Si falla, intentar resolver desde node_modules
          return defaultResolver(
            path.resolve(__dirname, '../../node_modules', request),
            options
          )
        } catch (lastError) {
          // Si todo falla, intentar resolver como un módulo de servidor
          return defaultResolver(
            request.replace('next/', 'next/dist/server/'),
            options
          )
        }
      }
    }
  }

  // Para módulos que comienzan con @/
  if (request.startsWith('@/')) {
    return defaultResolver(
      path.resolve(__dirname, '../../src', request.substring(2)),
      options
    )
  }

  // Para otros módulos, usar el resolver por defecto
  return defaultResolver(request, options)
}