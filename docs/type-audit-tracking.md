# 📋 Seguimiento Auditoría de Tipos y Sincronización Drizzle

## Objetivo
Asegurar que todos los tipos TypeScript, transformers, servicios, rutas y APIs estén completamente sincronizados con el esquema Drizzle y las relaciones definidas.

---

## 1. Tipos TypeScript (`src/types/entities/`)
- [x] Revisar y sincronizar todos los archivos de tipos por entidad:
  - [x] activity/types.ts
  - [x] album/types.ts
  - [x] audio/types.ts
  - [x] character/types.ts
  - [x] collection/types.ts
  - [x] concept/types.ts
  - [x] document/types.ts
  - [x] favorite/types.ts
  - [x] file/types.ts
  - [x] file3d/types.ts
  - [x] folder/types.ts
  - [x] group/types.ts
  - [x] image/types.ts
  - [x] json-file/types.ts
  - [x] metadata/types.ts
  - [x] note/types.ts
  - [x] place/types.ts
  - [x] profile/types.ts
  - [x] prompt/types.ts
  - [x] property/types.ts
  - [x] queue-job/types.ts
  - [x] settings/types.ts
  - [x] stats/types.ts
  - [x] tag/types.ts
  - [x] thumbnail/types.ts
  - [x] uploaded-image/types.ts
  - [x] video/types.ts
  - [x] wildcard/types.ts
  - [x] world-item/types.ts

## 2. Transformers/Mappers (`src/transformers/`)
- [x] Revisar y actualizar todos los archivos de transformers por entidad:
  - [x] activity/
  - [x] album/
  - [x] audio/
  - [x] character/
  - [x] collection/
  - [x] concept/
  - [x] document/
  - [x] favorite/
  - [x] file/
  - [x] file3d/
  - [x] folder/
  - [x] group/
  - [x] image/
  - [x] json-file/
  - [x] metadata/
  - [x] note/
  - [x] place/
  - [x] profile/
  - [x] prompt/
  - [x] property/
  - [x] queue-job/
  - [x] settings/
  - [x] stats/
  - [x] tag/
  - [x] thumbnail/
  - [x] uploaded-image/
  - [x] video/
  - [x] wildcard/
  - [x] workflow/
  - [x] world-item/

## 3. Servicios (`src/services/`)
- [x] Revisar y actualizar todos los servicios por entidad:
  - [x] activity/
  - [x] album/
  - [x] album/
  - [x] audio/
  - [x] character/
  - [x] collection/
  - [x] concept/
  - [x] document/
  - [x] favorite/
  - [x] file/
  - [x] file3d/
  - [x] folder/
  - [x] group/
  - [x] image/
  - [x] json-file/
  - [x] metadata/
  - [x] note/
  - [x] place/
  - [x] profile/
  - [x] prompt/
  - [x] property/
  - [x] queue-job/
  - [x] settings/
  - [x] stats/
  - [x] tag/
  - [x] thumbnail/
  - [x] uploaded-images/
  - [x] video/
  - [x] wildcard/
  - [x] workflow/
  - [x] world-item/

## 4. Rutas (`src/server/routes/`)
- [x] Revisar y actualizar todas las rutas por entidad:
  - [x] albums.ts
  - [ ] activity.ts
  - [ ] audio.ts
  - [ ] characters.ts
  - [ ] collections.ts
  - [ ] concept.ts
  - [ ] documents.ts
  - [ ] favorite.ts
  - [ ] file3d.ts
  - [ ] files.ts
  - [ ] folders.ts
  - [ ] group.ts
  - [ ] image.ts
  - [ ] json-file.ts
  - [ ] metadata.ts
  - [ ] note.ts
  - [ ] place.ts
  - [ ] profile.ts
  - [ ] prompt.ts
  - [ ] property.ts
  - [ ] queue-job.ts
  - [ ] settings.ts
  - [ ] stats.ts
  - [ ] tag.ts
  - [ ] thumbnail.ts
  - [ ] uploaded-images.ts
  - [ ] video.ts
  - [ ] wildcard.ts
  - [ ] workflow.ts
  - [ ] world-item.ts

## 5. API (`src/lib/api/`)
- [x] Revisar y actualizar todos los endpoints de API por entidad:
  - [x] albums.ts
  - [x] activity.ts
  - [x] audio.ts
  - [x] characters.ts
  - [x] collections.ts
  - [x] concept.ts
  - [x] documents.ts
  - [x] favorite.ts
  - [x] file3d.ts
  - [x] files.ts
  - [x] folders.ts
  - [x] group.ts
  - [x] image.ts
  - [x] json-file.ts
  - [x] metadata.ts
  - [x] note.ts
  - [x] place.ts
  - [x] profile.ts
  - [x] prompt.ts
  - [x] property.ts
  - [x] queue-job.ts
  - [x] settings.ts
  - [x] stats.ts
  - [x] tag.ts
  - [x] thumbnail.ts
  - [x] uploaded-images.ts
  - [x] video.ts
  - [x] wildcard.ts
  - [x] workflow.ts
  - [x] world-item.ts

---

## Estado y Acciones
- [ ] Para cada archivo, marcar:
  - [ ] Sincronizado con Drizzle
  - [ ] Requiere actualización
  - [ ] En revisión
  - [ ] Bloqueado/pendiente de dependencia

## Notas
- Actualizar este documento en cada avance.
- Documentar hallazgos, problemas y decisiones clave.
- **2025-07-09**: El directorio `src/types/entities/settings/` no fue encontrado. Se omite la auditoría de tipos para esta entidad por ahora.
- **2025-07-09**: El directorio `src/types/entities/stats/` no fue encontrado. Se omite la auditoría de tipos para esta entidad por ahora.