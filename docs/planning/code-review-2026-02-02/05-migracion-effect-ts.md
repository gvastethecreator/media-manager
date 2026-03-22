# Migración completa a Effect-TS — Plan y alcance

**Fecha:** 2 de febrero de 2026

## Objetivo

Completar la migración de backend a Effect-TS para lograr consistencia en validación, errores tipados, logging y observabilidad.

## Alcance

- Rutas Express (`src/server/routes/**`).
- Servicios (`src/services/**`).
- Adaptadores y middlewares (errores, logging, validación).

## Inventario preliminar (rutas)

> **Nota:** listado inicial basado en `src/server/routes/`. Validar y actualizar durante Fase 0.

### Rutas Effect-TS ya migradas

- `albums.effect.ts`
- `audios.effect.ts`
- `characters.effect.ts`
- `collections.effect.ts`
- `concepts.effect.ts`
- `file-services.effect.ts`
- `folders.effect.ts`
- `images.effect.ts`
- `places.effect.ts`
- `prompts.effect.ts`
- `secondary-services.effect.ts`
- `tags.effect.ts`
- `videos.effect.ts`
- `worldbuilding.effect.ts`

### Rutas legacy/no Effect (pendientes)

- `3d-thumbnails.ts`
- `activity.ts`
- `albums-debug.ts`
- `audio-waveforms.ts`
- `characters-debug.ts`
- `debug-entity-types.ts`
- `debug.ts`
- `dev.ts`
- `documents.ts`
- `download.ts`
- `events.ts`
- `favorites.ts`
- `file-changes.ts`
- `file-sync.ts`
- `files.ts`
- `folders/` (sub-routes)
- `json-thumbnails.ts`
- `local-files-simple.ts`
- `local-files.ts`
- `metadata-advanced-test.ts`
- `metadata-advanced.ts`
- `metadata-simple-test.ts`
- `metadata.ts`
- `profiles.ts`
- `queue.ts`
- `search.ts`
- `settings.ts`
- `stats.ts`
- `system.ts`
- `tasks.ts`
- `test-characters.ts`
- `thumbnails-unified.ts`
- `thumbnails.ts`
- `videos-thumbnail.ts`

## Fases de migración

### Fase 0 — Preparación

- Acordar contrato de errores (Effect vs null).
- Definir adaptador de errores único.
- Confirmar rutas canónicas (evitar duplicadas).

### Fase 1 — Alto impacto

- Rutas de alto tráfico y core (files, search, metadata, thumbnails, download).
- Instrumentación y logs con `serverLogger`.

### Fase 2 — Sistema y utilidades

- system, stats, profiles, queue, events.

### Fase 3 — Debug y stubs

- debug, test-characters, albums-debug, metadata-\*-test.

## Checklist por ruta

Para cada ruta:

1. Validación de input (schema Effect o Zod con wrapper).
2. Servicio en Effect (Layer + Tag).
3. Error mapping con `runEffectForExpress`.
4. Logging consistente.
5. Tests básicos de integración.

## Criterios de salida

- 0 rutas legacy en `src/server/routes`.
- 0 `console.*` en rutas productivas.
- 100% endpoints con error mapping uniforme.
