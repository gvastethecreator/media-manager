# Referencia de API

## Image Manager - Endpoints REST

**Versión:** 0.1.0  
**Base URL:** `http://localhost:4000/api`  
**Última Actualización:** 31 de diciembre de 2025

---

## 1. Visión General

La API REST de Image Manager proporciona acceso completo a todas las funcionalidades del sistema. Todas las respuestas son en formato JSON.

### 1.1 Convenciones

- **Verbos HTTP:** GET (lectura), POST (creación), PUT (actualización), DELETE (eliminación)
- **Códigos de Estado:** 200 (éxito), 201 (creado), 400 (bad request), 404 (no encontrado), 500 (error)
- **Paginación:** `?page=1&pageSize=50`
- **Ordenamiento:** `?sortBy=createdAt&sortOrder=desc`
- **Filtrado:** `?folderId=xxx&isFavorite=true`

### 1.2 Headers

```http
Content-Type: application/json
Accept: application/json
```

---

## 2. Health Check

### `GET /health`

Verifica el estado del servidor.

**Respuesta:**

```json
{
	"status": "ok",
	"timestamp": "2025-12-31T10:00:00.000Z",
	"uptime": 3600
}
```

---

## 3. Folders (Carpetas)

### `GET /api/folders`

Lista todas las carpetas indexadas.

**Query Params:**

| Param      | Tipo    | Descripción               |
| ---------- | ------- | ------------------------- |
| `parentId` | string  | Filtrar por carpeta padre |
| `isRoot`   | boolean | Solo carpetas raíz        |
| `depth`    | number  | Nivel de profundidad      |

**Respuesta:**

```json
{
	"folders": [
		{
			"id": "folder_123",
			"name": "Mi Carpeta",
			"path": "/home/user/images",
			"parentId": null,
			"depth": 0,
			"isRoot": true,
			"isWatched": true,
			"lastIndexedAt": "2025-12-31T10:00:00.000Z",
			"_count": {
				"images": 150,
				"videos": 20,
				"subfolders": 5
			}
		}
	],
	"total": 10
}
```

### `GET /api/folders/:id`

Obtiene una carpeta por ID.

### `POST /api/folders`

Crea/registra una nueva carpeta para indexar.

**Body:**

```json
{
	"path": "/home/user/new-folder",
	"isRoot": true,
	"isWatched": false
}
```

### `POST /api/folders/:id/reindex`

Reindexa una carpeta (SSE stream).

**Respuesta:** Event Stream con progreso:

```
event: progress
data: {"phase": "scanning", "current": 50, "total": 200, "message": "Escaneando..."}

event: progress
data: {"phase": "processing", "current": 100, "total": 200, "message": "Procesando thumbnails..."}

event: complete
data: {"success": true, "stats": {"added": 50, "updated": 10, "removed": 5}}
```

### `DELETE /api/folders/:id`

Elimina una carpeta del índice (no borra archivos físicos).

### `GET /api/folders/:id/tree`

Obtiene el árbol de subcarpetas.

### `GET /api/folders/:id/contents`

Obtiene el contenido completo de una carpeta (archivos + subcarpetas).

---

## 4. Images (Imágenes)

### `GET /api/images`

Lista imágenes con filtros y paginación.

**Query Params:**

| Param        | Tipo            | Descripción                        |
| ------------ | --------------- | ---------------------------------- |
| `folderId`   | string          | Filtrar por carpeta                |
| `page`       | number          | Página (default: 1)                |
| `pageSize`   | number          | Elementos por página (default: 50) |
| `sortBy`     | string          | Campo de ordenamiento              |
| `sortOrder`  | "asc" \| "desc" | Dirección                          |
| `search`     | string          | Búsqueda por nombre                |
| `isFavorite` | boolean         | Solo favoritos                     |
| `tagIds`     | string[]        | Filtrar por tags                   |

**Respuesta:**

```json
{
	"images": [
		{
			"id": "img_123",
			"name": "imagen.jpg",
			"path": "/home/user/images/imagen.jpg",
			"hash": "abc123...",
			"size": 1024000,
			"width": 1920,
			"height": 1080,
			"thumbnail": "data:image/webp;base64,...",
			"isFavorite": false,
			"folderId": "folder_123",
			"createdAt": "2025-12-31T10:00:00.000Z",
			"_count": {
				"tags": 5,
				"albums": 2
			}
		}
	],
	"total": 150,
	"pagination": {
		"page": 1,
		"pageSize": 50,
		"totalPages": 3,
		"hasNext": true,
		"hasPrev": false
	}
}
```

