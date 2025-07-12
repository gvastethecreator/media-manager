# TODO: UPLOADED_IMAGES_001 - Análisis de Diferencias entre UploadedImage e Image

**CREATED:** 2025-01-12T15:30:00Z
**AGENT:** Claude Assistant
**STATUS:** COMPLETED
**PRIORITY:** MEDIUM
**COMPLEXITY:** MEDIUM

## DESCRIPCIÓN
Analizar y documentar las diferencias fundamentales entre las entidades `UploadedImage` e `Image` en el sistema, específicamente cómo `UploadedImage` almacena datos en la base de datos versus solo ubicaciones.

## SUBTASKS:
- [x] [CHECKPOINT_1] Investigar esquemas de base de datos de ambas entidades
- [x] [CHECKPOINT_2] Analizar diferencias en almacenamiento de datos
- [x] [CHECKPOINT_3] Documentar diferencias y casos de uso
- [x] [CHECKPOINT_4] Crear resumen técnico completo

## CONTEXT_REQUIRED:
- Files: 
  - d:\DEV\image-manager\src\lib\drizzle\schema.ts ✓
  - d:\DEV\image-manager\src\types\entities\uploaded-image\types.ts ✓
  - d:\DEV\image-manager\src\types\entities\image\base.ts ✓
- Dependencies: Drizzle ORM, SQLite
- Tools: search_codebase, view_files

## ACCEPTANCE_CRITERIA:
- [x] Diferencias estructurales claramente identificadas
- [x] Casos de uso específicos documentados
- [x] Flujo de datos explicado
- [x] Relaciones entre entidades mapeadas

## VALIDATION_CHECKPOINTS:
- [x] Pre-implementation validation - Esquemas analizados
- [x] Mid-implementation checkpoint - Diferencias identificadas
- [x] Post-implementation verification - Documentación completa
- [x] Final acceptance test - Resumen técnico validado

## RECOVERY_POINTS:
- Checkpoint 1: Esquemas de DB analizados ✓
- Checkpoint 2: Diferencias estructurales identificadas
- Checkpoint 3: Documentación técnica creada

## FINDINGS:

### DIFERENCIAS ESTRUCTURALES IDENTIFICADAS:

#### Tabla `Image` (Imágenes Principales):
- **Propósito**: Almacena imágenes procesadas y validadas del sistema
- **Campos clave**:
  - `thumbnail: text('thumbnail')` - **ALMACENA EL THUMBNAIL COMO BASE64 EN LA DB**
  - `thumbnailSize`, `thumbnailWidth`, `thumbnailHeight` - Metadatos del thumbnail
  - `thumbnailMimeType`, `thumbnailError`, `thumbnailErrorAt` - Control de errores
  - `width`, `height` - Dimensiones de la imagen original
  - `folderId` - Relación con carpeta contenedora
  - `noteId` - Relación opcional con notas

#### Tabla `UploadedImage` (Imágenes Temporales):
- **Propósito**: Almacena imágenes subidas temporalmente antes del procesamiento
- **Campos clave**:
  - `path: text('path')` - **SOLO ALMACENA LA RUTA DEL ARCHIVO**
  - `imageId: text('imageId')` - Referencia a la imagen procesada
  - `metadata: text('metadata')` - Metadatos en formato JSON
  - **NO tiene campos de thumbnail** - No almacena thumbnails en DB
  - **NO tiene dimensiones** - No almacena width/height

### DIFERENCIA PRINCIPAL:
- **Image**: Almacena el thumbnail como datos binarios (base64) directamente en la base de datos
- **UploadedImage**: Solo almacena la ruta del archivo, los datos están en el sistema de archivos

**COMPLETION_PERCENTAGE:** 100%
**LAST_UPDATED:** 2025-01-12T15:35:00Z
**NEXT_ACTION:** Tarea completada

### CASOS DE USO Y FLUJO DE DATOS:

#### Flujo de UploadedImage:
1. **Subida inicial**: Usuario sube imagen → Se crea registro en `UploadedImage`
2. **Almacenamiento temporal**: Archivo se guarda en sistema de archivos (`/uploads/`)
3. **Solo metadatos en DB**: `path`, `size`, `hash`, `metadata` (JSON)
4. **Procesamiento**: Sistema procesa la imagen y crea registro en `Image`
5. **Relación**: `UploadedImage.imageId` apunta a `Image.id`

#### Flujo de Image:
1. **Procesamiento**: Imagen es procesada desde `UploadedImage`
2. **Generación de thumbnail**: Se crea thumbnail y se convierte a base64
3. **Almacenamiento en DB**: Thumbnail base64 se guarda en `Image.thumbnail`
4. **Metadatos completos**: Dimensiones, tamaños, tipos MIME, etc.
5. **Integración**: Se asocia a carpetas, álbumes, colecciones, etc.

#### Ventajas de cada enfoque:

**UploadedImage (Solo rutas)**:
- ✅ Base de datos más liviana
- ✅ Archivos grandes no afectan performance de DB
- ✅ Fácil backup/restore de archivos
- ❌ Dependencia del sistema de archivos
- ❌ Posible desincronización archivo-DB

**Image (Thumbnails en DB)**:
- ✅ Thumbnails siempre disponibles
- ✅ Consistencia garantizada
- ✅ Mejor performance para thumbnails pequeños
- ❌ Base de datos más pesada
- ❌ Backups de DB más grandes

### RESUMEN TÉCNICO:

La diferencia fundamental es que **UploadedImage** es una entidad temporal que solo almacena metadatos y rutas de archivos, mientras que **Image** es la entidad permanente que almacena thumbnails como datos binarios (base64) directamente en la base de datos.

Esto permite un flujo de dos etapas:
1. **Subida rápida** → UploadedImage (solo metadatos)
2. **Procesamiento completo** → Image (con thumbnails embebidos)

## METRICS:
- Start Time: 2025-01-12T15:25:00Z
- Current Time: 2025-01-12T15:35:00Z
- Elapsed Time: 10 minutes
- Estimated Completion: 2025-01-12T15:35:00Z ✓
- Checkpoints Completed: 4/4 ✓
- Validation Failures: 0
- Recovery Attempts: 0