# WORKPLAN — Architecture Deepening Batch (2026-05-29)

> Este batch histórico queda subordinado al programa de recuperación vigente:
> [`docs/planning/recovery/README.md`](../planning/recovery/README.md). Sus recomendaciones continúan como trabajo de
> arquitectura, pero no deben adelantarse a los gates de datos, seguridad y runtime de Waves 0–2.

Source index: `docs/architecture/architecture-review-2026-05-29.md`

## Recommendation 1 — Favorite Listing/Projection seam (HTTP)

**Status**: In progress

**Dependency notes**:

- No bloqueada.
- Desbloquea Recommendation 2 y parte de Recommendation 5.

**Concrete steps**:

1. Unificar `/images/favorites` y `/videos/favorites` para delegar en `listFavoriteEntities`.
2. Eliminar sorting/hydration duplicado en rutas cuando el seam ya lo cubra.
3. Normalizar payload de respuesta para listados de favoritos con paginación consistente.
4. Reducir surface de facades `/:id/favorite` por entidad (primero documentar contratos en uso).

**Exit criteria**:

- `images.effect.ts` y `videos.effect.ts` sin implementation duplicada de favorites listing.
- Un único module de listing favorito usado por todas las rutas listadas en la recomendación.
- Typecheck/check sin regresiones.

**Links**:

- `docs/adr/0008-favorite-listing-seam-and-facade-retirement.md`
- `src/server/utils/favorite-route.ts`

**Progress notes**:

- ✅ `src/server/routes/images.effect.ts` migrado a `listFavoriteEntities`.
- ✅ `src/server/routes/videos.effect.ts` migrado a `listFavoriteEntities`.
- ✅ Shape de response de `/images/favorites` y `/videos/favorites` convergido a `{ data, pagination }`.
- ✅ Señalización de deprecación aplicada a la matriz de facades `/:id/favorite`:
	- `albums`, `audios`, `characters`, `collections`, `concepts`, `folders`, `images`, `places`, `prompts`, `tags`
	- `file-services.effect.ts` (`file3ds`, `documents`, `jsonFiles`)
	- `secondary-services.effect.ts` (`groups`, `wildcards`, `notes`, `properties`, `worldItems`)
- ⏳ Pendiente: migración de consumidores al endpoint canónico `/api/favorites/toggle` y posterior retiro de rutas facade.
- 📋 Matriz inicial de facades `/:id/favorite` detectadas (retirement backlog):
	- `albums.effect.ts`
	- `audios.effect.ts`
	- `characters.effect.ts`
	- `collections.effect.ts`
	- `concepts.effect.ts`
	- `folders.effect.ts`
	- `images.effect.ts`
	- `places.effect.ts`
	- `prompts.effect.ts`
	- `file-services.effect.ts` (`file3ds`, `documents`, `jsonFiles`)
	- `secondary-services.effect.ts` (`groups`, `wildcards`, `notes`)

---

## Recommendation 2 — Split `worldbuilding.effect` by capability

**Status**: In progress

**Dependency notes**:

- Requiere Recommendation 1 para reutilizar seam favorito consolidado.

**Concrete steps**:

1. Extraer `places` a `src/server/routes/places.effect.ts`.
2. Extraer `concepts` a `src/server/routes/concepts.effect.ts`.
3. Extraer `prompts` a `src/server/routes/prompts.effect.ts`.
4. Mantener adapters compartidos para patrón de list + favorite.
5. Actualizar registro en `src/server/index.ts`.

**Exit criteria**:

- `worldbuilding.effect.ts` eliminado o reducido a compatibilidad mínima temporal.
- Cada capability con module propio y tests/validación funcional.

**Links**:

- `src/server/routes/worldbuilding.effect.ts`

**Progress notes**:

- ✅ `src/server/routes/places.effect.ts` ahora contiene rutas reales.
- ✅ `src/server/routes/concepts.effect.ts` ahora contiene rutas reales.
- ✅ `src/server/routes/prompts.effect.ts` ahora contiene rutas reales.
- ✅ `src/server/routes/worldbuilding.effect.ts` reducido a facade transicional.
- ✅ `src/server/index.ts` migrado a imports directos por capacidad.

---

## Recommendation 3 — `FileSystemSync` real seam with adapters

**Status**: In progress

**Dependency notes**:

- Independiente de Recommendation 2.
- Prioridad alta por impacto en locality y testability.

**Concrete steps**:

1. Definir adapter de scanner y adapter de persistence para `FileSystemSync`.
2. Implementar adapter production para FS + DB.
3. Implementar adapter in-memory para tests.
4. Refactorizar `file-sync.service.ts` y `folder-sync.ts` para delegar en seam.
5. Reducir lógica de cleanup en cascada fuera del orchestrator principal.

**Exit criteria**:

- `FileSystemSync` con >=2 adapters reales.
- Orquestación central sin mezcla dispersa de detalles DB/FS en callers.

**Links**:

- `docs/adr/0009-filesystem-sync-real-seam-with-adapters.md`
- `src/lib/filesystem/sync-interface.ts`

**Progress notes**:

- ✅ Adapter producción: `src/lib/filesystem/adapters/fs-db-filesystem-sync.adapter.ts`.
- ✅ Adapter in-memory: `src/lib/filesystem/adapters/in-memory-filesystem-sync.adapter.ts`.
- ✅ Punto de acceso seam: `src/lib/filesystem/sync-adapter.ts`.
- ✅ Migrados callers operativos clave a seam:
	- `src/lib/filesystem/folder-stats.ts`
	- `src/services/folder/reindex/reindex-phases/phase5-indexing.ts`
- ⏳ Pendiente: seguir consolidando dependencias directas restantes en servicios de sync legacy.

---

## Recommendation 4 — Canonical App Shell module

**Status**: In progress

**Dependency notes**:

- Puede correr en paralelo parcial con Recommendation 1 y 3.

**Concrete steps**:

1. Consolidar composición en un module canónico de App Shell.
2. Reducir wiring repartido entre `main.tsx`, `App.tsx`, `app-provider.tsx`.
3. Mantener providers actuales como adapters internos.

**Exit criteria**:

- Una interface única de composición de runtime.
- Menos puntos de cambio para capacidades transversales.

**Progress notes**:

- ✅ Creado `src/platform/app-shell/app-shell.tsx` como seam canónico de composición.
- ✅ `src/main.tsx` migrado para bootstrap vía `AppShell`.

---

## Recommendation 5 — Content delivery module

**Status**: In progress

**Dependency notes**:

- Recomendado después de Recommendation 1.

**Concrete steps**:

1. Crear module para servir binarios con mime/headers/error mapping consistente.
2. Migrar `images.effect.ts` y `videos.effect.ts` al seam común.
3. Remover `require(...)` inline en handlers.

**Exit criteria**:

- Handlers de contenido finos y homogéneos.
- Reglas HTTP concentradas en un module profundo.

**Progress notes**:

- ✅ Creado `src/server/utils/content-delivery.ts`.
- ✅ `images.effect.ts` y `videos.effect.ts` usan `sendEffectHttpError`.
- ✅ Eliminado `require('fs')` inline en `videos.effect.ts`.

---

## Recommendation 6 — Route registry module

**Status**: In progress

**Dependency notes**:

- Última en secuencia (tras split de worldbuilding y consolidación de seams).

**Concrete steps**:

1. Definir catálogo declarativo de routes por capacidad.
2. Reducir `src/server/index.ts` a bootstrap mínimo.
3. Alinear con ownership por contexto.

**Exit criteria**:

- Registro manual largo eliminado o minimizado.
- Wiring verificable desde un seam único.

**Progress notes**:

- ✅ Creado `src/server/route-registry.ts`.
- ✅ `src/server/index.ts` ahora delega en `registerRoutes(app)`.

---

## Batch execution order

1. Recommendation 1
2. Recommendation 2
3. Recommendation 3
4. Recommendation 5
5. Recommendation 4
6. Recommendation 6

## Change log

- 2026-05-29: workplan inicial creado desde recomendaciones aceptadas.
- 2026-05-29: avances de implementación en recomendaciones 1, 2 y 3 reflejados.
- 2026-05-29: avances de implementación en recomendaciones 4, 5 y 6 reflejados.
- 2026-05-29: convergido contrato de favoritos (images/videos), migrados callers operativos a `FileSystemSync` seam y añadida matriz inicial de facades `/:id/favorite`.
- 2026-05-29: iniciado y ampliado retirement de facades `/:id/favorite` con helper común de deprecación y headers HTTP de transición sobre la matriz principal de rutas.
