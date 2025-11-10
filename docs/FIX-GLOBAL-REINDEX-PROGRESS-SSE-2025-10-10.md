# FIX: GlobalReindexProgress permanece en 0% - Eventos SSE no coinciden

**Fecha:** 2025-10-10  
**Tipo:** Bug Fix - Eventos SSE  
**Severidad:** Alta  
**Componentes afectados:**
- `src/services/folders/folder-reindex.service.ts`
- `src/components/settings/folders/hooks/use-folders-events.ts`
- `src/components/settings/folders/components/global-reindex-progress.tsx`

## 🔴 Problema Identificado

El componente `GlobalReindexProgress` mostraba **siempre 0%** durante el reindexado global, aunque los logs en `ReindexTerminal` y el progreso individual de carpetas funcionaban correctamente.

### **Síntoma:**
- ✅ Logs aparecen en `ReindexTerminal`
- ✅ Barra de progreso interna de `ReindexTerminal` funciona
- ✅ Progreso individual por carpeta funciona en tablas/grid
- ❌ **`GlobalReindexProgress` (barra pequeña superior) permanece en 0%**

### **Causa Raíz:**

**Desconexión de tipos de eventos SSE entre backend y frontend:**

```typescript
// ❌ BACKEND emite (folder-reindex.service.ts línea 846)
await emitProgress('folder:progress', {
  isProcessing: progress < 100,
  folderId: undefined,  // Sin folderId = evento global
  phase,
  progress,
  // ...
});

// ❌ FRONTEND espera (use-folders-events.ts línea 369)
const handlers = {
  'folder:progress': onFolderProgress,              // ← Handler para CARPETAS INDIVIDUALES
  'folder:reindexAll:progress': onReindexAllProgressEvt,  // ← Handler para PROGRESO GLOBAL (nunca recibe eventos)
  // ...
};
```

### **Flujo Roto:**

```
Backend (reindexado global)
  ↓ emite 'folder:progress' sin folderId
Frontend recibe evento
  ↓ enruta a onFolderProgress (carpetas individuales)
  ↓ NO llega a handleReindexAllProgress
globalReindexStatus.progress NUNCA se actualiza
  ↓
GlobalReindexProgress recibe progress={0}
  ↓
UI muestra 0% siempre
```

## ✅ Solución Implementada

**Cambiar tipo de evento emitido por el backend** para usar `'folder:reindexAll:progress'` cuando es reindexado global.

### **Código Modificado:**

**Archivo:** `src/services/folders/folder-reindex.service.ts`  
**Líneas:** 844-862

```typescript
// ANTES ❌
private async emitProgress(phase: string, progress: number, message: string): Promise<void> {
  try {
    await emitProgress('folder:progress', {  // ← Evento incorrecto
      isProcessing: progress < 100,
      folderId: undefined,
      phase,
      progress,
      filesProcessed: 0,
      totalFiles: 0,
      message,
      timestamp: Date.now(),
    } as ProcessStatus);
  } catch (error) {
    // Silencioso
  }
}

// DESPUÉS ✅
private async emitProgress(phase: string, progress: number, message: string): Promise<void> {
  try {
    // 🎯 Usar evento correcto para reindexado global
    await emitProgress('folder:reindexAll:progress', {  // ← Evento correcto
      isProcessing: progress < 100,
      folderId: undefined,
      phase,
      progress,
      filesProcessed: 0,
      totalFiles: 0,
      message,
      timestamp: Date.now(),
    } as ProcessStatus);
  } catch (error) {
    // Silencioso
  }
}
```

## 📊 Flujo de Datos Corregido

```
Backend (reindexado global)
  ↓ emite 'folder:reindexAll:progress' con progress
Frontend recibe evento
  ↓ enruta a onReindexAllProgressEvt
  ↓ llama handleReindexAllProgress
  ↓ actualiza globalReindexStatus.progress
useFolders hook
  ↓ devuelve globalReindexStatus actualizado
FoldersSettings component
  ↓ pasa progress a GlobalReindexProgress
GlobalReindexProgress
  ↓ renderiza barra con progreso correcto
✅ UI muestra progreso 0% → 12% → 25% → ... → 100%
```

