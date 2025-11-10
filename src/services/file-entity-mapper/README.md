# File Entity Mapper Service

Servicio modular responsable de mapear archivos físicos a entidades de base de datos en 3 etapas optimizadas.

## 📁 Estructura

```
src/services/file-entity-mapper/
├── file-entity-mapper.service.ts        # API pública (wrapper legacy)
├── core.service.ts                      # Orquestador principal
├── index.ts                             # Barrel exports
│
├── processors/                          # Procesadores especializados
│   ├── image.processor.ts              # Imágenes (EXIF/IPTC/XMP/AI)
│   ├── video.processor.ts              # Videos (ffprobe + WebP animado)
│   ├── audio.processor.ts              # Audio (ID3 tags + waveform)
│   ├── document.processor.ts           # Documentos (PDF/MD/TXT)
│   ├── file3d.processor.ts             # Modelos 3D (GLTF/GLB/OBJ)
│   └── json.processor.ts               # Archivos JSON (validación)
│
└── utils/                               # Utilidades compartidas
    ├── hash.utils.ts                   # SHA-256 + LRU cache
    ├── metrics.utils.ts                # Performance tracking
    └── file-info.utils.ts              # Type/MIME mapping
```

## 🚀 Uso Básico

### API Legacy (mantiene compatibilidad)

```typescript
import { FileEntityMapperService } from '@/services/file-entity-mapper';

const mapper = FileEntityMapperService.getInstance();

// Procesar un archivo
const result = await mapper.createEntityFromFile('/path/to/image.jpg', 'folder-id');
console.log(result); // { success: true, entityType: 'image', entityId: 'uuid' }

// Procesar múltiples archivos
const stats = await mapper.processFiles([
  '/path/to/image1.jpg',
  '/path/to/video.mp4',
  '/path/to/document.pdf'
], 'folder-id');
console.log(stats); // { totalFiles: 3, successful: 3, failed: 0, ... }
```

### Nueva API (recomendada para código nuevo)

```typescript
import { FileEntityMapperCore } from '@/services/file-entity-mapper';

const core = FileEntityMapperCore.getInstance();

// Mismo API, arquitectura moderna
await core.createEntityFromFile(filePath, folderId);
await core.processFiles(filePaths, folderId);
```

### Uso Avanzado (procesadores individuales)

```typescript
import { ImageProcessor } from '@/services/file-entity-mapper';

const processor = new ImageProcessor();

// Verificar si existe
const exists = await processor.checkExists(hash);

// Crear entidad básica
const entityId = await processor.createBasicEntity(fileInfo);

// Extraer metadata
await processor.extractMetadata(filePath, entityId);

// Generar thumbnail
await processor.generateThumbnail(filePath, entityId);
```

## 📊 Flujo de Procesamiento

### 3 Etapas Optimizadas

```
┌─────────────────────────────────────────────────────────┐
│  ETAPA 1: Creación Básica                               │
│  - Pre-check rápido (stat + extensión)                  │
│  - Validación de tamaño (skip antes de hash)            │
│  - Cálculo de hash SHA-256 (con caché LRU)              │
│  - Verificación de duplicados                           │
│  - Creación básica en BD (sin metadata)                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  ETAPA 2: Extracción de Metadata                        │
│  - Dispatch al procesador especializado                 │
│  - Image: EXIF/IPTC/XMP/AI metadata                     │
│  - Video: ffprobe (duración, resolución, codec)         │
│  - Audio: ID3 tags (título, artista, álbum)            │
│  - Document: páginas, palabras, frontmatter             │
│  - 3D: parse de vértices, caras, materiales            │
│  - JSON: validación, profundidad, tipo                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  ETAPA 3: Generación de Thumbnail                       │
│  - Image: JPEG 320px (base64 en metadata)              │
│  - Video: WebP animado 12 frames (columna dedicada)    │
│  - Audio: SVG waveform                                  │
│  - Document: SVG preview                                │
│  - 3D: SVG placeholder                                  │
│  - JSON: SVG content preview                            │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Características Principales

### ✅ Performance Optimizado
- **Skip temprano**: Validación de tamaño ANTES de hash costoso
- **Caché LRU**: Hash reutilizado si mtime/size no cambian
- **Cola de concurrencia**: Procesamiento paralelo (4 workers por defecto)
- **Serialización básica**: Orden determinista en tests

### ✅ Modularidad
- **Procesadores especializados**: Un procesador por tipo de media
- **Single Responsibility**: Cada módulo tiene una responsabilidad clara
- **Fácil extensión**: Agregar nuevo tipo = nuevo procesador

### ✅ Observabilidad
- **Métricas granulares**: Por fase y por tipo de entidad
- **Logs en JSONL**: `logs/metrics-media.jsonl`
- **Tracking de errores**: Errores detallados por archivo

### ✅ Compatibilidad
- **API legacy preservada**: Zero breaking changes
- **Migración gradual**: Código existente funciona sin cambios
- **Nueva API disponible**: Para código nuevo

## 📚 Tipos de Entidades Soportados

| Tipo | Extensiones | Procesador |
|------|------------|------------|
| **Image** | .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg | ImageProcessor |
| **Video** | .mp4, .avi, .mov, .mkv, .webm, .flv | VideoProcessor |
| **Audio** | .mp3, .wav, .ogg, .m4a, .flac, .aac | AudioProcessor |
| **Document** | .pdf, .doc, .docx, .txt, .md, .rtf | DocumentProcessor |
| **3D Model** | .gltf, .glb, .obj, .stl | File3DProcessor |
| **JSON** | .json | JsonProcessor |

## 🛠️ Utilidades

### Hash Utils
```typescript
import { calculateFileHash, clearHashCache } from '@/services/file-entity-mapper';

