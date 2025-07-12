# TODO: Sincronización Automática de Carpetas Durante el Indexado

## 📋 Descripción
Implementar funcionalidad para que durante el proceso de indexado se sincronicen automáticamente las carpetas:
- **Eliminar** carpetas de la base de datos que ya no existen en el sistema de archivos
- **Agregar** nuevas carpetas encontradas en el sistema de archivos que no están en la base de datos
- **Actualizar** rutas de carpetas que hayan cambiado

## 🎯 Objetivos
- [x] Analizar el código actual de indexado (`folder-stats.ts`, `folder-scanner.ts`, `folders.ts`)
- [x] Implementar función de sincronización de carpetas
- [x] Integrar la sincronización en los endpoints de reindexado
- [x] Agregar logging detallado del proceso de sincronización
- [x] Manejar casos edge (carpetas movidas, renombradas, etc.)
- [ ] Actualizar la UI para mostrar el progreso de sincronización

## 🔧 Implementación

### 1. Nueva función de sincronización
**Archivo:** `src/lib/filesystem/folder-sync.ts` (nuevo)

```typescript
export interface FolderSyncResult {
  added: string[];      // IDs de carpetas agregadas
  removed: string[];    // IDs de carpetas eliminadas
  updated: string[];    // IDs de carpetas actualizadas
  errors: string[];     // Errores durante la sincronización
}

export async function syncFoldersWithFileSystem(): Promise<FolderSyncResult>
```

### 2. Modificaciones en `folder-stats.ts`
- Agregar llamada a `syncFoldersWithFileSystem()` al inicio de `updateFolderStats()`
- Agregar parámetro opcional para habilitar/deshabilitar sincronización

### 3. Modificaciones en endpoints de reindexado
**Archivo:** `src/server/routes/folders.ts`
- Endpoint `POST /api/folders/:id/reindex`: Agregar sincronización antes del reindexado
- Endpoint `POST /api/folders/reindex-all`: Agregar sincronización global
- Nuevo endpoint `POST /api/folders/sync`: Solo sincronización sin reindexado

### 4. Actualización de la UI
**Archivos a modificar:**
- `src/components/settings/folders/folders-settings.tsx`
- `src/hooks/use-folders-operations.ts`

## 📝 Detalles de Implementación

### Algoritmo de Sincronización

1. **Obtener carpetas de la BD:**
   ```sql
   SELECT id, path, name FROM folders
   ```

2. **Escanear sistema de archivos:**
   - Usar `scanFolder()` recursivamente desde carpetas raíz
   - Obtener todas las rutas de directorios existentes

3. **Comparar y sincronizar:**
   - **Carpetas a eliminar:** En BD pero no en sistema de archivos
   - **Carpetas a agregar:** En sistema de archivos pero no en BD
   - **Carpetas a actualizar:** Rutas que cambiaron

### Casos Edge a Manejar

1. **Carpeta movida/renombrada:**
   - Detectar por contenido similar
   - Actualizar ruta en lugar de eliminar/crear

2. **Carpetas con subcarpetas:**
   - Eliminar en cascada (subcarpetas primero)
   - Crear jerarquía completa para nuevas carpetas

3. **Permisos de acceso:**
   - Manejar carpetas inaccesibles
   - Logging de errores sin interrumpir el proceso

4. **Carpetas temporales:**
   - Filtrar carpetas del sistema (.git, node_modules, etc.)
   - Configuración de patrones a ignorar

## 🔍 Validación

### Criterios de Aceptación
- [ ] Las carpetas eliminadas del sistema de archivos se eliminan de la BD
- [ ] Las nuevas carpetas se agregan automáticamente a la BD
- [ ] Las carpetas movidas se actualizan correctamente
- [ ] El proceso no interrumpe el indexado normal
- [ ] Se mantiene la integridad referencial (imágenes, entidades)
- [ ] La UI muestra el progreso de sincronización
- [ ] Los logs proporcionan información detallada del proceso

### Puntos de Validación
1. **Funcionalidad básica:**
   - Crear carpeta en sistema → Aparece en BD después del indexado
   - Eliminar carpeta del sistema → Se elimina de BD después del indexado
   - Mover carpeta → Ruta se actualiza en BD

2. **Casos complejos:**
   - Múltiples carpetas eliminadas/agregadas simultáneamente
   - Carpetas con muchas subcarpetas
   - Carpetas con miles de archivos

