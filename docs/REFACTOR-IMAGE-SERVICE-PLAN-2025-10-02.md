# Refactor de Image Service - Plan de Ejecución
**Fecha:** 2 de octubre de 2025  
**Archivo:** `src/services/image/image.service.ts` (1,067 líneas)

## 📊 Análisis de Estructura

### Componentes Identificados

1. **Utilidades Generales** (~30 líneas)
   - `randomId()` - Generación de UUIDs
   - Constantes: `SERVICE_NAME`, `MAX_THUMBNAIL_SIZE_BYTES`
   - Logger contextual

2. **Sistema de Eventos** (~50 líneas)
   - `IMAGE_EVENTS` - Constantes de eventos
   - `EVENT_TYPE_MAPPING` - Mapeo a EventType
   - `emitEvent()` - Emisor de eventos privado

3. **Procesamiento con Sharp** (~150 líneas)
   - `processImage()` - Pipeline principal
   - `applyResize()` - Redimensionamiento con aspect ratio
   - `applyFormat()` - Conversión webp/jpeg/png
   - `THUMBNAIL_QUALITY_CONFIG` - Configuración de calidad

4. **CRUD Base** (~370 líneas)
   - `createImage()` - Crear con validación de duplicados
   - `getImage()` - Obtener una imagen
   - `updateImage()` - Actualizar imagen
   - `deleteImage()` - Eliminar imagen
   - `getImages()` - Listar con paginación/filtros/ordenación
   - `getImageByHash()` - Buscar por hash
   - `getImageByPathAndFolder()` - Buscar por path+folder

5. **Gestión de Thumbnails** (~270 líneas)
   - `generateThumbnail()` - Generar con recompresión automática
   - `generateThumbnailSafe()` - Wrapper tolerante a errores
   - `getThumbnail()` - Obtener buffer (genera si no existe)
   - `getOriginalImage()` - Obtener imagen original
   - `getThumbnailProcessingStats()` - Estadísticas

6. **Gestión de Caché** (~20 líneas)
   - `ensureCacheDir()` - Crear directorio `.image-cache`
   - `CACHE_DIR` - Constante de directorio

## ✅ Módulos Creados

### 1. `image-utils.ts` (47 líneas)
**Contenido:**
- `randomId()` - Generación de UUIDs compatible con Web Crypto
- `SERVICE_NAME` - Constante del servicio
- `MAX_THUMBNAIL_SIZE_BYTES` - Límite de tamaño (300KB)

**Exports:**
```typescript
export const randomId: () => string
export const SERVICE_NAME = 'ImageService'
export const MAX_THUMBNAIL_SIZE_BYTES = 300 * 1024
```

### 2. `image-events.ts` (59 líneas)
**Contenido:**
- `IMAGE_EVENTS` - Constantes de eventos (7 eventos)
- `EVENT_TYPE_MAPPING` - Mapeo a tipos del sistema
- `emitImageEvent()` - Emisor público de eventos

**Exports:**
```typescript
export const IMAGE_EVENTS: Record<string, string>
export async function emitImageEvent(event: string, data: unknown): Promise<void>
```

### 3. `image-processing.ts` (127 líneas)
**Contenido:**
- `ImageProcessingOptions` - Tipo de opciones
- `ProcessedImage` - Tipo de resultado
- `processImage()` - Pipeline principal de procesamiento
- `applyResize()` - Redimensionamiento privado
- `applyFormat()` - Conversión de formato privada
- `THUMBNAIL_QUALITY_CONFIG` - Re-export de config

**Exports:**
```typescript
export type ImageProcessingOptions
export type ProcessedImage
export const THUMBNAIL_QUALITY_CONFIG
export async function processImage(
  inputPath: string, 
  options?: ImageProcessingOptions
): Promise<ProcessedImage>
```

## 📋 Próximos Pasos

### Pendiente: image-thumbnail.service.ts (~300 líneas estimadas)
**Contenido a extraer:**
- Clase `ThumbnailService` con singleton pattern
- `generateThumbnail()` - Lógica completa con:
  - Verificación de existencia de archivo
  - Procesamiento con Sharp
  - Recompresión automática si excede 300KB
  - Persistencia en DB (base64)
  - Logging de métricas (memoria, duración)
  - Manejo de errores con registro en BD
- `generateThumbnailSafe()` - Wrapper no-throw
- `getThumbnail()` - Obtener con generación on-demand
- `getOriginalImage()` - Leer archivo original
- `getThumbnailProcessingStats()` - Estadísticas agregadas

**Dependencias:**
- `image-processing` - Para `processImage()`
- `image-events` - Para `emitImageEvent()`
- `image-utils` - Para constantes
- DB de Drizzle
- Sharp para validación
- FS para lectura de archivos

### Pendiente: Refactorizar image.service.ts principal
**Cambios necesarios:**
1. Importar módulos:
   ```typescript
   import { randomId, SERVICE_NAME, MAX_THUMBNAIL_SIZE_BYTES } from './image-utils';
   import { IMAGE_EVENTS, emitImageEvent } from './image-events';
   import { processImage, type ImageProcessingOptions, THUMBNAIL_QUALITY_CONFIG } from './image-processing';
   import { thumbnailService } from './image-thumbnail.service'; // cuando se cree
   ```

2. Eliminar código duplicado:
   - Líneas 90-120: `randomId`, constantes
   - Líneas 143-168: Eventos y mapeo
   - Líneas 207-260: Procesamiento con Sharp
   - Líneas 631-895: Thumbnails (delegar a `thumbnailService`)

3. Actualizar método `emitEvent()`:
   ```typescript
   private async emitEvent(event: string, data: unknown): Promise<void> {
     await emitImageEvent(event, data);
   }
   ```

4. Actualizar llamadas a `processImage()`:
   ```typescript
   // Antes: this.processImage(path, options)
   // Después: processImage(path, options)
   ```

5. Delegar thumbnails:
   ```typescript
   async generateThumbnail(imageId: string): Promise<void> {
     return thumbnailService.generateThumbnail(imageId);
   }
   // Similar para getThumbnail, getOriginalImage, etc.
   ```

## 📈 Beneficios Esperados

- **Reducción de tamaño:** 1,067 → ~600 líneas (44% reducción)
- **Modularidad:** 4 módulos independientes
- **Mantenibilidad:** Separación clara de responsabilidades
- **Testabilidad:** Funciones puras fáciles de testear
- **Reutilización:** Procesamiento de imágenes disponible para otros servicios

## ⚠️ Estado Actual

**Completado:**
- ✅ Análisis de estructura
- ✅ `image-utils.ts`
- ✅ `image-events.ts`
- ✅ `image-processing.ts`

**Pendiente:**
- ⏳ `image-thumbnail.service.ts` (requiere ~300 líneas)
- ⏳ Refactorización de `image.service.ts` principal
- ⏳ Validación con TypeScript
- ⏳ Validación con Biome
- ⏳ Tests de integración

## 🎯 Siguiente Acción Recomendada

Crear `image-thumbnail.service.ts` con la lógica extraída de thumbnails, siguiendo el patrón establecido en los módulos anteriores.
