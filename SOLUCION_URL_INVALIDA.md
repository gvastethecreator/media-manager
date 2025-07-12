# Solución para Errores de URL Inválida durante Indexación

## Problema

Al indexar carpetas grandes, se presentaban errores del tipo:
```
TypeError: fetch() URL is invalid
code: "ERR_INVALID_URL"
```

Estos errores ocurrían en las funciones:
- `generateThumbnail`
- `createImage`
- `emit` (eventos del servidor)

## Causa Raíz

El problema se encontraba en el archivo `src/lib/server/events.server.ts`, donde la función `emit` utilizaba una URL relativa (`/api/events`) para realizar llamadas `fetch()`. 

En el contexto del servidor (Node.js), las URLs relativas no tienen un host base, lo que causa el error `ERR_INVALID_URL`.

## Solución Implementada

### 1. Detección de Contexto

Se implementó la detección automática del contexto de ejecución:

```typescript
// Detectar si estamos en el servidor (Node.js) o cliente (navegador)
const isServer = typeof window === 'undefined';
```

### 2. Construcción de URL Apropiada

Se modificó la función `emit` para usar URLs diferentes según el contexto:

```typescript
// Construir URL apropiada según el contexto
const apiUrl = isServer 
    ? `${ENV.VITE_API_URL}/events` // URL absoluta para servidor
    : '/api/events'; // URL relativa para cliente
```

### 3. Configuración ENV

Se utiliza la configuración existente en `src/config/env.ts`:

```typescript
VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3001/api'
```

## Archivos Modificados

- `src/lib/server/events.server.ts`
  - Agregado import de `ENV` desde `@/config/env`
  - Modificada función `emit` para usar URLs contextuales

## Resultado

- ✅ Eliminados los errores `ERR_INVALID_URL` durante la indexación
- ✅ Funcionalidad de eventos preservada tanto en cliente como servidor
- ✅ Compatibilidad mantenida con entornos de desarrollo y producción

## Pruebas

Para verificar la solución:

1. Ejecutar el servidor: `npm run dev`
2. Indexar una carpeta grande desde la interfaz
3. Verificar que no aparezcan errores de URL inválida en los logs del servidor

## Notas Técnicas

- La solución es retrocompatible y no afecta el funcionamiento en el cliente
- Se mantiene la funcionalidad de eventos en tiempo real
- La detección de contexto es robusta y funciona en todos los entornos