### `GET /api/images/:id`

Obtiene una imagen por ID con todos sus detalles.

### `POST /api/images`

Registra una nueva imagen (normalmente usado internamente durante reindex).

### `PUT /api/images/:id`

Actualiza metadatos de una imagen.

**Body:**

```json
{
	"name": "nuevo-nombre.jpg",
	"description": "Descripción actualizada",
	"isFavorite": true
}
```

### `DELETE /api/images/:id`

Elimina una imagen del índice.

### `POST /api/images/:id/thumbnail`

Regenera el thumbnail de una imagen.

### `GET /api/images/:id/tags`

Obtiene los tags de una imagen.

### `POST /api/images/:id/tags`

Añade tags a una imagen.

**Body:**

```json
{
	"tagIds": ["tag_1", "tag_2"]
}
```

### `DELETE /api/images/:id/tags/:tagId`

Elimina un tag de una imagen.

### `GET /api/images/:id/albums`

Obtiene los álbumes de una imagen.

### `POST /api/images/:id/albums`

Añade una imagen a álbumes.

**Body:**

```json
{
	"albumIds": ["album_1", "album_2"]
}
```

---

## 5. Videos

### `GET /api/videos`

Lista videos (mismos parámetros que images).

### `GET /api/videos/:id`

Obtiene un video por ID.

### `PUT /api/videos/:id`

Actualiza un video.

### `DELETE /api/videos/:id`

Elimina un video.

### `POST /api/videos/:id/thumbnail`

Genera thumbnail de un video (extrae frame).

---

## 6. Audio

### `GET /api/audio`

Lista archivos de audio.

### `GET /api/audio/:id`

Obtiene un archivo de audio.

### `GET /api/audio/:id/waveform`

Obtiene datos de waveform para visualización.

---

## 7. Tags

### `GET /api/tags`

Lista todos los tags.

**Query Params:**

| Param      | Tipo   | Descripción           |
| ---------- | ------ | --------------------- |
| `category` | string | Filtrar por categoría |
| `parentId` | string | Tags hijos de         |
| `search`   | string | Búsqueda por nombre   |

**Respuesta:**

```json
{
	"tags": [
		{
			"id": "tag_123",
			"name": "Paisaje",
			"description": "Fotografías de paisajes",
			"color": "#10b981",
			"emoji": "🏔️",
			"category": "nature",
			"parentId": null,
			"isFavorite": false,
			"_count": {
				"images": 45,
				"videos": 10
			}
		}
	],
	"total": 25
}
```

### `GET /api/tags/:id`

Obtiene un tag por ID.

### `POST /api/tags`

Crea un nuevo tag.

**Body:**

```json
{
	"name": "Nuevo Tag",
	"description": "Descripción del tag",
	"color": "#3b82f6",
	"emoji": "🎨",
	"category": "art"
}
```

### `PUT /api/tags/:id`

Actualiza un tag.

### `DELETE /api/tags/:id`

Elimina un tag.

### `GET /api/tags/:id/images`

Obtiene imágenes con este tag.

### `GET /api/tags/:id/videos`

Obtiene videos con este tag.

---

## 8. Albums

### `GET /api/albums`

Lista todos los álbumes.

### `GET /api/albums/:id`

Obtiene un álbum por ID con contenido.

### `POST /api/albums`

Crea un nuevo álbum.

**Body:**

```json
{
	"name": "Vacaciones 2025",
	"description": "Fotos del viaje",
	"color": "#f59e0b",
	"emoji": "🏖️"
}
```

### `PUT /api/albums/:id`

Actualiza un álbum.

### `DELETE /api/albums/:id`

Elimina un álbum.

### `POST /api/albums/:id/images`

Añade imágenes al álbum.

**Body:**

```json
{
	"imageIds": ["img_1", "img_2", "img_3"]
}
```

### `DELETE /api/albums/:id/images/:imageId`

Elimina una imagen del álbum.

---

## 9. Collections

### `GET /api/collections`

Lista todas las colecciones.

### `GET /api/collections/:id`

Obtiene una colección.

### `POST /api/collections`

Crea una colección.

### `PUT /api/collections/:id`

Actualiza una colección.

### `DELETE /api/collections/:id`

Elimina una colección.

---

## 10. Groups

### `GET /api/groups`

Lista todos los grupos.

### `GET /api/groups/:id`

Obtiene un grupo con su contenido.

### `POST /api/groups`

Crea un grupo.

### `PUT /api/groups/:id`

Actualiza un grupo.

### `DELETE /api/groups/:id`

Elimina un grupo.

