# Detalles de implementación

Este documento describe **cómo están implementados los sistemas más importantes del proyecto**. No sustituye a los archivos fuente; funciona como una guía de lectura para entender el comportamiento real del sistema.

## 1. Ingesta y mapeo de archivos

La ingestión gira alrededor de `src/services/file-entity-mapper/`.

### Componentes clave

- `core.service.ts`
- `file-entity-mapper.service.ts`
- `processors/` por tipo de archivo
- `utils/` para hash, métricas e identificación

### Pipeline conceptual

```mermaid
flowchart TD
    A[Archivo físico] --> B[Pre-check y tipo]
    B --> C[Hash y duplicados]
    C --> D[Entidad base en DB]
    D --> E[Procesador especializado]
    E --> F[Metadata]
    F --> G[Thumbnail / preview]
```

### Responsabilidades

- decidir el tipo de entidad a partir de extensión/MIME,
- evitar duplicados por hash cuando aplica,
- persistir entidad base,
- delegar metadata al procesador correcto,
- generar preview o thumbnail asociado.

## 2. Reindexado

El sistema de reindexado no es una sola función; combina varias capas.

### Piezas relevantes

- `src/services/folder/reindex/folder-reindex.service.ts`
- `src/services/folder/reindex/reindex-incremental.service.effect.ts`
- `src/services/folder/reindex/reindex-phases/`
- rutas en `src/server/routes/folders.effect.ts`
- rutas auxiliares en `src/server/routes/api/reindex-incremental.ts`

### Tipos de flujo

#### Reindexado estructurado

Se usa desde rutas como:

- `POST /api/folders/reindex-all`
- `POST /api/folders/:id/reindex`

Este flujo está orientado a la ejecución “completa” y a la emisión de progreso.

#### Reindexado incremental

La implementación Effect-TS compara hashes y tamaños almacenados con el estado actual, intentando evitar trabajo innecesario.

Desde la revisión 2026-05-08, la resolución de subcarpetas usa recorrido iterativo con mapa de hijos. Esto evita recursion innecesaria, reduce trabajo repetido y protege mejor contra estructuras anómalas.

### Qué hace de verdad

- obtiene carpetas objetivo,
- resuelve subcarpetas si corresponde,
- recoge archivos persistidos por tipo,
- delega detección de cambios a `content-hash.service`,
- actualiza hashes/estado de entidades cambiadas,
- emite progreso hacia el frontend.

## 3. Sistema de thumbnails y previews

El proyecto usa varias rutas y servicios especializados, no un único mecanismo monolítico.

### Entradas principales

- `src/server/routes/thumbnails.effect.ts`
- `src/server/routes/thumbnails-unified.ts`
- `src/server/routes/json-thumbnails.ts`
- `src/server/routes/audio-waveforms.ts`
- `src/server/routes/3d-thumbnails.ts`
- `src/services/thumbnail/`

### Realidad operativa

- imágenes: thumbnail u original según endpoint,
- audio: waveform y datos de preview,
- JSON: preview legible,
- 3D: thumbnail/info especializado,
- carpetas: preview SVG compuesto con media reciente.

Los SVG generados para documentos, JSON y modelos 3D deben escapar cualquier texto proveniente de nombres de archivo o metadata antes de interpolarlo. El servicio unificado centraliza colores OKLCH en constantes para mantener coherencia visual y evitar hex hardcodeados en previews nuevas.

### Observación importante

La capa de previews está distribuida por tipo de contenido. Documentarla como “un solo servicio de thumbnails” sería engañoso; hay un servicio unificado, pero convive con rutas y generadores específicos.

## 4. Búsqueda

La búsqueda principal vive en `src/server/routes/search.effect.ts`.

### Endpoints clave

- `GET /api/search`
- `GET /api/search/images`
- `GET /api/search/fts`

### Comportamiento

- `performSearch` resuelve búsqueda global por tipo y paginación.
- `searchFilesFts` intenta usar FTS y puede degradar a fallback.
- `SEARCH_FTS_REQUIRE=1` obliga el uso de FTS cuando se necesite comportamiento estricto.

### Consecuencia práctica

La búsqueda tiene dos modos conceptuales:

1. **búsqueda funcional y flexible**, que puede caer a LIKE,
2. **búsqueda explícitamente FTS**, que puede fallar si el entorno no la soporta.

## 5. Operaciones de archivos

La base de operaciones físicas pasa por:

- `src/server/routes/files.effect.ts`
- `src/services/file/`

### Capacidades relevantes

- resolver el contenido de directorios autorizados,
- consultar contenido de archivos,
- descargar recursos,
- reubicar assets autorizados de forma individual,
- informar el subconjunto confirmado cuando una serie de movimientos se interrumpe.

No hay un ejecutor local para copiar, renombrar, borrar o mover rutas crudas, ni controles de undo/redo basados en rutas. Esas capacidades requieren un contrato durable del servidor antes de volver a exponerse.

Este sistema alimenta tanto funciones de mantenimiento como operaciones de UI avanzadas.

### Descarga y contenido binario

