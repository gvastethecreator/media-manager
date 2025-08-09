# Plan de Acción: Rendimiento con Cambios Mínimos (Enfoque No-Disruptivo)

Estado base verificado: Express (REST+SSE), Drizzle + @libsql/client (SQLite file: ./db.sqlite), sharp/libvips en servidor, grid virtualizada con @tanstack/react-virtual, Tauri presente pero sin core nativo (USN/FTS/Thumbs) aún.

Objetivo: Mejorar búsqueda, thumbnails y scroll sin reescrituras profundas. Preparar flags para futura conmutación a Tauri.

---

## 1) Búsqueda Instantánea con FTS5 (SQLite)

- Entregable: Tabla virtual FTS5 + triggers y endpoint `/api/search/fts` con <50–80 ms p95 en 100k filas.
- Cambios:
  - Migración Drizzle (raw SQL) para crear `files_fts` y triggers de mantenimiento.
  - Índices auxiliares en `File` si aplica (name/path/mtime).
  - Endpoint Express `GET /api/search/fts?q=...&limit=...&offset=...` que retorna IDs + datos.
- Archivos involucrados:
  - `src/lib/drizzle/schema/index.ts` (si se centraliza SQL; preferible migración en scripts/db o seeds de Drizzle)
  - `scripts/db/migrations/*` (nueva migración FTS5)
  - `src/server/routes/search.ts` (nuevo handler FTS o ruta separada `search-fts.ts`)
  - `src/lib/api/search.ts` (hook TanStack Query `useFtsSearch`)
- SQL base (referencia):
  - `CREATE VIRTUAL TABLE files_fts USING fts5(name, path, tagsText, content='File', content_rowid='id');`
  - Triggers: insert/update/delete para sincronizar FTS con `File`.
- Métricas:
  - p50/p95 de consulta, rows escaneadas, tiempo total; logs en `/logs`.
- Riesgos/Mitigación:
  - Si @libsql/client limita FTS5 en file:, fallback a índices + LIKE y plan de conmutar a SQLite nativo Tauri después (flag).

---

## 2) Thumbnails Estables con Cache en Disco + Mem y Prioridad

- Entregable: Cache en `public/.cache/thumbs/{size}/{hash}.webp`, p-queue en servidor, headers HTTP de caché, TTFB bajo para hits.
- Cambios:
  - Servicio thumbs: usar `sharp` con tamaños fijos (128/256/512), quality 70–80, WebP.
  - Hash = xxhash64(path|mtime|size|bucket). Carpeta por tamaño.
  - `p-queue` con concurrencia = núcleos−1. Prioridad por viewport (param opcional `prio`).
  - Respuesta con `ETag`, `Last-Modified`, `Cache-Control: public, max-age=31536000, immutable`.
  - LRU en memoria (cap 200–500) para respuestas recientes.
- Archivos:
  - `src/server/routes/thumbnails.ts` (mejoras de pipeline/headers)
  - `src/services/image/image.service.ts` (si centraliza resize)
  - `src/lib/utils/hash.ts` (utilidad de hashing estable)
  - `src/config/thumbs.ts` (constantes tamaños/calidad/cache)
- Métricas:
  - Hit-rate cache (mem/disk), TTFB p50/p95, concurrencia activa.
- Riesgos:
  - Espacio en disco → política LRU por MB y limpieza periódica en el arranque.

---

## 3) Grid UI: Prefetch Inteligente + Abort y Ajustes de <img>

- Entregable: Menos stutter en scroll; descargar solo lo necesario; evitar animaciones en listas virtualizadas.
- Cambios:
  - Prefetch por ventana: fila visible ±2 → solicitar thumbs con prioridad, el resto low.
  - AbortController: cancelar peticiones al moverse el viewport.
  - En <img>: `loading="lazy"`, `decoding="async"`, `fetchpriority="high|low"` según proximidad.
  - Quitar Framer Motion por ítem en virtualización (mantener solo en mount inicial).
- Archivos:
  - `src/components/features/file-browser/views/grid-view.tsx` (prefetch, abort, props de <img>)
  - `src/components/cards/entity-card.tsx` (asegurar uso de props de <img> y memo estable)
  - `src/hooks/use-grid-view-config.ts` (si se requiere ajustar buffer/overscan)
- Métricas:
  - FPS estimado (Performance), pendientes XHR/Fetch, duración media por frame.

---

## 4) Scan-Lite (sin USN): Batches y PRAGMAs

- Entregable: Endpoint para escaneo bajo demanda con batches (1k–5k) y transacciones; progreso simple.
- Cambios:
  - `POST /api/system/scan-lite { dir }`: recorrido BFS (fs.promises), agrupar inserts por lotes con transacciones.
  - PRAGMAs al inicio del proceso/backend: `journal_mode=WAL`, `synchronous=NORMAL`, `temp_store=MEMORY`.
  - Progreso vía SSE existente o polling.
- Archivos:
  - `src/server/routes/system.ts` (handler scan-lite)
  - `src/services/file/file.service.ts` (reutilizar lectura/normalización)
- Métricas:
  - Archivos/s, duración total para 100k en SSD, distribución por lote.

---

## 5) Telemetría Ligera + Flags de Proveedor

- Entregable: Logs y panel dev con métricas clave; flags para futura conmutación a Tauri.
- Cambios:
  - Telemetría: tiempos de búsqueda FTS, hit-rate thumbs, FPS estimado; mostrar en dev panel o consola con prefijo claro.
  - Flags:
    - `THUMBS_PROVIDER = "express" | "tauri"`
    - `SCAN_PROVIDER   = "express" | "tauri"`
  - No cambio funcional si están en "express" (default).
