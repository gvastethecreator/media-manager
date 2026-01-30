# Guía de Servicios

## Image Manager - Capa de Negocio

**Versión:** 0.1.0  
**Última Actualización:** 31 de diciembre de 2025

---

## 1. Visión General

Los servicios encapsulan toda la lógica de negocio del sistema. Cada servicio está dedicado a un dominio específico y expone operaciones CRUD más funcionalidades especializadas.

### 1.1 Ubicación

```
src/services/
├── activity/           # Registro de actividades
├── album/              # Gestión de álbumes
├── audio/              # Procesamiento de audio
├── cache/              # Sistema de caché
├── character/          # Personajes (worldbuilding)
├── clipboard/          # Portapapeles del sistema
├── collection/         # Colecciones NFT
├── concept/            # Conceptos abstractos
├── document/           # Documentos de texto
├── download/           # Descargas de archivos
├── drag-selection/     # Selección por arrastre
├── file/               # Operaciones de archivos
├── file3d/             # Modelos 3D
├── folder/             # Gestión de carpetas
├── group/              # Grupos organizadores
├── image/              # ⭐ Procesamiento de imágenes
├── json-file/          # Archivos JSON
├── metadata/           # Extracción de metadatos
├── note/               # Sistema de notas
├── place/              # Lugares (worldbuilding)
├── profile/            # Perfiles de usuario
├── progress/           # Tracking de progreso
├── prompt/             # Prompts de IA
├── property/           # Propiedades descriptivas
├── queue-job/          # Cola de trabajos
├── settings/           # Configuración
├── stats/              # Estadísticas
├── tag/                # Sistema de tags
├── task/               # Tareas
├── thumbnail/          # Generación de thumbnails
├── toast/              # Notificaciones
├── undo-redo/          # Deshacer/rehacer
├── uploaded-images/    # Imágenes subidas
├── video/              # Procesamiento de video
├── wildcard/           # Wildcards dinámicos
└── world-item/         # Items del mundo
```

### 1.2 Patrón de Servicio

Cada servicio sigue un patrón consistente:

```typescript
// src/services/<entity>/
├── <entity>.service.ts          # Implementación principal
├── <entity>.service.effect.ts   # Versión Effect-TS (opcional)
├── <entity>-events.ts           # Sistema de eventos
├── <entity>-utils.ts            # Utilidades específicas
├── index.ts                     # Exportaciones
└── __tests__/                   # Tests unitarios
```

---

## 2. Servicios Principales

### 2.1 Image Service

El servicio más complejo del sistema, maneja todas las operaciones con imágenes.

#### Estructura

```
src/services/image/
├── image.service.ts           # Servicio principal
├── image.service.effect.ts    # Versión Effect-TS
├── image-events.ts            # Eventos de imágenes
├── image-lookup.service.ts    # Búsquedas optimizadas
├── image-processing.ts        # Procesamiento con Sharp
├── image-thumbnail.service.ts # Generación de thumbnails
├── image-utils.ts             # Utilidades
├── converter.service.ts       # Conversión de formatos
└── index.ts
```

#### API del Servicio

```typescript
import { imageService, IMAGE_EVENTS } from '@/services/image';

// CRUD básico
const image = await imageService.create({
  name: 'imagen.jpg',
  path: '/path/to/image.jpg',
  size: 1024000,
  width: 1920,
  height: 1080,
  hash: 'sha256hash...',
  folderId: 'folder_123',
});

const images = await imageService.getImages({
  folderId: 'folder_123',
  page: 1,
  pageSize: 50,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isFavorite: true,
});

await imageService.update('img_123', {
  name: 'nuevo-nombre.jpg',
  isFavorite: true,
});

await imageService.delete('img_123');

// Operaciones especializadas
const byHash = await imageService.getByHash('sha256hash...');
const byPath = await imageService.getByPathAndFolder('/path/to/image.jpg', 'folder_123');

// Thumbnails
const thumbnail = await imageService.generateThumbnail('img_123', {
  width: 300,
  height: 200,
  quality: 80,
  format: 'webp',
});

// Tags y relaciones
await imageService.addTags('img_123', ['tag_1', 'tag_2']);
await imageService.removeTag('img_123', 'tag_1');
const tags = await imageService.getTags('img_123');

// Álbumes
await imageService.addToAlbums('img_123', ['album_1']);
await imageService.removeFromAlbum('img_123', 'album_1');
```

#### Eventos

```typescript
import { emitImageEvent, onImageEvent, IMAGE_EVENTS } from '@/services/image';

// Suscribirse a eventos
onImageEvent(IMAGE_EVENTS.CREATED, (data) => {
  console.log('Nueva imagen:', data.id);
});

onImageEvent(IMAGE_EVENTS.THUMBNAIL_GENERATED, (data) => {
  console.log('Thumbnail listo:', data.id);
});

// Los eventos disponibles son:
// - IMAGE_CREATED
// - IMAGE_UPDATED
// - IMAGE_DELETED
// - THUMBNAIL_GENERATED
// - ERROR
```