- `GET /api/download?path=...` descarga directamente el archivo.
- `POST /api/download` conserva compatibilidad para clientes que envian `{ "path": "..." }`.
- Ambos flujos usan el mismo servicio Effect y devuelven `Content-Disposition` seguro, `Content-Length`, `Content-Type` y `X-Content-Type-Options: nosniff`.
- `/api/files/content` sirve contenido inline con MIME inferido por extensión y `nosniff`.

## 6. Selección y operaciones autorizadas

### Selección

Se apoya en Zustand y stores como:

- `selection.store.ts`
- `unified-file-manager.store.ts`

### Operaciones de archivos

Las mutaciones de archivos parten de una referencia de asset autorizada. La reubicación mantiene journal y
compensación por asset; el cliente informa el subconjunto confirmado si una serie se corta. No hay una cola local de
rutas físicas ni controles de undo/redo hasta que el servidor aporte una semántica durable para ellos.

## 7. Frontend: navegación y viewer

### Navegación

El router expone una gran cantidad de vistas lazy/eager bajo `MainLayout`.

### File browser

El browser nuevo vive en `src/components/features/file-browser-new/` y funciona como una capa clave para:

- navegación jerárquica,
- previews de carpeta,
- composición con wrappers,
- integración con stores y vistas.

### File viewer

`src/components/features/file-viewer/` concentra la visualización detallada. El proyecto además tiene viewers y content views específicos dentro de `components/views/*`.

El viewer 3D actual soporta GLB/GLTF, OBJ y STL. Normaliza escala/centro, aplica sombras, usa fallback de material y reinicia la escena con estado local en lugar de recargar la pagina completa.

## 8. Providers y compatibilidad interna

La composición de providers refleja una arquitectura en transición.

### Capa externa (`AppProvider`)

- `providers/theme-provider.tsx`
- `SettingsProvider`
- `QueryProvider`
- `CacheProvider`
- `FileProvider`

### Capa interna (`App.tsx`)

- `components/ui/theme-provider.tsx`
- `TooltipProvider`
- `ViewTransitionProvider`
- `FeedbackProvider`
- `ErrorBoundary`

### Qué implica

- Hay compatibilidad heredada de una migración previa.
- El estado de tema/contexto está repartido.
- Esta situación debe tratarse como deuda técnica controlada, no como error invisible.

## 9. Tauri y escritorio

### Configuración

`src-tauri/tauri.conf.json` define:

- `devUrl` apuntando al frontend local,
- bundling de recursos del backend compilado,
- ventana principal y opciones de seguridad,
- assets de iconos.

El shell cuenta con una CSP explícita y sólo conserva comandos nativos para health y el directorio de datos. A fecha de 2026-07-23 no es un paquete desktop autónomo: los recursos actuales no inician un backend empaquetado ni resuelven sus dependencias nativas. El gate de CI Windows valida la compilación Rust; la instalación limpia, el sidecar, la firma y el ciclo de vida siguen pendientes.

### Puente nativo

El código Rust en `src-tauri/src/` complementa funciones desktop. La app no reescribe la lógica de negocio en Rust; usa Rust para integración nativa, no para duplicar el backend Express.

## 10. Logging y observabilidad

### Cliente

- `src/lib/logger/client-logger.ts`

### Servidor

- `src/lib/logger/server-logger.ts`
- `src/server/middleware/logging.ts`

### Utilidades operativas

- `scripts/run-with-log.js`
- `scripts/logging-utils.js`
- `bun run logs:list`
- `bun run check:errors`

El proyecto está pensado para dejar rastro suficiente durante build, test, runtime y procesos largos.

Los scripts principales `check`, `build`, `test`, `test:e2e`, `deps:outdated`, `deps:update` y `audit` pasan por wrappers de log para dejar evidencia en `logs/`.

## 11. Testing y entorno de pruebas

### Vitest

- entorno `jsdom`,
- setup en `tests/setup.ts`,
- paralelismo desactivado por conflictos potenciales con SQLite,
- polyfills para observers y RAF,
- ajuste de pragmas SQLite al iniciar tests.

### Playwright

- levanta `bun run dev:full`,
- usa `http://localhost:5173` como base,
- corre principalmente sobre Chromium.

## 12. Tooling y scripts

### Vite+

`vite.config.ts` define:

- chunks manuales,
- proxy hacia backend,
- exclusión de módulos server-only en cliente,
- configuración de lint/fmt integrada en el ecosistema `vp`.

### Scripts relevantes

- desarrollo (`dev:*`)
- build (`build:*`)
- chequeos (`check`, `lint`, `format`, `tsc`)
- DB (`db:*`)
- logs (`logs:*`)
- Playwright (`test:e2e`, `playwright:*`)

## 13. Puntos delicados para mantenimiento

- Evitar documentar como “simple CRUD” un backend que mezcla JSON, SSE, binarios y previews.
- Distinguir claramente entre rutas de dominio y rutas de debug/operación.
- Recordar que el producto tiene coexistencia de capas heredadas y modernas.
- No asumir que todo el procesamiento multimedia pasa por una sola abstracción.

## 14. Lecturas siguientes

- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./SERVICES-GUIDE.md`](./SERVICES-GUIDE.md)
- [`./API-REFERENCE.md`](./API-REFERENCE.md)
- [`./DATABASE-SCHEMA.md`](./DATABASE-SCHEMA.md)