- Archivos:
  - `src/config/flags.ts`
  - `src/components/settings/system/*` (toggle visible solo dev si se desea)

---

## 6) Roadmap 10 Días (No-Disruptivo)

- Día 1: Migración FTS5 (tabla + triggers) y script de prueba. Logs de tiempo en `/logs`.
- Día 2: Endpoint `/api/search/fts` con paginación. Hook `useFtsSearch`. Benchmarks p50/p95.
- Día 3: Cache disco thumbs + hashing + estructura carpetas. Headers HTTP.
- Día 4: `p-queue` para thumbs + control de concurrencia/prioridad.
- Día 5: Prefetch UI (ventana ±2), AbortController, `decoding/fetchpriority`.
- Día 6: LRU memoria (cap) y telemetría de hit-rate.
- Día 7: Scan-lite por lotes + PRAGMAs + progreso simple.
- Día 8: Panel dev (opcional) con métricas clave. Ajustes finos de buffers.
- Día 9: Feature flags (providers) + docs.
- Día 10: Limpieza de animaciones en grid, revisión con Profiler y postmortem.

---

## Tareas Detalladas por Componente

### A) Base de Datos / FTS
- [ ] Crear migración FTS5 (tabla virtual, triggers).
- [ ] Añadir índices auxiliares en `File` si procede.
- [ ] Probar consultas MATCH con límites y ranking; medir.

### B) API Express / Search
- [ ] Nueva ruta `/api/search/fts` con validación de parámetros, LIMIT/OFFSET y orden por rank.
- [ ] Hook `useFtsSearch` (TanStack Query) y clave de cache estable.

### C) Thumbnails
- [ ] Cache en disco con estructura por tamaño y hash.
- [ ] Encapsular sharp con retries y timeouts razonables.
- [ ] `p-queue` con concurrencia dinámica (cores−1) y prioridad.
- [ ] ETag/Last-Modified/Cache-Control en respuestas.
- [ ] LRU en memoria con límites y eviction.

### D) UI Grid
- [ ] Añadir prefetch por ventana usando virtualItems.
- [ ] Implementar AbortController por item/ventana.
- [ ] Ajustar `<img>` con `loading`, `decoding`, `fetchpriority`.
- [ ] Desactivar animación por ítem en listas virtualizadas.

### E) Scan-Lite
- [ ] Endpoint POST `/api/system/scan-lite` que procesa en lotes con transacciones.
- [ ] PRAGMAs de rendimiento aplicados en arranque backend.
- [ ] Barra de progreso (SSE o polling) y logs de rendimiento.

### F) Telemetría + Flags
- [ ] Registro de tiempos (search), hit-rate (thumbs), FPS (UI dev).
- [ ] Flags de proveedor `THUMBS_PROVIDER` y `SCAN_PROVIDER` (default: express).

---

## Archivos a Crear/Editar (lista guía)

- Crear
  - `src/server/routes/search-fts.ts` (si prefieres separar) o ampliar `routes/search.ts`.
  - `scripts/db/migrations/20xx_xx_xx_fts5.sql` (o migración TS que ejecute SQL raw).
  - `src/config/thumbs.ts` (constantes: sizes, quality, paths, limits).
  - `src/lib/utils/hash.ts` (xxhash/alternativa estable; si no, crypto/sha1 temporal).
  - `src/config/flags.ts` (providers y defaults).
- Editar
  - `src/server/routes/thumbnails.ts` (headers, p-queue, cache disco/mem).
  - `src/components/features/file-browser/views/grid-view.tsx` (prefetch/abort/props img).
  - `src/components/cards/entity-card.tsx` (usar props img y memo estable).
  - `src/server/routes/system.ts` (scan-lite por lotes) o nuevo archivo `system-scan-lite.ts` y montar ruta.
  - `src/lib/drizzle/index.ts` o `scripts/db/*` para PRAGMAs (si aplica al runtime).

---

## Métricas y Validación (Quality Gates)
- Build/Lint/Types: `bun run tsc`, `bun run biome` → PASS.
- Benchmarks: registrar p50/p95 de `/api/search/fts`, hit-rate thumbs, TTFB.
- Smoke UI: scroll 50k con virtualización; sin caídas notorias de FPS; sin memory leaks.

---

## Riesgos y Alternativas
- FTS5 no funcional con @libsql/client en file: → fallback a índices + LIKE y planear conmutación a SQLite nativo (Tauri) más adelante.
- Disk cache crecimiento → LRU por MB y limpieza en arranque.
- Concurrencia de thumbs → topes y backpressure con p-queue.

---

## Preparación para Fase Tauri (futuro)
- Mantener flags `THUMBS_PROVIDER` y `SCAN_PROVIDER`.
- Diseñar interfaces IPC equivalentes a `/api/search/fts`, `/api/thumbnails`, `/api/system/scan-lite` para drop-in replacement.

---

## Checklist de Cierre
- [ ] Search FTS entrega <80 ms p95 en dataset grande.
- [ ] Thumbs: hit-rate >85%, headers correctos, sin colas saturadas.
- [ ] UI: scroll fluido, sin animación por item, prefetch efectivo.
- [ ] Scan-lite: 100k ≤90 s (SSD), logs claros.
- [ ] Flags y docs listos para migración posterior a Tauri.