#### Configuración de Thumbnails

```typescript
// image-processing.ts
export const THUMBNAIL_QUALITY_CONFIG = {
  small: { width: 150, height: 150, quality: 70 },
  medium: { width: 300, height: 300, quality: 80 },
  large: { width: 600, height: 600, quality: 85 },
};
```

---

### 2.2 Folder Service

Gestiona la indexación y monitoreo de carpetas.

#### API

```typescript
import { folderService } from '@/services/folder';

// CRUD
const folder = await folderService.create({
  path: '/home/user/images',
  name: 'Mis Imágenes',
  isRoot: true,
  isWatched: true,
});

const folders = await folderService.getAll({ isRoot: true });
const folder = await folderService.getById('folder_123');
const tree = await folderService.getTree('folder_123');

// Reindexación
const result = await folderService.reindex('folder_123', {
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.current}/${progress.total}`);
  },
});

// Contenidos
const contents = await folderService.getContents('folder_123', {
  includeImages: true,
  includeVideos: true,
  includeSubfolders: true,
});

// Estadísticas
const stats = await folderService.getStats('folder_123');
```

#### Proceso de Reindexación

```
1. Escanear sistema de archivos
   ├── Listar archivos en la carpeta
   ├── Filtrar por extensiones soportadas
   └── Generar hashes de contenido

2. Comparar con base de datos
   ├── Identificar archivos nuevos
   ├── Identificar archivos modificados
   └── Identificar archivos eliminados

3. Procesar cambios
   ├── Crear registros para nuevos
   ├── Actualizar registros modificados
   ├── Marcar eliminados
   └── Generar thumbnails

4. Actualizar estadísticas
   ├── Contar archivos por tipo
   ├── Calcular tamaño total
   └── Actualizar timestamps
```

---

### 2.3 Tag Service

Gestiona el sistema de etiquetado.

#### API

```typescript
import { tagService } from '@/services/tag';

// CRUD
const tag = await tagService.create({
  name: 'Paisaje',
  description: 'Fotografías de paisajes naturales',
  color: '#10b981',
  emoji: '🏔️',
  category: 'nature',
});

const tags = await tagService.getAll({ category: 'nature' });
await tagService.update('tag_123', { color: '#3b82f6' });
await tagService.delete('tag_123');

// Con estadísticas
const tagsWithStats = await tagService.getAllWithStats();
// Incluye: _count.images, _count.videos

// Búsqueda
const results = await tagService.search('paisaje');

// Jerarquía
const children = await tagService.getChildren('tag_parent');
await tagService.setParent('tag_child', 'tag_parent');
```

---

### 2.4 Album Service

Gestiona álbumes de agrupación.

#### API

```typescript
import { albumService } from '@/services/album';

// CRUD
const album = await albumService.create({
  name: 'Vacaciones 2025',
  description: 'Fotos del viaje a la playa',
  color: '#f59e0b',
  emoji: '🏖️',
});

const albums = await albumService.getAll();
const album = await albumService.getById('album_123');

// Contenido
await albumService.addImages('album_123', ['img_1', 'img_2']);
await albumService.removeImage('album_123', 'img_1');
await albumService.addVideos('album_123', ['vid_1']);

const contents = await albumService.getContents('album_123');

// Portada
await albumService.setCoverImage('album_123', 'img_1');

// Ordenamiento
await albumService.reorderItems('album_123', [
  { id: 'img_2', order: 1 },
  { id: 'img_1', order: 2 },
]);
```

---

### 2.5 Video Service

Procesa y gestiona archivos de video.

#### API

```typescript
import { videoService } from '@/services/video';

// Similar a imageService pero con campos específicos de video
const video = await videoService.create({
  name: 'video.mp4',
  path: '/path/to/video.mp4',
  size: 50000000,
  width: 1920,
  height: 1080,
  duration: 120.5, // segundos
  frameRate: 30,
  bitrate: 5000000,
  codec: 'h264',
  hash: 'sha256hash...',
  folderId: 'folder_123',
});

// Thumbnail (extrae frame)
await videoService.generateThumbnail('vid_123', {
  timestamp: 5, // segundo 5
  width: 300,
  height: 200,
});
```

---

### 2.6 Audio Service

Procesa archivos de audio.

#### API

```typescript
import { audioService } from '@/services/audio';

const audio = await audioService.create({
  name: 'cancion.mp3',
  path: '/path/to/cancion.mp3',
  size: 5000000,
  duration: 180.5,
  bitrate: 320000,
  sampleRate: 44100,
  channels: 2,
  codec: 'mp3',
  artist: 'Artista',
  album: 'Álbum',
  title: 'Canción',
  year: 2025,
  hash: 'sha256hash...',
  folderId: 'folder_123',
});