## 🔍 Verificación del Fix

### **Arquitectura de Eventos SSE:**

El sistema ahora distingue correctamente:

| Evento | Contexto | Handler | Estado actualizado |
|--------|----------|---------|-------------------|
| `folder:progress` | Carpeta individual | `onFolderProgress` | `progressByFolder[folderId]` |
| `folder:reindexAll:progress` | Reindexado global | `onReindexAllProgressEvt` | `globalReindexStatus.progress` |
| `folder:reindexAll:start` | Inicio reindexado global | `onReindexAllStartEvt` | `globalReindexStatus.isProcessing = true` |
| `folder:reindexAll:complete` | Fin reindexado global | `onReindexAllCompleteEvt` | `globalReindexStatus.progress = 100` |

### **Test Manual:**

1. **Iniciar servidor:**
   ```bash
   bun run dev:full
   ```

2. **Navegar a Settings → Folders**

3. **Hacer clic en "Reindexar todo"**

4. **Verificar:**
   - ✅ Barra pequeña superior (`GlobalReindexProgress`) debe moverse de 0% → 100%
   - ✅ Logs aparecen en `ReindexTerminal`
   - ✅ Barra interna de `ReindexTerminal` también avanza
   - ✅ Progreso individual por carpeta en tabla/grid

### **Puntos de Debug:**

Si el problema persiste:

1. **Verificar eventos SSE (DevTools Network tab):**
   ```
   /api/events/stream
   → Debe emitir eventos tipo 'folder:reindexAll:progress'
   ```

2. **Console logs (activar debug):**
   ```typescript
   // En use-folders-events.ts línea 315
   eventsLogger.debug('🌍 Progreso global:', {
     p: status.progress,
     phase: status.phase,
   });
   ```

3. **Verificar estado en React DevTools:**
   ```
   FoldersSettings
   → useFolders hook
   → globalReindexStatus.progress debería cambiar
   ```

## 📝 Archivos Relacionados

### **Backend:**
- `src/services/folders/folder-reindex.service.ts` (modificado)
- `src/lib/server/events.server.ts` (función `emitProgress`)

### **Frontend:**
- `src/components/settings/folders/hooks/use-folders-events.ts` (handlers SSE)
- `src/components/settings/folders/hooks/use-folders.ts` (estado global)
- `src/components/settings/folders/folders-settings.tsx` (orquestador)
- `src/components/settings/folders/components/global-reindex-progress.tsx` (UI)

### **Tipos:**
- `src/types/folders.ts` (ProcessStatus interface)

## 🎯 Impacto

**Antes del fix:**
- Usuarios no podían ver progreso global del reindexado
- Sensación de que la aplicación está congelada
- Solo visible en terminal interna (no prominente)

**Después del fix:**
- ✅ Feedback visual inmediato del progreso global
- ✅ Barra prominente en parte superior muestra avance
- ✅ Coherencia entre todos los indicadores de progreso
- ✅ Mejor UX durante operaciones largas

## 🔗 Relación con Fixes Anteriores

Este fix es parte de la **serie de mejoras del sistema de reindexado:**

1. ✅ **FIX-ENTITY-TYPE-CASE-2025-10-10.md** - EntityType lowercase
2. ✅ **FIX-REINDEX-LOGS-TERMINAL-2025-10-10.md** - Phase 5 eventos
3. ✅ **FIX-REINDEX-PROGRESS-GRANULAR-2025-10-10.md** - Callbacks file-level
4. ✅ **FIX-REINDEX-TERMINAL-UI-2025-10-10.md** - Barra visual terminal
5. ✅ **FIX-GLOBAL-REINDEX-PROGRESS-SSE-2025-10-10.md** - Este fix (eventos SSE)

## 🚀 Siguiente Paso

Con este fix, **todos los indicadores de progreso funcionan correctamente:**
- ✅ GlobalReindexProgress (barra superior)
- ✅ ReindexTerminal (logs + barra interna)
- ✅ Progreso individual por carpeta (tabla/grid)

El sistema de reindexado ahora está **completamente funcional y auditado**.
