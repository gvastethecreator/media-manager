# Sistema Unificado de Thumbnails

## Resumen

Se ha implementado un sistema unificado de thumbnails que soporta la generación, indexado y visualización de miniaturas para todos los tipos de archivos del proyecto:

- **Imágenes** (JPG, PNG, WebP, GIF, etc.)
- **Videos** (MP4, AVI, MKV, etc.) - usando FFmpeg
- **Audio** (MP3, WAV, FLAC, etc.) - con visualización de waveform
- **Documentos** (PDF, MD, TXT) - con preview SVG
- **JSON** - con preview de estructura
- **Modelos 3D** (GLTF, GLB, OBJ, etc.) - con preview SVG

## Arquitectura

### Backend

#### 1. Servicio Unificado (`src/services/thumbnail/thumbnail-unified.service.ts`)

Servicio centralizado que maneja la generación y recuperación de thumbnails para todos los tipos:

```typescript
// Obtener o generar thumbnail
const result = await thumbnailUnifiedService.getThumbnail('video', entityId, {
	width: 320,
	height: 180,
	quality: 'medium',
});

// Verificar si existe thumbnail
const hasThumbnail = await thumbnailUnifiedService.hasThumbnail('image', entityId);

// Generar en batch
const results = await thumbnailUnifiedService.generateBatch([
	{ entityType: 'image', entityId: 'id1' },
	{ entityType: 'video', entityId: 'id2' },
]);
```

#### 2. API Endpoints (`src/server/routes/thumbnails-unified.ts`)

Endpoints RESTful para acceso a thumbnails:

```
GET  /api/thumbnails/unified/image/:id     - Thumbnail de imagen
GET  /api/thumbnails/unified/video/:id     - Thumbnail de video
GET  /api/thumbnails/unified/audio/:id     - Waveform de audio
GET  /api/thumbnails/unified/document/:id  - Preview de documento
GET  /api/thumbnails/unified/json/:id      - Preview de JSON
GET  /api/thumbnails/unified/3d/:id        - Preview de modelo 3D

POST /api/thumbnails/unified/generate      - Generar thumbnail
POST /api/thumbnails/unified/batch         - Generar múltiples thumbnails
GET  /api/thumbnails/unified/info/:type/:id - Info del thumbnail
GET  /api/thumbnails/unified/stats         - Estadísticas
```

#### 3. Procesadores de Archivos

Cada procesador en `src/services/file-entity-mapper/processors/` tiene un método `generateThumbnail`:

- **AudioProcessor**: Genera waveform usando `generateAndSaveWaveform`
- **VideoProcessor**: Usa FFmpeg para extraer frame
- **DocumentProcessor**: Crea SVG con información del documento
- **JsonProcessor**: Crea SVG con preview de estructura JSON
- **File3DProcessor**: Crea SVG con información del modelo

### Frontend

#### 1. Hook useThumbnail (`src/hooks/use-thumbnail.ts`)

Hook React para obtener thumbnails de forma declarativa:

```typescript
const { url, loading, error, refresh } = useThumbnail('video', entityId, {
	width: 320,
	height: 180,
	quality: 'medium',
});

// El hook automáticamente:
// 1. Intenta obtener thumbnail existente
// 2. Si no existe, lo genera on-demand
// 3. Maneja errores y estados de carga
```

#### 2. Generadores de Thumbnails (`src/config/thumbnail-generators.ts`)

Funciones para generar URLs de thumbnails:

```typescript
import {
	generateAdvancedImageThumbnail,
	generateAdvancedVideoThumbnail,
	generateAudioWaveform,
	generateDocumentPreview,
	generateJsonPreview,
	generate3DModelThumbnail,
} from '@/config/thumbnail-generators';

// Usar en componentes
const thumbnailUrl = await generateAdvancedVideoThumbnail(videoItem, { timeOffset: 5 });
```

#### 3. Componente MediaThumbnail

El componente existente (`src/components/features/file-browser-new/components/media-thumbnail`) usa los generadores actualizados que apuntan al sistema unificado.

## Flujo de Generación

### Durante Indexación/Reindexación

1. El `FileEntityMapperCore` procesa archivos en 3 etapas:
   - **Etapa 1**: Crear entidad básica
   - **Etapa 2**: Extraer metadata
   - **Etapa 3**: Generar thumbnail

