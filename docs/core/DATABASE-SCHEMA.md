# Esquema de Base de Datos

## Image Manager - Documentación de Drizzle ORM

**Versión:** 0.1.0  
**ORM:** Drizzle ORM 0.45.1  
**Base de Datos:** SQLite (via @libsql/client)  
**Última Actualización:** 31 de diciembre de 2025

---

## 1. Visión General

El esquema de base de datos está organizado en **6 dominios** que agrupan las tablas según su función:

```
src/lib/drizzle/schema/
├── core/           # Tablas fundamentales del sistema
├── files/          # Archivos multimedia
├── organization/   # Organización de contenido
├── taxonomy/       # Clasificación y etiquetado
├── worldbuilding/  # Construcción de mundos
└── relations/      # Relaciones many-to-many
```

---

## 2. Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               CORE DOMAIN                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ profiles │  │ settings │  │queueJobs │  │activities│  │ entityAggregates │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               FILES DOMAIN                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  images  │  │  videos  │  │  audios  │  │documents │  │    jsonFiles     │  │
│  └─────┬────┘  └─────┬────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│        │             │                                                          │
│        └──────┬──────┘        ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│               │               │  file3Ds │  │fileStats │  │   thumbnails     │ │
│               │               └──────────┘  └──────────┘  └──────────────────┘ │
│               │                                                                 │
│               ▼                                                                 │
│  ┌────────────────────┐                                                         │
│  │      folders       │  (Carpeta padre de todos los archivos)                  │
│  └────────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ORGANIZATION DOMAIN                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  albums  │  │collections│  │  groups  │  │favorites │  │      files       │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TAXONOMY DOMAIN                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   tags   │  │properties│  │wildcards │  │ prompts  │  │      notes       │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│                                            ┌──────────┐                         │
│                                            │  tasks   │                         │
│                                            └──────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            WORLDBUILDING DOMAIN                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────────┐│
│  │characters│  │  places  │  │ concepts │  │          worldItems              ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                             RELATIONS (Many-to-Many)                             │
│  imageTags, videoTags, imageAlbums, videoAlbums, imageCollections,              │
│  videoCollections, imageProperties, videoProperties, imageCharacters,           │
│  videoCharacters, imagePlaces, videoPlaces, imageWildcards, videoWildcards,     │
│  imageConcepts, videoConcepts, imageWorldItems, videoWorldItems,                │
│  imageNotes, videoNotes, imagePrompts, videoPrompts, groupImages, groupVideos,  │
│  groupTags, groupAlbums, imageTasks, videoTasks, albumTasks, characterTasks     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dominios y Tablas

### 3.1 Core Domain

#### `profiles`

Perfiles de usuario del sistema.

| Columna     | Tipo    | Descripción                |
| ----------- | ------- | -------------------------- |
| `id`        | TEXT    | PK, ID único               |
| `name`      | TEXT    | Nombre del perfil          |
| `avatar`    | TEXT    | URL del avatar             |
| `isDefault` | INTEGER | Es perfil por defecto      |
| `createdAt` | INTEGER | Timestamp de creación      |
| `updatedAt` | INTEGER | Timestamp de actualización |

#### `settings`

Configuraciones del sistema por clave-valor.

| Columna     | Tipo    | Descripción                    |
| ----------- | ------- | ------------------------------ |
| `id`        | TEXT    | PK, ID único                   |
| `key`       | TEXT    | Clave de configuración (único) |
| `value`     | TEXT    | Valor JSON                     |
| `category`  | TEXT    | Categoría de la configuración  |
| `createdAt` | INTEGER | Timestamp de creación          |
| `updatedAt` | INTEGER | Timestamp de actualización     |

#### `queueJobs`

Cola de trabajos en background.