// Waveform para visualización
const waveform = await audioService.generateWaveform('audio_123');
```

---

### 2.7 Character Service (Worldbuilding)

Gestiona personajes para worldbuilding.

#### API

```typescript
import { characterService } from '@/services/character';

const character = await characterService.create({
  name: 'Elara Moonshadow',
  description: 'Elfa maga del bosque encantado',
  race: 'Elf',
  class: 'Mage',
  level: 15,
  alignment: 'Neutral Good',
  age: 250,
  gender: 'Female',
  backstory: 'Nacida en el bosque de Silverwind...',
  personality: 'Sabia, reservada, curiosa',
  appearance: 'Cabello plateado, ojos violeta...',
  stats: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 18,
    wisdom: 16,
    charisma: 12,
  },
  abilities: ['Fireball', 'Shield', 'Teleport'],
  relationships: [
    { characterId: 'char_456', type: 'ally', description: 'Compañero de aventuras' },
  ],
});

// Imágenes asociadas
await characterService.addImages('char_123', ['img_1', 'img_2']);
const images = await characterService.getImages('char_123');

// Avatar
await characterService.setAvatar('char_123', 'img_1');
```

---

### 2.8 Metadata Service

Extrae metadatos de archivos.

#### API

```typescript
import { metadataService } from '@/services/metadata';

// Extracción básica
const metadata = await metadataService.extract('/path/to/image.jpg');
// Retorna: EXIF, XMP, IPTC, etc.

// Extracción avanzada (detecta origen IA)
const advanced = await metadataService.extractAdvanced('/path/to/image.png');
// Retorna: aiEngine, aiModel, prompt, etc.

// Guardar metadatos custom
await metadataService.save('img_123', 'image', {
  key: 'custom_field',
  value: 'valor personalizado',
  source: 'manual',
});

// Obtener todos los metadatos
const allMeta = await metadataService.getByEntity('img_123', 'image');
```

---

### 2.9 Thumbnail Service

Genera thumbnails optimizados.

#### API

```typescript
import { thumbnailService } from '@/services/thumbnail';

// Generar thumbnail
const thumbnail = await thumbnailService.generate({
  sourcePath: '/path/to/image.jpg',
  entityId: 'img_123',
  entityType: 'image',
  width: 300,
  height: 200,
  quality: 80,
  format: 'webp',
});

// Obtener thumbnail
const data = await thumbnailService.get('img_123', 'image');

// Regenerar
await thumbnailService.regenerate('img_123', 'image');

// Limpiar thumbnails huérfanos
await thumbnailService.cleanup();
```

---

### 2.10 Stats Service

Calcula y gestiona estadísticas.

#### API

```typescript
import { statsService } from '@/services/stats';

// Estadísticas globales
const global = await statsService.getGlobal();
// { totalImages, totalVideos, totalSize, ... }

// Por carpeta
const folderStats = await statsService.getByFolder('folder_123');

// Por entidad
const entityStats = await statsService.getByEntity('tag_123', 'tag');

// Recalcular
await statsService.recalculate('folder_123');
await statsService.recalculateAll();
```

---

### 2.11 Settings Service

Gestiona configuración del sistema.

#### API

```typescript
import { settingsService } from '@/services/settings';

// Obtener configuración
const theme = await settingsService.get('ui.theme');
const all = await settingsService.getAll();
const byCategory = await settingsService.getByCategory('thumbnails');

// Guardar
await settingsService.set('ui.theme', { mode: 'dark', accent: 'blue' });

// Valores por defecto
const value = await settingsService.getOrDefault('ui.sidebar.width', 250);

// Reset
await settingsService.reset('ui.theme');
await settingsService.resetAll();
```

---

## 3. Servicios de Utilidad

### 3.1 File Service

Operaciones del sistema de archivos.

```typescript
import { fileService } from '@/services/file';

const exists = await fileService.exists('/path/to/file');
const hash = await fileService.getHash('/path/to/file');
const info = await fileService.getInfo('/path/to/file');

await fileService.copy('/from', '/to');
await fileService.move('/from', '/to');
await fileService.delete('/path');
```

### 3.2 Cache Service

Sistema de caché en memoria.

```typescript
import { cacheService } from '@/services/cache';

cacheService.set('key', value, { ttl: 60000 }); // 60 segundos
const value = cacheService.get('key');
cacheService.delete('key');
cacheService.clear();
```

### 3.3 Toast Service

Notificaciones de usuario.

```typescript
import { toastService } from '@/services/toast';

toastService.success('Operación completada');
toastService.error('Error al procesar');
toastService.info('Información');
toastService.warning('Advertencia');

