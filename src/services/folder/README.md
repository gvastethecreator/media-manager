# 📁 FolderService: Servicio de gestión de carpetas

## Descripción

Servicio central para la gestión de carpetas, indexado, reindexado, borrado y emisión de eventos en tiempo real.

- **Stack:** Node.js, Next.js, Prisma, eventos custom, Server Actions.
- **Ubicación:** `src/services/folder/`

## Eventos soportados

- `PROGRESS` → `folder:progress`
- `COMPLETE` → `folder:complete`
- `ERROR` → `folder:error`
- `REINDEX_ALL_PROGRESS` → `folder:reindexAll:progress`
- `REINDEX_ALL_COMPLETE` → `folder:reindexAll:complete`

## Diagrama de emisión de eventos

```mermaid
graph TD
  S[Operación de carpeta (index/reindex)] -->|Éxito| C[emitEvent(COMPLETE)]
  S -->|Error| E[emitEvent(ERROR)]
  S -->|Progreso| P[emitEvent(PROGRESS)]
  G[Reindexado global] -->|Progreso| GP[emitEvent(REINDEX_ALL_PROGRESS)]
  G -->|Finaliza| GC[emitEvent(REINDEX_ALL_COMPLETE)]
```

## Flujo de emisión y propagación

1. Al finalizar un proceso, se emite el evento correspondiente (`COMPLETE` o `REINDEX_ALL_COMPLETE`).
2. El evento se mapea y propaga al sistema central (`folder:complete`, `folder:reindexAll:complete`).
3. El frontend escucha estos eventos y actualiza la UI en tiempo real.

## Ejemplo de emisión

```ts
this.emitEvent(FOLDER_EVENTS.COMPLETE, folderResponse);
this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, completionStatus);
```

## Best practices

- Emitir SIEMPRE el evento de finalización tras éxito.
- Emitir `ERROR` en fallos y limpiar estado.
- Documentar cualquier cambio relevante en este README.