| Columna       | Tipo    | Descripción                                     |
| ------------- | ------- | ----------------------------------------------- |
| `id`          | TEXT    | PK, ID único                                    |
| `type`        | TEXT    | Tipo de trabajo                                 |
| `payload`     | TEXT    | Datos del trabajo (JSON)                        |
| `status`      | TEXT    | Estado (pending, processing, completed, failed) |
| `priority`    | INTEGER | Prioridad                                       |
| `attempts`    | INTEGER | Intentos realizados                             |
| `maxAttempts` | INTEGER | Máximo de intentos                              |
| `error`       | TEXT    | Mensaje de error si falló                       |
| `createdAt`   | INTEGER | Timestamp de creación                           |
| `startedAt`   | INTEGER | Inicio de procesamiento                         |
| `completedAt` | INTEGER | Fin de procesamiento                            |

#### `activities`

Registro de actividades del sistema.

| Columna      | Tipo    | Descripción              |
| ------------ | ------- | ------------------------ |
| `id`         | TEXT    | PK, ID único             |
| `type`       | TEXT    | Tipo de actividad        |
| `action`     | TEXT    | Acción realizada         |
| `entityType` | TEXT    | Tipo de entidad afectada |
| `entityId`   | TEXT    | ID de entidad afectada   |
| `metadata`   | TEXT    | Datos adicionales (JSON) |
| `createdAt`  | INTEGER | Timestamp                |

#### `entityAggregates`

Estadísticas agregadas por entidad (caché de conteos).

| Columna          | Tipo    | Descripción           |
| ---------------- | ------- | --------------------- |
| `id`             | TEXT    | PK, ID único          |
| `entityType`     | TEXT    | Tipo de entidad       |
| `entityId`       | TEXT    | ID de la entidad      |
| `imageCount`     | INTEGER | Conteo de imágenes    |
| `videoCount`     | INTEGER | Conteo de videos      |
| `audioCount`     | INTEGER | Conteo de audios      |
| `documentCount`  | INTEGER | Conteo de documentos  |
| `totalSize`      | INTEGER | Tamaño total en bytes |
| `lastCalculated` | INTEGER | Último cálculo        |

---

### 3.2 Files Domain

#### `folders`

Carpetas físicas indexadas del sistema de archivos.

| Columna         | Tipo    | Descripción                 |
| --------------- | ------- | --------------------------- |
| `id`            | TEXT    | PK, ID único                |
| `name`          | TEXT    | Nombre de la carpeta        |
| `path`          | TEXT    | Ruta absoluta (único)       |
| `parentId`      | TEXT    | FK a folder padre           |
| `depth`         | INTEGER | Nivel de profundidad        |
| `isRoot`        | INTEGER | Es carpeta raíz             |
| `isWatched`     | INTEGER | Monitoreo de cambios activo |
| `lastIndexedAt` | INTEGER | Último indexado             |
| `createdAt`     | INTEGER | Timestamp de creación       |
| `updatedAt`     | INTEGER | Timestamp de actualización  |

**Índices:** `path_unique`, `parentId_idx`, `depth_idx`

#### `images`

Archivos de imagen indexados.

| Columna                | Tipo    | Descripción                 |
| ---------------------- | ------- | --------------------------- |
| `id`                   | TEXT    | PK, ID único                |
| `name`                 | TEXT    | Nombre del archivo          |
| `description`          | TEXT    | Descripción                 |
| `path`                 | TEXT    | Ruta del archivo            |
| `hash`                 | TEXT    | Hash SHA-256 del contenido  |
| `size`                 | INTEGER | Tamaño en bytes             |
| `width`                | INTEGER | Ancho en píxeles            |
| `height`               | INTEGER | Alto en píxeles             |
| `metadata`             | TEXT    | Metadatos EXIF/XMP (JSON)   |
| `thumbnail`            | TEXT    | Thumbnail en base64         |
| `thumbnailSize`        | INTEGER | Tamaño del thumbnail        |
| `thumbnailWidth`       | INTEGER | Ancho del thumbnail         |
| `thumbnailHeight`      | INTEGER | Alto del thumbnail          |
| `thumbnailMimeType`    | TEXT    | MIME type del thumbnail     |
| `thumbnailError`       | TEXT    | Error de generación         |
| `thumbnailErrorAt`     | INTEGER | Timestamp de error          |
| `thumbnailOptimizedAt` | INTEGER | Última optimización         |
| `aiEngine`             | TEXT    | Motor de IA utilizado       |
| `aiModel`              | TEXT    | Modelo de IA                |
| `aiOriginDetected`     | INTEGER | Origen IA detectado         |
| `isFavorite`           | INTEGER | Es favorito                 |
| `folderId`             | TEXT    | FK a folder                 |
| `noteId`               | TEXT    | FK a nota asociada          |
| `createdAt`            | INTEGER | Timestamp de creación       |
| `updatedAt`            | INTEGER | Timestamp de actualización  |
| `addedAt`              | INTEGER | Fecha de adición al sistema |