### `POST /api/groups/:id/add`

Añade entidades al grupo.

**Body:**

```json
{
	"entityType": "image",
	"entityIds": ["img_1", "img_2"]
}
```

---

## 11. Characters

### `GET /api/characters`

Lista personajes.

### `GET /api/characters/:id`

Obtiene un personaje.

### `POST /api/characters`

Crea un personaje.

**Body:**

```json
{
	"name": "Elara",
	"description": "Elfa maga del bosque",
	"race": "Elf",
	"class": "Mage",
	"level": 15,
	"alignment": "Neutral Good",
	"stats": {
		"strength": 8,
		"dexterity": 14,
		"constitution": 10,
		"intelligence": 18,
		"wisdom": 16,
		"charisma": 12
	}
}
```

### `PUT /api/characters/:id`

Actualiza un personaje.

### `DELETE /api/characters/:id`

Elimina un personaje.

---

## 12. Places

### `GET /api/places`

Lista lugares.

### `GET /api/places/:id`

Obtiene un lugar.

### `POST /api/places`

Crea un lugar.

### `PUT /api/places/:id`

Actualiza un lugar.

### `DELETE /api/places/:id`

Elimina un lugar.

---

## 13. Concepts

### `GET /api/concepts`

Lista conceptos.

### `GET /api/concepts/:id`

Obtiene un concepto.

### `POST /api/concepts`

Crea un concepto.

### `PUT /api/concepts/:id`

Actualiza un concepto.

### `DELETE /api/concepts/:id`

Elimina un concepto.

---

## 14. World Items

### `GET /api/world-items`

Lista items del mundo.

### `GET /api/world-items/:id`

Obtiene un item.

### `POST /api/world-items`

Crea un item.

### `PUT /api/world-items/:id`

Actualiza un item.

### `DELETE /api/world-items/:id`

Elimina un item.

---

## 15. Prompts

### `GET /api/prompts`

Lista prompts de IA.

### `GET /api/prompts/:id`

Obtiene un prompt.

### `POST /api/prompts`

Crea un prompt.

### `PUT /api/prompts/:id`

Actualiza un prompt.

### `DELETE /api/prompts/:id`

Elimina un prompt.

---

## 16. Wildcards

### `GET /api/wildcards`

Lista wildcards.

### `GET /api/wildcards/:id`

Obtiene un wildcard.

### `POST /api/wildcards`

Crea un wildcard.

### `PUT /api/wildcards/:id`

Actualiza un wildcard.

### `DELETE /api/wildcards/:id`

Elimina un wildcard.

---

## 17. Notes

### `GET /api/notes`

Lista notas.

### `GET /api/notes/:id`

Obtiene una nota.

### `POST /api/notes`

Crea una nota.

### `PUT /api/notes/:id`

Actualiza una nota.

### `DELETE /api/notes/:id`

Elimina una nota.

---

## 18. Properties

### `GET /api/properties`

Lista propiedades.

### `GET /api/properties/:id`

Obtiene una propiedad.

### `POST /api/properties`

Crea una propiedad.

### `PUT /api/properties/:id`

Actualiza una propiedad.

### `DELETE /api/properties/:id`

Elimina una propiedad.

---

## 19. Documents

### `GET /api/documents`

Lista documentos.

### `GET /api/documents/:id`

Obtiene un documento con contenido.

### `GET /api/documents/:id/content`

Obtiene solo el contenido del documento.

---

## 20. JSON Files

### `GET /api/json-files`

Lista archivos JSON.

### `GET /api/json-files/:id`

Obtiene un archivo JSON con contenido parseado.

---

## 21. File 3D

### `GET /api/file3ds`

Lista modelos 3D.

### `GET /api/file3ds/:id`

Obtiene un modelo 3D.

### `POST /api/file3ds/:id/thumbnail`

Genera thumbnail renderizado del modelo.

---

## 22. Favorites

### `GET /api/favorites`

Lista favoritos del perfil actual.

**Query Params:**

| Param        | Tipo   | Descripción       |
| ------------ | ------ | ----------------- |
| `profileId`  | string | Perfil específico |
| `entityType` | string | Tipo de entidad   |

### `POST /api/favorites`

Marca una entidad como favorita.

**Body:**

```json
{
	"entityType": "image",
	"entityId": "img_123"
}
```

### `DELETE /api/favorites/:id`

Elimina un favorito.

---

## 23. Profiles

### `GET /api/profiles`

Lista perfiles de usuario.

### `GET /api/profiles/:id`

Obtiene un perfil.

### `POST /api/profiles`

