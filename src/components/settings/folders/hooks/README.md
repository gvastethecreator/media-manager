# 🗂️ useFolders y hooks relacionados

## Descripción

Este módulo contiene el hook principal `useFolders` y los hooks auxiliares para la gestión de carpetas en la configuración de la aplicación. Gestiona el estado, operaciones CRUD, reindexado, polling, eventos en tiempo real y sincronización con el backend.

- **Stack:** Vite, React 19, Zustand, React Query, Server Actions, Zod, eventos custom.
- **Ubicación:** `src/components/settings/folders/hooks/`

## Hooks incluidos

- `useFolders`: Hook principal, orquesta todo el flujo de carpetas.
- `useFoldersState`: Estado y acciones locales (folders, stats, errores).
- `useFoldersPolling`: Polling seguro para estado de procesos.
- `useFoldersEvents`: Suscripción a eventos del backend.
- `useFoldersOperations`: CRUD y operaciones de negocio.

## Diagrama de flujo de actualización en tiempo real

```mermaid
graph TD
  A[Proceso Backend Termina] --> B[Evento/Callback onComplete]
  B --> C[setProcessStatus(complete)]
  C --> D[loadFolders() + loadStats()]
  D --> E[UI Refresca Estado]
  E --> F[setTimeout Limpia Estado]
```

## Ejemplo de uso

```tsx
import { useFolders } from './hooks/use-folders';

function FoldersSettings() {
  const {
    folders, stats, isProcessing, processStatus,
    handleAddFolder, handleReindexFolder, ...
  } = useFolders();

  // ...renderizado y lógica
}
```

## Best practices

- Siempre validar con Zod antes de persistir datos.
- Usar los tipos canónicos de `@/app/actions/folders/folder-types.ts`.
- No importar tipos de Prisma en ningún archivo cliente.
- Documentar cualquier cambio relevante en este README.

## Referencias

- [Transformers de Folder](../../../transformers/folder/README.md)
- [Arquitectura de eventos](../../../lib/events/README.md)