**Índices:** `path_folderId_unique`, `folderId_idx`, `hash_idx`, `createdAt_idx`, `isFavorite_idx`, `aiEngine_idx`

**Constraints:**

- `size >= 0 AND size <= 107374182400` (max 100GB)
- `width > 0 AND width <= 32768`
- `height > 0 AND height <= 32768`
- `length(hash) = 64` (SHA-256)

#### `videos`

Archivos de video indexados.

| Columna       | Tipo    | Descripción                |
| ------------- | ------- | -------------------------- |
| `id`          | TEXT    | PK, ID único               |
| `name`        | TEXT    | Nombre del archivo         |
| `description` | TEXT    | Descripción                |
| `path`        | TEXT    | Ruta del archivo           |
| `hash`        | TEXT    | Hash SHA-256               |
| `size`        | INTEGER | Tamaño en bytes            |
| `width`       | INTEGER | Ancho en píxeles           |
| `height`      | INTEGER | Alto en píxeles            |
| `duration`    | REAL    | Duración en segundos       |
| `frameRate`   | REAL    | FPS                        |
| `bitrate`     | INTEGER | Bitrate                    |
| `codec`       | TEXT    | Codec de video             |
| `audioCodec`  | TEXT    | Codec de audio             |
| `metadata`    | TEXT    | Metadatos (JSON)           |
| `thumbnail`   | TEXT    | Thumbnail en base64        |
| `isFavorite`  | INTEGER | Es favorito                |
| `folderId`    | TEXT    | FK a folder                |
| `createdAt`   | INTEGER | Timestamp de creación      |
| `updatedAt`   | INTEGER | Timestamp de actualización |

**Índices:** Similar a images

#### `audios`

Archivos de audio indexados.

| Columna       | Tipo    | Descripción                |
| ------------- | ------- | -------------------------- |
| `id`          | TEXT    | PK, ID único               |
| `name`        | TEXT    | Nombre del archivo         |
| `path`        | TEXT    | Ruta del archivo           |
| `hash`        | TEXT    | Hash SHA-256               |
| `size`        | INTEGER | Tamaño en bytes            |
| `duration`    | REAL    | Duración en segundos       |
| `bitrate`     | INTEGER | Bitrate                    |
| `sampleRate`  | INTEGER | Sample rate                |
| `channels`    | INTEGER | Número de canales          |
| `codec`       | TEXT    | Codec                      |
| `artist`      | TEXT    | Artista                    |
| `album`       | TEXT    | Álbum                      |
| `title`       | TEXT    | Título                     |
| `genre`       | TEXT    | Género                     |
| `year`        | INTEGER | Año                        |
| `trackNumber` | INTEGER | Número de pista            |
| `metadata`    | TEXT    | Metadatos (JSON)           |
| `waveform`    | TEXT    | Datos de waveform          |
| `isFavorite`  | INTEGER | Es favorito                |
| `folderId`    | TEXT    | FK a folder                |
| `createdAt`   | INTEGER | Timestamp de creación      |
| `updatedAt`   | INTEGER | Timestamp de actualización |

#### `documents`

Documentos de texto (Markdown, TXT, CSV).

