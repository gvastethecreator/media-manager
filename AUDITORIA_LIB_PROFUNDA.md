# AUDITORÍA PROFUNDA DE LA CARPETA @/lib

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. FUNCIONES DE FORMATEO MASIVAMENTE DUPLICADAS

**Archivo Principal:** `src/lib/utils/format.utils.ts` ✅

**Archivos con Duplicaciones (ELIMINAR/MIGRAR):**

- `src/utils/file/helpers.ts` - `formatBytes()`
- `src/utils/image/helpers.ts` - `formatImageSize()`
- `src/utils/image-utils.ts` - `formatFileSize()`
- `src/utils/file/format-file-size.ts` - `formatFileSize()`
- `src/transformers/video/transformer.ts` - función local `formatFileSize()`
- `src/transformers/folder/transformer.ts` - función local `formatFileSize()`
- `src/transformers/image/transformer.ts` - función local `formatFileSize()`
- `src/transformers/file/serializers.ts` - `formatFileSize()`
- `src/transformers/metadata/mappers.ts` - `formatBytes()`
- `src/hooks/use-entity-conversion.ts` - función local `formatFileSize()`
- `src/components/settings/folders/hooks/use-folders-state.ts` - función local `formatBytes()`
- `src/app/api/debug/system-stats/route.ts` - función local `formatBytes()`
- `src/lib/server/system-monitor.ts` - función local temporal `formatBytes()`

### 2. ARCHIVOS ENTITY-UTILS DUPLICADOS/CONFUSOS

**Problema:** Dos archivos con nombres similares pero propósitos diferentes:

- `src/lib/entity-utils.ts` - Verificación de entidades cargadas en stores
- `src/lib/utils/entity.utils.ts` - Transformaciones y estadísticas de entidades

**Solución:** Renombrar para claridad:

- `src/lib/entity-utils.ts` → `src/lib/utils/entity-loading.utils.ts`
- Mantener `src/lib/utils/entity.utils.ts` como está

### 3. TIPOS DUPLICADOS EN LIB/TYPES.TS

**Problema:** `src/lib/types.ts` define tipos que ya existen en `src/types/entities/*/`:

- `Collection` (existe en `src/types/entities/collection/`)
- `Folder` (existe en `src/types/entities/folder/`)
- `Tag` (existe en `src/types/entities/tag/`)
- `Settings` (existe en `src/types/entities/settings/`)

**Solución:** Eliminar tipos duplicados de `src/lib/types.ts` y usar importaciones desde `src/types/entities/`

### 4. HOOKS DISPERSOS EN MÚLTIPLES UBICACIONES

**Problema:** Hooks distribuidos inconsistentemente:

- `src/hooks/` - Hooks de entidades y utilidades generales (17 archivos)
- `src/lib/hooks/` - Hooks de sistema y UI (15 archivos)
- **DUPLICADOS CRÍTICOS:**
  - `use-settings.ts` (existe en ambas ubicaciones)
  - `use-mobile.ts/.tsx` (existe en ambas ubicaciones)

**Solución:** Consolidar TODO en `src/lib/hooks/` con estructura organizada:

```
src/lib/hooks/
├── entities/     # Mover desde src/hooks/entities/
├── system/       # use-stats, use-navigation, use-console-capture
├── ui/           # use-toast, use-selection, use-glow-effect
├── files/        # use-file-*, use-folder-images
├── utils/        # use-local-storage, use-window-size, use-mobile (consolidado)
└── index.ts
```

### 5. ARCHIVOS SUELTOS EN SRC/LIB/ (REORGANIZAR)

**Archivos que deberían moverse a subcarpetas:**

- `src/lib/cache.ts` → `src/lib/cache/cache.ts`
- `src/lib/db-utils.ts` → `src/lib/db/db-utils.ts` (ya existe `src/lib/db.ts`)
- `src/lib/event-throttler.ts` → `src/lib/events/throttler.ts`
- `src/lib/folder-*.ts` → `src/lib/folder/` (crear carpeta)
- `src/lib/image-*.ts` → `src/lib/image/` (crear carpeta)
- `src/lib/path-utils.ts` → `src/lib/utils/path.utils.ts`
- `src/lib/url-utils.ts` → `src/lib/utils/url.utils.ts`
- `src/lib/validations.ts` → revisar si duplica `src/types/validations/`

### 6. IMPORTS ROTOS DESPUÉS DE LIMPIEZA

**Archivos que necesitan actualización de imports:**

- Todos los archivos que importan funciones de formateo duplicadas
- Componentes que usan tipos de `src/lib/types.ts`
- Archivos que referencian rutas que cambiarán

## 📋 PLAN DE EJECUCIÓN

### FASE 1: ELIMINAR FUNCIONES DE FORMATEO DUPLICADAS

1. Identificar todos los archivos que usan funciones duplicadas
2. Actualizar imports para usar `@/lib/utils/format.utils`
3. Eliminar funciones locales/duplicadas
4. Verificar que no se rompa nada

### FASE 2: REORGANIZAR ARCHIVOS ENTITY-UTILS

1. Renombrar `src/lib/entity-utils.ts` → `src/lib/utils/entity-loading.utils.ts`
2. Actualizar imports en archivos que lo usan
3. Actualizar `src/lib/utils/index.ts`

### FASE 3: LIMPIAR TIPOS DUPLICADOS

1. Identificar qué tipos de `src/lib/types.ts` están duplicados
2. Actualizar imports para usar tipos canónicos de `src/types/entities/`
3. Eliminar tipos duplicados de `src/lib/types.ts`
4. Si queda vacío, eliminar el archivo

### FASE 4: CONSOLIDAR HOOKS

1. Crear estructura organizada en `src/lib/hooks/`
2. Mover hooks desde `src/hooks/` a `src/lib/hooks/`
3. Resolver duplicados (`use-settings.ts`, `use-mobile.ts`)
4. Actualizar imports de hooks en toda la aplicación
5. Eliminar carpeta `src/hooks/` vacía

### FASE 5: REORGANIZAR ARCHIVOS SUELTOS

1. Crear carpetas necesarias (`src/lib/folder/`, `src/lib/image/`)
2. Mover archivos a sus ubicaciones lógicas
3. Actualizar imports en toda la aplicación
4. Actualizar archivos `index.ts`

### FASE 6: VERIFICACIÓN Y LIMPIEZA FINAL

1. Ejecutar TypeScript check
2. Ejecutar linting
3. Verificar que no hay imports rotos
4. Ejecutar tests si existen
5. Documentar cambios

## 🎯 RESULTADO ESPERADO

**Antes:**

- 50+ archivos con funciones duplicadas
- Hooks dispersos en múltiples ubicaciones
- Estructura incoherente
- Tipos duplicados
- Archivos mal organizados

**Después:**

- Funciones de formateo centralizadas en un solo lugar
- Todos los hooks organizados en `src/lib/hooks/` con estructura lógica
- Estructura clara y lógica
- Sin duplicaciones de tipos
- Organización coherente por funcionalidad
- Imports limpios y consistentes

## ⚠️ RIESGOS Y MITIGACIONES

**Riesgo:** Romper funcionalidad existente
**Mitigación:** Actualizar imports progresivamente y verificar en cada paso

**Riesgo:** Conflictos de merge
**Mitigación:** Hacer commits pequeños y atómicos

**Riesgo:** Perder funcionalidad específica
**Mitigación:** Revisar cada función antes de eliminar para asegurar equivalencia
