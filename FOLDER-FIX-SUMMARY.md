# Resumen de la corrección de carpetas

Este documento sintetiza las acciones realizadas para solucionar los problemas de indexación y actualización de estado en el módulo de **carpetas**.

## Problemas detectados

- Importaciones incorrectas de selectores de Zustand en `src/hooks/folder/use-folder.ts`.
- Ausencia de las funciones `invalidateFolderCache` e `invalidateAllFolderCache` en `src/lib/folder-cache.ts`.
- Fallos en la actualización del estado de indexación debido a los errores anteriores.

## Solución aplicada

1. **Funciones de cache**
   - Se implementaron `invalidateFolderCache(folderId: string)` y `invalidateAllFolderCache()` en `src/lib/folder-cache.ts` para limpiar las entradas correspondientes de `folderResponseCache` y `folderListCache`.
2. **Reexporte de selectores**
   - `src/store/entities/folder/index.ts` ahora reexporta todos los selectores definidos en `src/store/entities/folder/store.ts`.
3. **Verificación manual**
   - Tras los cambios, se reinició el servidor y se probó la vista de carpetas confirmando que `/api/folders/status` actualiza los datos correctamente.

## Estado actual

La configuración base está completa y pendiente de escribir tests unitarios para asegurar la estabilidad del nuevo flujo de cache y selectores.
