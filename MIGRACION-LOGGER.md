# Migración de serverLogger a clientLogger

## Problema

Se ha detectado un uso generalizado de `serverLogger` en componentes que se ejecutan en el lado del cliente. Esto causa errores en tiempo de ejecución porque `serverLogger` está diseñado para ejecutarse exclusivamente en el servidor.

## Solución

Reemplazar todas las instancias de `serverLogger` por `clientLogger` en componentes del lado del cliente, especialmente en:

1. Archivos de Store (Ya completado)
2. Componentes en `src/components/**/*`
3. Hooks en `src/hooks/**/*`

## Archivos actualizados hasta ahora

Hemos completado la migración de todos los archivos del directorio `src/store/entities/`:

- `src/store/entities/tag/slices/core.slice.ts`
- `src/store/entities/wildcard/slices/ui.ts`
- `src/store/entities/wildcard/slices/core.ts`
- `src/store/entities/property/slices/ui.ts`
- `src/store/entities/property/slices/filters.ts`
- `src/store/entities/property/slices/core.ts`
- `src/store/entities/queue-job/slices/filters.ts`
- `src/store/entities/queue-job/slices/ui.ts`
- `src/store/entities/queue-job/slices/core.ts`
- `src/store/entities/queue-job/queue-job-store.ts`
- `src/store/entities/prompt/slices/ui.ts`
- `src/store/entities/prompt/slices/relations.ts`
- `src/store/entities/prompt/slices/filters.ts`
- `src/store/entities/prompt/slices/execution.ts`
- `src/store/entities/prompt/slices/core.ts`
- `src/store/entities/prompt/store.ts`
- `src/store/entities/note/slices/core.ts`
- `src/store/entities/note/slices/filters.ts`
- `src/store/entities/note/slices/selection.ts`
- `src/store/entities/note/slices/ui.ts`
- `src/store/entities/note/slices/relations.ts`
- `src/store/entities/note/index.ts`
- `src/store/entities/group/slices/ui.ts`
- `src/store/entities/group/slices/filters.ts`
- `src/store/entities/group/slices/core.ts`
- `src/store/entities/concept/store.ts`
- `src/store/entities/concept/slices/core.ts`
- `src/store/entities/concept/slices/filters.ts`
- `src/store/entities/concept/slices/relations.ts`
- `src/store/entities/concept/slices/ui.ts`
- `src/store/entities/activity/index.ts`
- `src/store/files/file-manager.store.ts`

## Archivos pendientes por actualizar

Se han identificado numerosos componentes que todavía usan `serverLogger`. Estos necesitan ser actualizados:

### Componentes Visuales
- Todos los componentes de vistas en `src/components/views/`
- Componentes de tarjetas en `src/components/cards/`
- Componentes de navegación en `src/components/navigation/`
- Componentes de funcionalidad en `src/components/features/`
- Componentes de configuración en `src/components/settings/`

## Script de migración

Se ha creado un script en `scripts/update-stores-logger.js` que puede automatizar la migración. Este script:

1. Busca archivos con importaciones de `serverLogger`
2. Reemplaza la importación por `clientLogger`
3. Actualiza todas las referencias de `serverLogger` a `clientLogger`

Para ejecutar el script:

```bash
node scripts/update-stores-logger.js
```

## Consideraciones adicionales

- Algunos componentes pueden estar marcados con la directiva `'use server'` y en ese caso SÍ deben usar `serverLogger`
- Los Server Components de Next.js deben usar `serverLogger`
- Los Client Components (marcados con `'use client'`) deben usar `clientLogger`
- Los Server Actions siempre deben usar `serverLogger`

## Pasos siguientes

1. Utilizar el script para actualizar los componentes pendientes
2. Verificar manualmente los componentes que puedan tener consideraciones especiales
3. Ejecutar la aplicación y verificar que no hayan errores relacionados con logging

## Impacto

Esta migración mejorará la estabilidad de la aplicación al eliminar errores relacionados con el uso incorrecto de loggers, manteniendo la capacidad de registro tanto en el lado del cliente como en el servidor.