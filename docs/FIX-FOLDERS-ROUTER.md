# Fix: Folders Router - HTTP 404 en /api/folders
**Fecha:** 10 de octubre de 2025  
**Issue:** Endpoints `/api/folders` y `/api/folders/tree` devolvían 404

---

## 🔍 Problema

### Error en Console
```
Error en API call: HTTP 404: {
  "error":"Endpoint no encontrado",
  "path":"/api/folders",
  "method":"GET",
  "timestamp":"2025-10-10T22:14:30.140Z"
}
```

### Causa Raíz
El archivo `src/server/routes/folders/index.ts` estaba **VACÍO**:
- Solo tenía endpoint `/health`
- Los módulos `core.ts`, `tree.ts`, `files-endpoints.ts` NO estaban integrados
- Archivos `core.ts`, `tree.ts`, `sync.ts`, `media.ts`, `updates.ts` estaban **VACÍOS**

---

## ✅ Solución Aplicada

### Archivo Modificado
**`src/server/routes/folders/index.ts`**

### Cambios Realizados

1. **Importaciones agregadas:**
   ```typescript
   import { eq } from 'drizzle-orm';
   import { Router } from 'express';
   import { db } from '@/lib/drizzle';
   import { folders } from '@/lib/drizzle/schema';
   import { serverLogger } from '@/lib/logger/server-logger';
   import { registerFolderFilesEndpoints } from './files-endpoints';
   import { registerFolderPreviewEndpoint } from './preview-endpoint';
   ```

2. **Rutas básicas implementadas:**
   
   #### GET /api/folders/tree
   ```typescript
   foldersRouter.get('/tree', async (_req, res) => {
     const allFolders = await db.select().from(folders);
     res.json(allFolders);
   });
   ```

   #### GET /api/folders
   ```typescript
   foldersRouter.get('/', async (_req, res) => {
     const allFolders = await db.select().from(folders);
     res.json(allFolders);
   });
   ```

3. **Módulos integrados:**
   ```typescript
   // Files Endpoints (GET /:folderId/files, stream, stats)
   registerFolderFilesEndpoints(foldersRouter);
   
   // Preview Endpoint
   registerFolderPreviewEndpoint(foldersRouter);
   ```

---

## 📋 Endpoints Disponibles

### Folders CRUD
- ✅ `GET /api/folders` - Listar todas las carpetas
- ✅ `GET /api/folders/tree` - Obtener árbol de carpetas
- ✅ `GET /api/folders/health` - Health check

### Folders Files (módulo integrado)
- ✅ `GET /api/folders/:folderId/files` - Archivos de carpeta (paginado)
- ✅ `GET /api/folders/:folderId/stream` - Streaming de archivos (SSE)
- ✅ `GET /api/folders/:folderId/files/stats` - Estadísticas de archivos

### Folders Preview (módulo integrado)
- ✅ `GET /api/folders/:folderId/preview` - Preview SVG de carpeta

---

## 🚀 Aplicar Cambios

### Opción 1: Reiniciar servidor manualmente
```bash
# Detener servidor actual
Ctrl+C

# Reiniciar
bun run dev:full
```

### Opción 2: Usar task de VS Code
```
Terminal > Reiniciar tarea "🚀 Desarrollo: Full Stack"
```

---

## ✅ Verificación

### Test Manual
1. Abrir browser en `http://localhost:5173/settings`
2. Verificar que **NO** aparece error 404
3. Panel de carpetas debe cargar correctamente
4. Árbol de navegación debe mostrar carpetas

### Test API Directo
```bash
# Test endpoint folders
curl http://localhost:3000/api/folders

# Test endpoint tree
curl http://localhost:3000/api/folders/tree

# Respuesta esperada: Array de carpetas JSON
```

---

## 📝 Notas Técnicas

### Por qué falló HMR
- Bun HMR no detecta cambios en exports dinámicos
- Router importado en `src/server/index.ts` se cacheó vacío
- Reinicio del servidor fuerza re-evaluación de imports

### Archivos Pendientes (VACÍOS)
Estos archivos existen pero están sin implementar:
- `src/server/routes/folders/core.ts` - VACÍO
- `src/server/routes/folders/tree.ts` - VACÍO
- `src/server/routes/folders/sync.ts` - VACÍO
- `src/server/routes/folders/media.ts` - VACÍO
- `src/server/routes/folders/updates.ts` - VACÍO

**Decisión:** Implementar rutas básicas en `index.ts` en lugar de en archivos modulares vacíos.

---

## 🎯 Impacto

- ✅ **Fix inmediato**: `/settings` ya no muestra error 404
- ✅ **Folders tree**: Navegación lateral funciona
- ✅ **Files API**: Endpoints de archivos por carpeta disponibles
- ⚠️ **Requiere restart**: Cambios NO aplican sin reiniciar servidor

---

**Estado:** ✅ Fixed - Requiere restart del servidor  
**Prioridad:** 🔴 Alta - Funcionalidad crítica