Crea un perfil.

### `PUT /api/profiles/:id`

Actualiza un perfil.

### `DELETE /api/profiles/:id`

Elimina un perfil.

---

## 24. Settings

### `GET /api/settings`

Obtiene todas las configuraciones.

### `GET /api/settings/:key`

Obtiene una configuración específica.

### `PUT /api/settings/:key`

Actualiza una configuración.

**Body:**

```json
{
	"value": { "theme": "dark", "language": "es" }
}
```

---

## 25. Search

### `GET /api/search`

Búsqueda global en todas las entidades.

**Query Params:**

| Param   | Tipo     | Descripción          |
| ------- | -------- | -------------------- |
| `q`     | string   | Término de búsqueda  |
| `types` | string[] | Tipos a buscar       |
| `limit` | number   | Límite de resultados |

**Respuesta:**

```json
{
  "results": [
    {
      "type": "image",
      "item": { ... },
      "score": 0.95
    },
    {
      "type": "tag",
      "item": { ... },
      "score": 0.85
    }
  ],
  "total": 50
}
```

---

## 26. Stats

### `GET /api/stats`

Obtiene estadísticas globales del sistema.

**Respuesta:**

```json
{
	"totalImages": 5000,
	"totalVideos": 500,
	"totalAudios": 200,
	"totalDocuments": 100,
	"totalTags": 150,
	"totalAlbums": 25,
	"totalSize": 50000000000,
	"lastIndexed": "2025-12-31T10:00:00.000Z"
}
```

### `GET /api/stats/folder/:folderId`

Estadísticas de una carpeta específica.

---

## 27. Events (SSE)

### `GET /api/events`

Stream de Server-Sent Events para actualizaciones en tiempo real.

**Eventos:**

```
event: folder:reindex:progress
data: {"folderId": "xxx", "phase": "scanning", "progress": 50}

event: image:created
data: {"id": "img_123", "folderId": "xxx"}

event: thumbnail:generated
data: {"entityId": "img_123", "entityType": "image"}
```

---

## 28. Download

### `GET /api/download/:entityType/:entityId`

Descarga un archivo original.

### `POST /api/download/batch`

Descarga múltiples archivos como ZIP.

**Body:**

```json
{
	"items": [
		{ "type": "image", "id": "img_1" },
		{ "type": "image", "id": "img_2" }
	]
}
```

---

## 29. Thumbnails

### `GET /api/thumbnails/:entityType/:entityId`

Obtiene el thumbnail de una entidad.

### `POST /api/thumbnails/:entityType/:entityId/regenerate`

Regenera el thumbnail.

---

## 30. Queue

### `GET /api/queue`

Lista trabajos en cola.

### `GET /api/queue/:id`

Estado de un trabajo específico.

### `DELETE /api/queue/:id`

Cancela un trabajo.

---

## 31. System

### `GET /api/system/info`

Información del sistema.

**Respuesta:**

```json
{
	"version": "0.1.0",
	"nodeVersion": "22.0.0",
	"bunVersion": "1.1.0",
	"platform": "darwin",
	"arch": "arm64",
	"memory": {
		"total": 16000000000,
		"used": 8000000000
	}
}
```

### `POST /api/system/gc`

Ejecuta garbage collection.

---

## 32. Metadata

### `GET /api/metadata/:entityType/:entityId`

Obtiene metadatos de una entidad.

### `POST /api/metadata/:entityType/:entityId/extract`

Extrae metadatos (EXIF, XMP, etc.).

### `GET /api/metadata-advanced/:entityType/:entityId`

Extracción avanzada de metadatos.

---

## 33. Errores

Todos los errores siguen el formato:

```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "La entidad no fue encontrada",
		"details": {
			"entityType": "image",
			"entityId": "img_123"
		}
	}
}
```

**Códigos de Error:**

| Código              | HTTP Status | Descripción                  |
| ------------------- | ----------- | ---------------------------- |
| `VALIDATION_ERROR`  | 400         | Datos de entrada inválidos   |
| `NOT_FOUND`         | 404         | Recurso no encontrado        |
| `ALREADY_EXISTS`    | 409         | El recurso ya existe         |
| `INTERNAL_ERROR`    | 500         | Error interno del servidor   |
| `FILE_NOT_FOUND`    | 404         | Archivo físico no encontrado |
| `PERMISSION_DENIED` | 403         | Sin permisos                 |

---

## Referencias

- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Esquema de Base de Datos](./DATABASE-SCHEMA.md)
- [Guía de Servicios](./SERVICES-GUIDE.md)