| Columna      | Tipo    | Descripción                |
| ------------ | ------- | -------------------------- |
| `id`         | TEXT    | PK, ID único               |
| `name`       | TEXT    | Nombre del archivo         |
| `path`       | TEXT    | Ruta del archivo           |
| `hash`       | TEXT    | Hash SHA-256               |
| `size`       | INTEGER | Tamaño en bytes            |
| `mimeType`   | TEXT    | MIME type                  |
| `content`    | TEXT    | Contenido del documento    |
| `wordCount`  | INTEGER | Conteo de palabras         |
| `lineCount`  | INTEGER | Conteo de líneas           |
| `isFavorite` | INTEGER | Es favorito                |
| `folderId`   | TEXT    | FK a folder                |
| `createdAt`  | INTEGER | Timestamp de creación      |
| `updatedAt`  | INTEGER | Timestamp de actualización |

#### `jsonFiles`

Archivos JSON (workflows, configuraciones).

| Columna      | Tipo    | Descripción                |
| ------------ | ------- | -------------------------- |
| `id`         | TEXT    | PK, ID único               |
| `name`       | TEXT    | Nombre del archivo         |
| `path`       | TEXT    | Ruta del archivo           |
| `hash`       | TEXT    | Hash SHA-256               |
| `size`       | INTEGER | Tamaño en bytes            |
| `content`    | TEXT    | Contenido JSON             |
| `schema`     | TEXT    | Esquema JSON detectado     |
| `isFavorite` | INTEGER | Es favorito                |
| `folderId`   | TEXT    | FK a folder                |
| `createdAt`  | INTEGER | Timestamp de creación      |
| `updatedAt`  | INTEGER | Timestamp de actualización |

#### `file3Ds`

Modelos 3D (OBJ, FBX, GLB).

| Columna         | Tipo    | Descripción                |
| --------------- | ------- | -------------------------- |
| `id`            | TEXT    | PK, ID único               |
| `name`          | TEXT    | Nombre del archivo         |
| `path`          | TEXT    | Ruta del archivo           |
| `hash`          | TEXT    | Hash SHA-256               |
| `size`          | INTEGER | Tamaño en bytes            |
| `format`        | TEXT    | Formato (obj, fbx, glb)    |
| `vertexCount`   | INTEGER | Número de vértices         |
| `faceCount`     | INTEGER | Número de caras            |
| `materialCount` | INTEGER | Número de materiales       |
| `thumbnail`     | TEXT    | Thumbnail renderizado      |
| `isFavorite`    | INTEGER | Es favorito                |
| `folderId`      | TEXT    | FK a folder                |
| `createdAt`     | INTEGER | Timestamp de creación      |
| `updatedAt`     | INTEGER | Timestamp de actualización |

#### `fileStats`

Estadísticas por archivo.

| Columna            | Tipo    | Descripción          |
| ------------------ | ------- | -------------------- |
| `id`               | TEXT    | PK, ID único         |
| `fileId`           | TEXT    | FK a archivo         |
| `fileType`         | TEXT    | Tipo de archivo      |
| `viewCount`        | INTEGER | Veces visto          |
| `downloadCount`    | INTEGER | Veces descargado     |
| `lastViewedAt`     | INTEGER | Última visualización |
| `lastDownloadedAt` | INTEGER | Última descarga      |

#### `thumbnails`

Thumbnails almacenados separadamente (optimización).

| Columna       | Tipo    | Descripción             |
| ------------- | ------- | ----------------------- |
| `id`          | TEXT    | PK, ID único            |
| `entityId`    | TEXT    | ID de la entidad        |
| `entityType`  | TEXT    | Tipo de entidad         |
| `data`        | TEXT    | Thumbnail en base64     |
| `width`       | INTEGER | Ancho                   |
| `height`      | INTEGER | Alto                    |
| `size`        | INTEGER | Tamaño en bytes         |
| `mimeType`    | TEXT    | MIME type               |
| `quality`     | INTEGER | Calidad de compresión   |
| `generatedAt` | INTEGER | Timestamp de generación |
| `error`       | TEXT    | Error si falló          |

