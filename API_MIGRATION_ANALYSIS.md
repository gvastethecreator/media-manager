# 🔄 Análisis de Migración API → Server Actions

## 📋 Estado Actual de Endpoints API

### 🎯 Criterios para Mantener API Routes

- **✅ Mantener**: Streaming de archivos, thumbnails, downloads
- **✅ Mantener**: Webhooks externos o integraciones públicas
- **✅ Mantener**: Control específico de headers/cache
- **❌ Migrar**: CRUD operations → Server Actions
- **❌ Migrar**: Lógica de negocio → Server Actions

### 📊 Análisis por Categoría

#### 🖼️ **IMÁGENES** - `/api/images/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `images/[id]/thumbnail` | ✅ **MANTENER** | N/A | Streaming de archivos binarios + headers cache |
| `images/[id]/metadata` | ❌ **MIGRAR** | → `getImageMetadata()` | Ya existe Server Action |
| `images/[id]/download` | ✅ **MANTENER** | N/A | Streaming de archivos + headers download |

#### 📂 **CARPETAS** - `/api/folders/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `folders/reindex/[id]` | ❌ **MIGRAR** | → `reindexFolder()` | Operación de negocio |
| `folders/[id]/stats` | ❌ **MIGRAR** | → `getFolderStats()` | Ya existe Server Action |

#### ⚙️ **SISTEMA** - `/api/system/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `system/settings` | ❌ **MIGRAR** | → `getSystemSettings()`, `updateSystemSettings()` | Ya existen Server Actions |
| `system/settings/reset` | ❌ **MIGRAR** | → `resetSystemSettings()` | Operación de negocio |

#### 👤 **PERFILES** - `/api/profiles/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `profiles` | ❌ **MIGRAR** | → `getProfiles()`, `createProfile()` | CRUD operations |
| `profiles/[id]` | ❌ **MIGRAR** | → `getProfile()`, `updateProfile()`, `deleteProfile()` | CRUD operations |
| `profiles/[id]/activate` | ❌ **MIGRAR** | → `activateProfile()` | Operación de negocio |
| `profiles/[id]/settings` | ❌ **MIGRAR** | → `getProfileSettings()`, `updateProfileSettings()` | Ya existen Server Actions |

#### 🎨 **PRESETS** - `/api/presets/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `presets/[id]` | ❌ **MIGRAR** | → `getPreset()`, `updatePreset()`, `deletePreset()` | CRUD operations |
| `presets/entity/[type]` | ❌ **MIGRAR** | → `getEntityPresets()` | Query operation |

#### 🖼️ **THUMBNAILS** - `/api/thumbnails/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `thumbnails/cleanup` | ❌ **MIGRAR** | → `cleanupThumbnails()` | Ya existe Server Action |
| `thumbnails/reprocess` | ❌ **MIGRAR** | → `reprocessThumbnails()` | Ya existe Server Action |
| `thumbnails/optimize` | ❌ **MIGRAR** | → `optimizeThumbnails()` | Operación de negocio |
| `thumbnails/events` | 🤔 **EVALUAR** | Webhook? | ¿Es para eventos externos? |

#### 📥 **DOWNLOAD** - `/api/download/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `download` | ✅ **MANTENER** | N/A | Streaming de archivos + headers download |

#### 🗂️ **CACHE** - `/api/cache/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `cache/clear` | ❌ **MIGRAR** | → `clearCache()` | Operación de sistema |

#### 🐛 **DEBUG** - `/api/debug/`

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `debug/app-stats` | 🤔 **EVALUAR** | Monitoring? | ¿Es para monitoreo externo? |
| `debug/system-stats` | 🤔 **EVALUAR** | Monitoring? | ¿Es para monitoreo externo? |

#### 🏗️ **OTROS**

| Endpoint | Estado | Acción | Razón |
|----------|--------|--------|-------|
| `entities/[entityType]/[entityId]/visual-config` | ✅ **ELIMINADO** | → Funcionalidad obsoleta | Eliminado completamente del proyecto |
| `logger-test` | ❌ **ELIMINAR** | N/A | Endpoint de testing |
| `init-server` | ❌ **MIGRAR** | → `initializeServer()` | Operación de inicialización |
| `local-files` | 🤔 **EVALUAR** | File system? | Depende del uso específico |

## 🎯 Plan de Acción

### Fase 1: Eliminar APIs Redundantes (Prioridad Alta)

```bash
# Endpoints que ya tienen Server Actions equivalentes
- /api/system/settings → getSystemSettings(), updateSystemSettings()
- /api/folders/reindex → reindexFolder()
- /api/thumbnails/cleanup → cleanupThumbnails()
- /api/thumbnails/reprocess → reprocessThumbnails()
- /api/profiles → profile.actions.ts
```

### Fase 2: Migrar CRUD Operations (Prioridad Media)

```bash
# Endpoints que son operaciones CRUD puras
- /api/presets/* → presets.actions.ts
- /api/cache/clear → cache.actions.ts
- /api/profiles/[id]/activate → activateProfile()
```

### Fase 3: Evaluar Casos Especiales (Prioridad Baja)

```bash
# Endpoints que necesitan evaluación individual
- /api/debug/* (¿monitoreo externo?)
- /api/thumbnails/events (¿webhook?)
- /api/local-files (¿acceso filesystem?)
```

### ✅ Mantener Definitivamente

```bash
# Endpoints que DEBEN mantenerse como API Routes
- /api/images/[id]/thumbnail (streaming binarios)
- /api/download (streaming archivos)
- /api/images/[id]/download (streaming archivos)
```

## 📝 Próximos Pasos

1. **Verificar Server Actions existentes** para cada endpoint marcado para migrar
2. **Actualizar llamadas en componentes** de API Routes → Server Actions
3. **Eliminar API Routes redundantes** progresivamente
4. **Actualizar documentación** y examples

## 🔍 Comandos de Verificación

```bash
# Buscar usos de endpoints API en el código
grep -r "/api/system/settings" src/
grep -r "/api/folders/reindex" src/
grep -r "/api/thumbnails/cleanup" src/
```

## 🗑️ Funcionalidades Eliminadas Completamente

### Visual Config (ELIMINADO)

- **Descripción**: Sistema de configuración visual obsoleto para entidades
- **Motivo**: Funcionalidad no utilizada y reemplazada por stores locales
- **Eliminado**:
  - Todas las rutas API de visual-config
  - Server Actions relacionadas con visual-config
  - Referencias en stores, transformers y componentes
  - Tipos TypeScript de visual-config en todas las entidades
  - Componentes de configuración de visual-config

- **Impacto**: Ninguno, ya que era funcionalidad legacy no utilizada
- **Estado**: ✅ Eliminación completa finalizada