3. **Rendimiento:**
   - Tiempo de sincronización aceptable (<30s para 1000 carpetas)
   - Uso de memoria controlado
   - No bloqueo de la UI

## 🚨 Consideraciones de Seguridad

- **Validación de rutas:** Prevenir path traversal
- **Permisos:** Verificar acceso antes de operaciones
- **Transacciones:** Usar transacciones de BD para operaciones críticas
- **Backup:** Considerar backup antes de eliminaciones masivas

## 📊 Métricas y Logging

### Logs a Implementar
```typescript
// Inicio de sincronización
logger.info('🔄 Iniciando sincronización de carpetas');

// Resultados de sincronización
logger.info('✅ Sincronización completada', {
  added: result.added.length,
  removed: result.removed.length,
  updated: result.updated.length,
  errors: result.errors.length,
  duration: `${duration}ms`
});

// Errores específicos
logger.error('❌ Error sincronizando carpeta', {
  path: folderPath,
  error: error.message
});
```

### Métricas a Trackear
- Tiempo de sincronización
- Número de carpetas procesadas
- Tasa de errores
- Frecuencia de uso

## 🔄 Integración con Sistema Existente

### Hooks Existentes a Actualizar
- `useFoldersOperations`: Agregar función de sincronización
- `useFoldersEvents`: Manejar eventos de sincronización
- `useAutoFolderIndexing`: Integrar sincronización automática

### Servicios a Modificar
- `FolderService`: Agregar métodos de sincronización
- `FileEntityMapperService`: Manejar entidades de carpetas eliminadas

## 📅 Plan de Implementación

### Fase 1: Funcionalidad Core ✅ COMPLETADA
- [x] Crear `folder-sync.ts` con lógica de sincronización
- [x] Implementar detección de carpetas agregadas/eliminadas
- [ ] Agregar tests unitarios básicos

### Fase 2: Integración con Indexado ✅ COMPLETADA
- [x] Modificar `updateFolderStats()` para incluir sincronización
- [x] Actualizar endpoints de reindexado
- [x] Agregar logging detallado
- [x] Agregar nuevos endpoints `/sync` y `/sync/status`

### Fase 3: UI y UX (Estimado: 1-2 días)
- [ ] Actualizar componentes de carpetas
- [ ] Agregar indicadores de progreso
- [ ] Manejar estados de loading/error

### Fase 4: Testing y Optimización (Estimado: 1 día)
- [ ] Tests de integración
- [ ] Optimización de rendimiento
- [ ] Documentación

## 🎯 Estado Actual
**Estado:** 🚧 En Desarrollo (Backend Completado)  
**Prioridad:** Alta  
**Asignado:** Pendiente  
**Fecha creación:** $(date)  
**Última actualización:** $(date)

## ✅ Funcionalidades Implementadas

### Backend Completado
1. **Archivo `folder-sync.ts`**: Lógica completa de sincronización
   - Detección de carpetas eliminadas del sistema de archivos
   - Detección de carpetas nuevas en el sistema de archivos
   - Manejo de errores y logging detallado
   - Soporte para dry-run y configuraciones avanzadas

2. **Integración en `folder-stats.ts`**: 
   - Sincronización automática antes del indexado
   - Parámetro `enableSync` para controlar la funcionalidad
   - Resultados de sincronización incluidos en respuesta

3. **Endpoints de API actualizados**:
   - `POST /api/folders/:id/reindex` - Reindexado con sincronización
   - `POST /api/folders/reindex-all` - Reindexado global con sincronización
   - `POST /api/folders/sync` - Solo sincronización (nuevo)
   - `GET /api/folders/sync/status` - Verificar estado sin cambios (nuevo)

### Características Implementadas
- ✅ Eliminación automática de carpetas inexistentes
- ✅ Adición automática de carpetas nuevas
- ✅ Logging detallado con emojis y métricas
- ✅ Manejo de errores robusto
- ✅ Soporte para dry-run
- ✅ Filtrado de carpetas del sistema (.git, node_modules, etc.)
- ✅ Procesamiento jerárquico (padres antes que hijos)
- ✅ Integración transparente con el sistema existente  

## 📚 Referencias
- Código actual de indexado: `src/lib/filesystem/folder-stats.ts`
- Scanner de carpetas: `src/lib/filesystem/folder-scanner.ts`
- Rutas de API: `src/server/routes/folders.ts`
- Componentes UI: `src/components/settings/folders/`