#### `metadatas`

Metadatos extraídos estructurados.

| Columna      | Tipo    | Descripción                |
| ------------ | ------- | -------------------------- |
| `id`         | TEXT    | PK, ID único               |
| `entityId`   | TEXT    | ID de la entidad           |
| `entityType` | TEXT    | Tipo de entidad            |
| `key`        | TEXT    | Clave del metadato         |
| `value`      | TEXT    | Valor                      |
| `source`     | TEXT    | Origen (exif, xmp, custom) |
| `createdAt`  | INTEGER | Timestamp                  |

---

### 3.3 Organization Domain

#### `tags`

Etiquetas para clasificación.

| Columna       | Tipo    | Descripción                |
| ------------- | ------- | -------------------------- |
| `id`          | TEXT    | PK, ID único               |
| `name`        | TEXT    | Nombre (único)             |
| `description` | TEXT    | Descripción                |
| `color`       | TEXT    | Color hexadecimal          |
| `emoji`       | TEXT    | Emoji asociado             |
| `category`    | TEXT    | Categoría                  |
| `parentId`    | TEXT    | FK a tag padre             |
| `isFavorite`  | INTEGER | Es favorito                |
| `createdAt`   | INTEGER | Timestamp de creación      |
| `updatedAt`   | INTEGER | Timestamp de actualización |

**Índices:** `name_unique`, `parentId_idx`, `category_idx`

#### `albums`

Álbumes de agrupación.

| Columna        | Tipo    | Descripción                |
| -------------- | ------- | -------------------------- |
| `id`           | TEXT    | PK, ID único               |
| `name`         | TEXT    | Nombre                     |
| `description`  | TEXT    | Descripción                |
| `coverImageId` | TEXT    | FK a imagen de portada     |
| `color`        | TEXT    | Color del álbum            |
| `emoji`        | TEXT    | Emoji                      |
| `sortOrder`    | INTEGER | Orden de clasificación     |
| `isFavorite`   | INTEGER | Es favorito                |
| `createdAt`    | INTEGER | Timestamp de creación      |
| `updatedAt`    | INTEGER | Timestamp de actualización |

#### `collections`

Colecciones (NFT y arte digital).

| Columna           | Tipo    | Descripción                          |
| ----------------- | ------- | ------------------------------------ |
| `id`              | TEXT    | PK, ID único                         |
| `name`            | TEXT    | Nombre                               |
| `description`     | TEXT    | Descripción                          |
| `coverImageId`    | TEXT    | FK a imagen de portada               |
| `blockchain`      | TEXT    | Blockchain (ethereum, polygon, etc.) |
| `contractAddress` | TEXT    | Dirección del contrato               |
| `tokenStandard`   | TEXT    | Estándar (ERC-721, ERC-1155)         |
| `totalSupply`     | INTEGER | Suministro total                     |
| `floorPrice`      | REAL    | Precio mínimo                        |
| `currency`        | TEXT    | Moneda                               |
| `isFavorite`      | INTEGER | Es favorito                          |
| `createdAt`       | INTEGER | Timestamp de creación                |
| `updatedAt`       | INTEGER | Timestamp de actualización           |

#### `groups`

Meta-organizadores jerárquicos.

| Columna       | Tipo    | Descripción                |
| ------------- | ------- | -------------------------- |
| `id`          | TEXT    | PK, ID único               |
| `name`        | TEXT    | Nombre                     |
| `description` | TEXT    | Descripción                |
| `parentId`    | TEXT    | FK a grupo padre           |
| `color`       | TEXT    | Color                      |
| `emoji`       | TEXT    | Emoji                      |
| `sortOrder`   | INTEGER | Orden                      |
| `isFavorite`  | INTEGER | Es favorito                |
| `createdAt`   | INTEGER | Timestamp de creación      |
| `updatedAt`   | INTEGER | Timestamp de actualización |

