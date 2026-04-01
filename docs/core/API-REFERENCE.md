# Referencia de API

Esta referencia organiza la API por **familias funcionales**. El backend real incluye rutas de negocio, soporte operativo, previews, streams y utilidades de debug.

## 1. Base y convenciones

### Base URL

- Desarrollo local: `http://localhost:4000`
- Base API: `http://localhost:4000/api`

### Endpoints fuera de `/api`

- `GET /health`
- redirección de compatibilidad desde `/search` hacia `/api/search`

### Formatos de respuesta

La API devuelve principalmente:

- JSON
- binarios (originales, thumbnails)
- SVG de preview
- streams SSE en endpoints específicos

## 2. Salud y sistema

### Salud

- `GET /health`

### Sistema y operación

- `GET /api/system/*`
- `GET /api/stats`
- `GET /api/activity`
- `GET /api/queue/*`

Estas rutas sirven para estado operativo, métricas y utilidades del sistema.

## 3. Carpetas

Base: `/api/folders`

### Endpoints principales observados en imágenes

- `GET /`
- `GET /tree`
- `GET /root`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `GET /:id/ancestors`
- `POST /:id/favorite`
- `GET /:id/files`
- `GET /:id/files/stats`
- `GET /:id/preview`
- `POST /reindex-all`
- `POST /:id/reindex`
- `POST /reindex` (legacy/compatibilidad)

### Rol de esta familia

- navegación y estructura de carpetas,
- previews visuales de carpeta,
- acceso a contenido agregado,
- reindexado por carpeta o global.

## 4. Imágenes

Base: `/api/images`

### Endpoints principales observados

- `GET /`
- `GET /favorites`
- `GET /by-hash/:hash`
- `GET /folder/:folderId`
- `GET /folder/:folderId/count`
- `POST /`
- `GET /:id/stats`
- `PATCH /:id`
- `POST /:id/favorite`
- `POST /:id/tags`
- `POST /batch/favorite`
- `DELETE /:id`
- `DELETE /batch`
- `POST /:id/thumbnail/generate`
- `GET /:id/thumbnail`
- `GET /:id/content`
- `GET /:id/original`
- `GET /:id`

### Qué cubre

- CRUD de imágenes,
- favoritos y operaciones batch,
- thumbnails y original,
- consultas por carpeta, hash y stats.

## 5. Videos y audio

### Videos

Base: `/api/videos`

Incluye operaciones de listado, detalle, favoritos, borrado y endpoints asociados al dominio video.

### Audio

Base: `/api/audio`

Endpoints observados en `audios.effect.ts`:

- `GET /`
- `GET /favorites`
- `GET /stats/format`
- `GET /by-hash/:hash`
- `GET /folder/:folderId`
- `GET /folder/:folderId/count`
- `GET /:id/waveform`
- `GET /:id`
- `GET /:id/stats`
- `POST /`
- `POST /:id/favorite`
- `POST /batch/favorite`
- `PATCH /:id`
- `DELETE /:id`
- `DELETE /batch`

### Preview especializado de audio

Además existe:

- `GET /api/audio-waveforms/:id/waveform`
- `GET /api/audio-waveforms/:id/info`
- `GET /api/audio-waveforms/:id/waveform/preview`

## 6. Entidades organizativas

### Álbumes

Base: `/api/albums`

Patrón observado:

- listar,
- obtener por id,
- crear,
- actualizar,
- eliminar,
- añadir/quitar relaciones,
- consultar contenido.

### Colecciones

Base: `/api/collections`

Patrón equivalente a álbumes.

### Grupos, wildcards, notas, propiedades, world-items

Base montada a través de `secondary-services.effect.ts`:

- `/api/groups`
- `/api/wildcards`
- `/api/notes`
- `/api/properties`
- `/api/world-items`

## 7. Worldbuilding

### Characters

Base: `/api/characters`

Patrón observado:

- listar,
- detalle,
- crear,
- actualizar,
- borrar,
- favoritos,
- relaciones con imágenes u otras entidades.

### Places y concepts

Bases:

- `/api/places`
- `/api/concepts`

### Prompts

Base:

- `/api/prompts`

Estas tres familias salen desde `worldbuilding.effect.ts`.

## 8. Documentos, JSON, 3D y uploaded images

La familia `file-services.effect.ts` monta varias sub-APIs.

### 3D

Base: `/api/file3ds`

- listado,
- detalle,
- CRUD,
- `GET /:id/thumbnail`

### Documents

Base: `/api/documents`

- listado,
- detalle,
- CRUD,
- `GET /:id/preview`
- `GET /:id/images`

### JSON Files

Base: `/api/json-files`

- listado,
- detalle,
- CRUD,
- `GET /:id/preview`
- `GET /:id/images`

### Uploaded images

Base: `/api/uploaded-images`

- `GET /stats`
- `GET /`
- `GET /:id`
- `POST /upload`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

## 9. Filesystem y descarga

### Filesystem

Base: `/api/files`

Endpoints observados:

- `GET /directory/:path`
- `POST /directory`
- `PUT /rename`
- `POST /copy`
- `POST /move`
- `GET /content`

### Descargas

Base: `/api/download`

Operaciones observadas:

- `POST /`
- `GET /`

## 10. Search

Base: `/api/search`

### Endpoints observados

- `GET /`
- `GET /images`
- `GET /fts`

### Comportamiento

- búsqueda global por query,
- búsqueda específica de imágenes,
- búsqueda FTS sobre archivos.

## 11. Metadata y thumbnails

### Metadata

Bases:

- `/api/metadata`
- `/api/metadata-advanced`

Operaciones observadas:

- actualización puntual o masiva,
- extracción/diagnóstico avanzado desde path u objeto.

### Thumbnails

Bases:

- `/api/thumbnails`
- `/api/thumbnails/unified`
- `/api/json`
- `/api/3d`

El sistema de previews está repartido: no todo sale del mismo router.

## 12. Favoritos, settings, profiles y eventos

### Favoritos

Base: `/api/favorites`

### Settings

Base: `/api/settings`

### Profiles

Base: `/api/profiles`

### Events

Base: `/api/events`

Operaciones observadas incluyen también `GET /stream`, útil para escenarios tipo SSE/eventing.

## 13. Reindex y logs operativos

### Reindex incremental

Base: `/api/reindex`

### Logs de reindex

Base: `/api/reindex-logs`

Endpoints observados:

- `GET /stats`
- `GET /errors`
- `GET /warnings`
- `GET /summary`
- `POST /cleanup`
- `GET /recent`

## 14. Debug y testing interno

El backend expone rutas auxiliares que no deben confundirse con la API de negocio principal.

Bases relevantes:

- `/api/debug`
- `/api/debug-entity-types`
- `/api/test-characters`

Estas rutas son útiles para desarrollo y diagnóstico, pero no representan la superficie “limpia” del producto.

## 15. Convenciones prácticas para consumidores internos

- Esperar mezcla de JSON, SVG y binarios.
- Revisar si un endpoint devuelve `data`, `pagination` o binario puro.
- Distinguir rutas de dominio frente a rutas técnicas.
- Confirmar si una operación ya tiene soporte batch o preview especializado antes de crear otra.

## 16. Relación con la documentación restante

- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./SERVICES-GUIDE.md`](./SERVICES-GUIDE.md)
- [`./IMPLEMENTATION-DETAILS.md`](./IMPLEMENTATION-DETAILS.md)