const hash = await calculateFileHash('/path/to/file');
clearHashCache(); // Para tests
```

### File Info Utils
```typescript
import { getEntityTypeFromExtension, getMimeTypeFromExtension } from '@/services/file-entity-mapper';

const type = getEntityTypeFromExtension('.jpg'); // 'image'
const mime = getMimeTypeFromExtension('.jpg'); // 'image/jpeg'
```

### Metrics Collector
```typescript
import { MetricsCollector } from '@/services/file-entity-mapper';

const metrics = new MetricsCollector();
const t0 = Date.now();
// ... operación ...
metrics.recordPhase('operation', t0);
await metrics.flushMetrics(); // Escribe a logs/metrics-media.jsonl
```

## 🧪 Testing

### Mock de Procesadores
```typescript
import { vi } from 'vitest';
import type { ImageProcessor } from '@/services/file-entity-mapper';

const mockProcessor = {
  checkExists: vi.fn().mockResolvedValue(false),
  createBasicEntity: vi.fn().mockResolvedValue('entity-id'),
  extractMetadata: vi.fn().mockResolvedValue({ success: true }),
  generateThumbnail: vi.fn().mockResolvedValue({ success: true })
};
```

### Test de Utilidades
```typescript
import { describe, it, expect } from 'vitest';
import { calculateFileHash } from '@/services/file-entity-mapper';

describe('Hash Utils', () => {
  it('should calculate SHA-256 hash', async () => {
    const hash = await calculateFileHash('/path/to/test.jpg');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

## 📈 Métricas y Logging

### Formato de Métricas
```json
{
  "ts": "2025-10-02T02:30:00.000Z",
  "phases": {
    "basic": [120, 95, 110],
    "metadata_image": [450, 480, 430],
    "metadata_video": [1200, 1150, 1180],
    "thumbnail": [350, 320, 340]
  }
}
```

### Análisis de Performance
```bash
# Ver métricas
cat logs/metrics-media.jsonl | jq '.phases'

# Calcular promedio por fase
cat logs/metrics-media.jsonl | jq '.phases.metadata_image | add/length'
```

## 🔗 Referencias

- **Documentación completa**: `docs/REFACTOR-FILE-ENTITY-MAPPER-2025-10-02.md`
- **Plan de refactorización**: `docs/REFACTOR-ANALYSIS.md`
- **Código legacy**: `file-entity-mapper.service.legacy.ts`

## 🚀 Roadmap

- [ ] Migrar tests existentes a procesadores individuales
- [ ] Agregar tests unitarios por procesador
- [ ] Optimizar caché de metadata (Redis para prod)
- [ ] Agregar telemetría avanzada
- [ ] Soporte para más tipos de archivos (Epub, CBZ, etc.)
- [ ] Thumbnail generation asíncrono en worker threads
- [ ] Metadata extraction con prioridad configurable

---

**Última actualización**: 2 de octubre de 2025  
**Versión**: 2.0.0 (Modular)  
**Líneas totales**: ~1,500 líneas (antes: 1,266 en un archivo)  
**Archivos**: 11 módulos especializados  
**Breaking changes**: ❌ Zero