#### `favorites`

Sistema de favoritos multi-perfil.

| Columna      | Tipo    | Descripción      |
| ------------ | ------- | ---------------- |
| `id`         | TEXT    | PK, ID único     |
| `profileId`  | TEXT    | FK a perfil      |
| `entityType` | TEXT    | Tipo de entidad  |
| `entityId`   | TEXT    | ID de la entidad |
| `createdAt`  | INTEGER | Timestamp        |

**Índices:** `profileId_entityType_entityId_unique`

---

### 3.4 Taxonomy Domain

#### `properties`

Propiedades descriptivas.

| Columna       | Tipo    | Descripción                      |
| ------------- | ------- | -------------------------------- |
| `id`          | TEXT    | PK, ID único                     |
| `name`        | TEXT    | Nombre                           |
| `description` | TEXT    | Descripción                      |
| `type`        | TEXT    | Tipo (color, shape, style, etc.) |
| `value`       | TEXT    | Valor                            |
| `color`       | TEXT    | Color de visualización           |
| `emoji`       | TEXT    | Emoji                            |
| `isFavorite`  | INTEGER | Es favorito                      |
| `createdAt`   | INTEGER | Timestamp de creación            |
| `updatedAt`   | INTEGER | Timestamp de actualización       |

#### `wildcards`

Plantillas dinámicas para IA.

| Columna       | Tipo    | Descripción                |
| ------------- | ------- | -------------------------- |
| `id`          | TEXT    | PK, ID único               |
| `name`        | TEXT    | Nombre                     |
| `description` | TEXT    | Descripción                |
| `content`     | TEXT    | Contenido del wildcard     |
| `parentId`    | TEXT    | FK a wildcard padre        |
| `category`    | TEXT    | Categoría                  |
| `isFavorite`  | INTEGER | Es favorito                |
| `createdAt`   | INTEGER | Timestamp de creación      |
| `updatedAt`   | INTEGER | Timestamp de actualización |

#### `prompts`

Prompts para generación de IA.

| Columna          | Tipo    | Descripción                |
| ---------------- | ------- | -------------------------- |
| `id`             | TEXT    | PK, ID único               |
| `name`           | TEXT    | Nombre                     |
| `description`    | TEXT    | Descripción                |
| `content`        | TEXT    | Texto del prompt           |
| `negativePrompt` | TEXT    | Prompt negativo            |
| `category`       | TEXT    | Categoría                  |
| `parameters`     | TEXT    | Parámetros (JSON)          |
| `version`        | INTEGER | Versión                    |
| `isFavorite`     | INTEGER | Es favorito                |
| `createdAt`      | INTEGER | Timestamp de creación      |
| `updatedAt`      | INTEGER | Timestamp de actualización |

#### `notes`

Sistema de notas.

| Columna      | Tipo    | Descripción                      |
| ------------ | ------- | -------------------------------- |
| `id`         | TEXT    | PK, ID único                     |
| `title`      | TEXT    | Título                           |
| `content`    | TEXT    | Contenido Markdown               |
| `priority`   | INTEGER | Prioridad (1-5)                  |
| `status`     | TEXT    | Estado (draft, active, archived) |
| `tags`       | TEXT    | Tags (JSON array)                |
| `isFavorite` | INTEGER | Es favorito                      |
| `createdAt`  | INTEGER | Timestamp de creación            |
| `updatedAt`  | INTEGER | Timestamp de actualización       |

#### `tasks`

Tareas y todos.

| Columna       | Tipo    | Descripción                              |
| ------------- | ------- | ---------------------------------------- |
| `id`          | TEXT    | PK, ID único                             |
| `title`       | TEXT    | Título                                   |
| `description` | TEXT    | Descripción                              |
| `status`      | TEXT    | Estado (pending, in_progress, completed) |
| `priority`    | INTEGER | Prioridad                                |
| `dueDate`     | INTEGER | Fecha límite                             |
| `isFavorite`  | INTEGER | Es favorito                              |
| `createdAt`   | INTEGER | Timestamp de creación                    |
| `updatedAt`   | INTEGER | Timestamp de actualización               |