toastService.promise(asyncOperation(), {
  loading: 'Procesando...',
  success: 'Completado',
  error: 'Error',
});
```

### 3.4 Clipboard Service

Portapapeles del sistema.

```typescript
import { clipboardService } from '@/services/clipboard';

clipboardService.copy([{ type: 'image', id: 'img_123' }]);
clipboardService.cut([{ type: 'image', id: 'img_123' }]);
const items = clipboardService.paste();
clipboardService.clear();
```

### 3.5 Progress Service

Tracking de operaciones largas.

```typescript
import { progressService } from '@/services/progress';

const tracker = progressService.create('reindex', {
  total: 1000,
  description: 'Reindexando carpeta...',
});

tracker.update(100); // 10% completado
tracker.increment();
tracker.setMessage('Procesando thumbnails...');
tracker.complete();
```

---

## 4. Effect-TS Integration

Los servicios están siendo migrados a Effect-TS para mejor manejo de errores y composición.

### 4.1 Estructura

```typescript
// image.service.effect.ts
import { Effect, pipe } from 'effect';
import type { ServiceError } from '@/lib/effect/errors';

export const getImageByIdEffect = (id: string) =>
  Effect.gen(function* () {
    const image = yield* Effect.tryPromise({
      try: () => db.query.images.findFirst({ where: eq(images.id, id) }),
      catch: (e) => new DatabaseError({ cause: e }),
    });

    if (!image) {
      return yield* Effect.fail(new NotFoundError({ entityType: 'image', id }));
    }

    return image;
  });

// Uso
const result = await Effect.runPromise(
  pipe(
    getImageByIdEffect('img_123'),
    Effect.catchAll((error) => {
      // Manejo tipado de errores
    })
  )
);
```

### 4.2 Feature Flags

```typescript
// src/config/features.ts
export const FEATURES = {
  USE_EFFECT_TAGS: true,    // TagService con Effect
  USE_EFFECT_IMAGES: true,  // ImageService con Effect
  USE_EFFECT_VIDEOS: true,  // VideoService con Effect
  USE_EFFECT_AUDIOS: true,  // AudioService con Effect
};
```

---

## 5. Transformers

Los transformadores convierten datos de BD a vistas/DTOs.

### 5.1 Estructura

```
src/transformers/
├── base/              # Transformers base
├── image/             # Transformers de imagen
├── video/             # Transformers de video
├── tag/               # Transformers de tag
└── common/            # Utilidades compartidas
```

### 5.2 Ejemplo

```typescript
// src/transformers/image/image.transformer.ts
import type { ImageRow } from '@/lib/drizzle/schema';
import type { ImageView, ImageWithStats } from '@/types/entities/image';

export function imageToView(row: ImageRow): ImageView {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    size: row.size,
    width: row.width,
    height: row.height,
    aspectRatio: row.width / row.height,
    formattedSize: formatBytes(row.size),
    thumbnailUrl: row.thumbnail ? undefined : `/api/images/${row.id}/thumbnail`,
    thumbnail: row.thumbnail,
    isFavorite: row.isFavorite,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function imageToStats(
  row: ImageRow,
  counts: { tags: number; albums: number }
): ImageWithStats {
  return {
    ...imageToView(row),
    _count: counts,
    tagCount: counts.tags,
    albumCount: counts.albums,
  };
}
```

---

## 6. Buenas Prácticas

### 6.1 Crear un Nuevo Servicio

1. Crear directorio: `src/services/<entity>/`
2. Crear archivo principal: `<entity>.service.ts`
3. Definir interfaz de operaciones
4. Implementar CRUD básico
5. Añadir operaciones especializadas
6. Crear eventos si es necesario
7. Exportar en `index.ts`
8. Añadir a `src/services/index.ts`

### 6.2 Convenciones

- Usar nombres descriptivos para métodos
- Documentar con JSDoc
- Tipar todos los inputs y outputs
- Manejar errores apropiadamente
- Emitir eventos para operaciones importantes
- Mantener funciones pequeñas y focalizadas

### 6.3 Testing

```typescript
// src/services/image/__tests__/image.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { imageService } from '../image.service';

describe('ImageService', () => {
  beforeEach(async () => {
    // Setup
  });

  it('should create an image', async () => {
    const image = await imageService.create({...});
    expect(image.id).toBeDefined();
  });

  it('should get images by folder', async () => {
    const result = await imageService.getImages({ folderId: 'folder_123' });
    expect(result.images).toBeInstanceOf(Array);
  });
});
```

---

## Referencias

- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Esquema de Base de Datos](./DATABASE-SCHEMA.md)
- [Referencia de API](./API-REFERENCE.md)
- [Guía de Frontend](./FRONTEND-GUIDE.md)