2. Cada procesador genera el thumbnail según el tipo:
   - Imágenes: Usa Sharp para redimensionar
   - Videos: Usa FFmpeg para extraer frame
   - Audio: Genera waveform SVG
   - Documentos/JSON/3D: Genera SVG informativo

### On-Demand (Al Visualizar)

1. El componente solicita thumbnail mediante hook
2. Si no existe, el backend lo genera automáticamente
3. El thumbnail se guarda para futuras solicitudes
4. Se usa placeholder como fallback mientras se genera

## Almacenamiento

| Tipo       | Ubicación                                      | Formato    |
| ---------- | ---------------------------------------------- | ---------- |
| Imágenes   | Campo `thumbnail` (base64)                     | WebP       |
| Videos     | Campo `thumbnail` (base64)                     | WebP       |
| Audio      | `metadata.waveform.data` (base64)              | SVG        |
| Documentos | Tabla `metadatas` (id: `{entityId}-thumbnail`) | SVG base64 |
| JSON       | `metadata.thumbnail.data` (base64)             | SVG        |
| 3D         | `metadata.thumbnail.data` (base64)             | SVG        |

## Caché y Performance

### Backend

- Headers de caché: `Cache-Control: public, max-age=31536000` (1 año)
- Thumbnails se generan una sola vez y se reutilizan

### Frontend

- Caché en memoria con LRU (5 minutos)
- Lazy loading con viewport gating
- Animaciones de video precargadas solo cuando es necesario

## Uso

### En Componentes React

```tsx
import { useThumbnail } from '@/hooks/use-thumbnail';

function MediaCard({ item }) {
	const { url, loading, error, placeholder } = useThumbnail(item.entityType, item.id, {
		width: 300,
		height: 300,
		quality: 'medium',
	});

	return (
		<div className="media-card">
			{loading ? <div className="skeleton" /> : <img src={url || placeholder} alt={item.name} />}
		</div>
	);
}
```

### Generación Programática

```typescript
import { thumbnailUnifiedService } from '@/services/thumbnail';

// Generar thumbnail específico
const result = await thumbnailUnifiedService.getThumbnail('document', docId, {
	force: true, // Forzar regeneración
});

// Generar múltiples
await thumbnailUnifiedService.generateBatch([
	{ entityType: 'image', entityId: 'img1' },
	{ entityType: 'audio', entityId: 'audio1' },
	{ entityType: 'video', entityId: 'vid1' },
]);
```

## API REST

### Obtener Thumbnail

```bash
# Thumbnail de imagen
GET /api/thumbnails/unified/image/{id}?width=512&height=512&quality=high

# Thumbnail de video (timeOffset implícito)
GET /api/thumbnails/unified/video/{id}?width=320&height=180

# Waveform de audio
GET /api/thumbnails/unified/audio/{id}?width=800&height=200

# Preview de documento
GET /api/thumbnails/unified/document/{id}

# Preview de JSON
GET /api/thumbnails/unified/json/{id}?theme=dark

# Preview de modelo 3D
GET /api/thumbnails/unified/3d/{id}?angle=45
```

### Generar Thumbnail

```bash
POST /api/thumbnails/unified/generate
Content-Type: application/json

{
  "entityType": "video",
  "entityId": "video-id",
  "options": {
    "width": 640,
    "height": 360,
    "quality": "high"
  }
}
```

### Batch Generation

```bash
POST /api/thumbnails/unified/batch
Content-Type: application/json

{
  "requests": [
    { "entityType": "image", "entityId": "img1" },
    { "entityType": "video", "entityId": "vid1" },
    { "entityType": "audio", "entityId": "aud1" }
  ],
  "options": { "quality": "medium" }
}
```

## Roadmap / Mejoras Futuras

1. **Renderizado 3D Real**: Implementar Three.js headless para renderizar modelos 3D reales
2. **Previews de PDF**: Usar librerías como pdf2pic para generar previews de páginas PDF
3. **Extracción de Audio Real**: Usar node-ffmpeg para extraer waveform real del audio
4. **Cola de Procesamiento**: Implementar cola con prioridad para generación masiva
5. **WebP/AVIF**: Soportar formatos modernos para mejor compresión
6. **Thumbnails Responsivos**: Generar múltiples tamaños (sm, md, lg, xl)