---

### 3.5 Worldbuilding Domain

#### `characters`

Personajes para worldbuilding.

| Columna         | Tipo    | Descripción                |
| --------------- | ------- | -------------------------- |
| `id`            | TEXT    | PK, ID único               |
| `name`          | TEXT    | Nombre                     |
| `description`   | TEXT    | Descripción                |
| `backstory`     | TEXT    | Historia del personaje     |
| `personality`   | TEXT    | Personalidad               |
| `appearance`    | TEXT    | Apariencia                 |
| `age`           | INTEGER | Edad                       |
| `gender`        | TEXT    | Género                     |
| `race`          | TEXT    | Raza                       |
| `class`         | TEXT    | Clase (RPG)                |
| `level`         | INTEGER | Nivel                      |
| `alignment`     | TEXT    | Alineamiento               |
| `stats`         | TEXT    | Estadísticas (JSON)        |
| `abilities`     | TEXT    | Habilidades (JSON)         |
| `relationships` | TEXT    | Relaciones (JSON)          |
| `avatarId`      | TEXT    | FK a imagen de avatar      |
| `isFavorite`    | INTEGER | Es favorito                |
| `createdAt`     | INTEGER | Timestamp de creación      |
| `updatedAt`     | INTEGER | Timestamp de actualización |

#### `places`

Lugares y ubicaciones.

| Columna       | Tipo    | Descripción                        |
| ------------- | ------- | ---------------------------------- |
| `id`          | TEXT    | PK, ID único                       |
| `name`        | TEXT    | Nombre                             |
| `description` | TEXT    | Descripción                        |
| `type`        | TEXT    | Tipo (city, dungeon, forest, etc.) |
| `climate`     | TEXT    | Clima                              |
| `population`  | INTEGER | Población                          |
| `government`  | TEXT    | Tipo de gobierno                   |
| `history`     | TEXT    | Historia                           |
| `dangers`     | TEXT    | Peligros (JSON)                    |
| `resources`   | TEXT    | Recursos (JSON)                    |
| `connections` | TEXT    | Conexiones (JSON)                  |
| `mapImageId`  | TEXT    | FK a imagen de mapa                |
| `isFavorite`  | INTEGER | Es favorito                        |
| `createdAt`   | INTEGER | Timestamp de creación              |
| `updatedAt`   | INTEGER | Timestamp de actualización         |

#### `concepts`

Ideas y conceptos abstractos.

| Columna       | Tipo    | Descripción                |
| ------------- | ------- | -------------------------- |
| `id`          | TEXT    | PK, ID único               |
| `name`        | TEXT    | Nombre                     |
| `description` | TEXT    | Descripción                |
| `category`    | TEXT    | Categoría                  |
| `content`     | TEXT    | Contenido detallado        |
| `references`  | TEXT    | Referencias (JSON)         |
| `isFavorite`  | INTEGER | Es favorito                |
| `createdAt`   | INTEGER | Timestamp de creación      |
| `updatedAt`   | INTEGER | Timestamp de actualización |

#### `worldItems`

Objetos del mundo (items de juego).

| Columna        | Tipo    | Descripción                            |
| -------------- | ------- | -------------------------------------- |
| `id`           | TEXT    | PK, ID único                           |
| `name`         | TEXT    | Nombre                                 |
| `description`  | TEXT    | Descripción                            |
| `type`         | TEXT    | Tipo (weapon, armor, consumable, etc.) |
| `rarity`       | TEXT    | Rareza                                 |
| `value`        | INTEGER | Valor                                  |
| `weight`       | REAL    | Peso                                   |
| `stats`        | TEXT    | Estadísticas (JSON)                    |
| `effects`      | TEXT    | Efectos (JSON)                         |
| `requirements` | TEXT    | Requisitos (JSON)                      |
| `imageId`      | TEXT    | FK a imagen                            |
| `isFavorite`   | INTEGER | Es favorito                            |
| `createdAt`    | INTEGER | Timestamp de creación                  |
| `updatedAt`    | INTEGER | Timestamp de actualización             |

---

### 3.6 Relations Domain

Todas las tablas de relaciones many-to-many siguen el mismo patrón:

```typescript
export const <entity1><entity2>s = sqliteTable('_<Entity1>To<Entity2>', {
  A: text('A').notNull(), // FK a entity1
  B: text('B').notNull(), // FK a entity2
}, (table) => ({
  AB_unique: uniqueIndex('_<Entity1>To<Entity2>_AB_unique').on(table.A, table.B),
  B_index: index('_<Entity1>To<Entity2>_B_index').on(table.B),
}));
```

**Relaciones disponibles:**

| Tabla              | Conecta            |
| ------------------ | ------------------ |
| `imageTags`        | Image ↔ Tag        |
| `videoTags`        | Video ↔ Tag        |
| `imageAlbums`      | Image ↔ Album      |
| `videoAlbums`      | Video ↔ Album      |
| `imageCollections` | Image ↔ Collection |
| `videoCollections` | Video ↔ Collection |
| `imageProperties`  | Image ↔ Property   |
| `videoProperties`  | Video ↔ Property   |
| `imageCharacters`  | Image ↔ Character  |
| `videoCharacters`  | Video ↔ Character  |
| `imagePlaces`      | Image ↔ Place      |
| `videoPlaces`      | Video ↔ Place      |
| `imageWildcards`   | Image ↔ Wildcard   |
| `videoWildcards`   | Video ↔ Wildcard   |
| `imageConcepts`    | Image ↔ Concept    |
| `videoConcepts`    | Video ↔ Concept    |
| `imageWorldItems`  | Image ↔ WorldItem  |
| `videoWorldItems`  | Video ↔ WorldItem  |
| `imageNotes`       | Image ↔ Note       |
| `videoNotes`       | Video ↔ Note       |
| `imagePrompts`     | Image ↔ Prompt     |
| `videoPrompts`     | Video ↔ Prompt     |
| `imageTasks`       | Image ↔ Task       |
| `videoTasks`       | Video ↔ Task       |
| `groupImages`      | Group ↔ Image      |
| `groupVideos`      | Group ↔ Video      |
| `groupTags`        | Group ↔ Tag        |
| `groupAlbums`      | Group ↔ Album      |
| `albumTasks`       | Album ↔ Task       |
| `characterTasks`   | Character ↔ Task   |

---

## 4. Conexión y Configuración

### 4.1 Configuración Drizzle

```typescript
// drizzle.config.ts
export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/drizzle/schema/index.ts',
	out: './src/lib/drizzle/migrations',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'file:./db.sqlite',
	},
});
```

### 4.2 Inicialización

```typescript
// src/lib/drizzle/index.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = createClient({
	url: process.env.DATABASE_URL || 'file:./db.sqlite',
});

export const db = drizzle(client, { schema });
```

---

## 5. Migraciones

Las migraciones se gestionan con Drizzle Kit:

```bash
# Generar migración
bunx drizzle-kit generate

# Aplicar migraciones
bunx drizzle-kit migrate

# Ver estado
bunx drizzle-kit check

# UI de exploración
bun run db:studio
```

---

## 6. Scripts de Base de Datos

| Script                          | Descripción                |
| ------------------------------- | -------------------------- |
| `bun run db:studio`             | Abre Drizzle Studio        |
| `bun run db:check`              | Verifica integridad        |
| `bun run db:reset`              | Resetea la base de datos   |
| `bun run db:migrate:aggregates` | Migra agregados            |
| `bun run db:cleanup-phantoms`   | Limpia registros huérfanos |

---

## 7. Referencias

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Guía de Servicios](./SERVICES-GUIDE.md)
