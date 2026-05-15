# Codebase Health 2026-05-08

Revision exhaustiva aplicada sobre Image Manager con foco en arquitectura, dependencias, logging, higiene de repositorio, servicios, UI, thumbnails, 3D, reindexado, descargas y documentacion.

## Resumen ejecutivo

El proyecto queda en mejor estado operativo que el baseline inicial:

- dependencias actualizadas con `bun update --latest`,
- scripts clave envueltos por `scripts/run-with-log.js`,
- `bun run check` validado con Oxlint 0 warnings/0 errors y TypeScript limpio,
- rutas de descarga endurecidas sin HTML inyectable,
- previews SVG con escape de texto,
- viewer 3D con GLB/GLTF/OBJ/STL y reset local,
- reindex incremental con recorrido iterativo de carpetas,
- `.gitignore` preparado para logs, DBs locales, uploads y artefactos generados,
- artefactos locales eliminados del control de versiones.

## Iteraciones aplicadas

| Iteracion | Tarea | Resultado |
| --- | --- | --- |
| 1 | 🔍 Mapa real | Se reviso estructura, docs, scripts, rutas, servicios y estado Git antes de tocar codigo. |
| 2 | 📦 Dependencias | Se actualizo `package.json` y `bun.lock`; se alinearon overrides Vite+/Vitest. |
| 3 | 🧾 Logs solidos | Se reforzaron wrappers y parser para clasificar lint, typecheck, build, test y deps sin falsos positivos. |
| 4 | 🛡️ Git hygiene | Se ajusto `.gitignore`, se preservo `logs/.gitkeep` y se retiraron artefactos locales/binarios. |
| 5 | 🏛️ Servicios | Se endurecio el adapter Effect/Express y se tiparon puntos criticos del mapper. |
| 6 | 🎨 UI viva | Se actualizo Calendar/DayPicker, EntityFilter y el viewer 3D con controles accesibles. |
| 7 | 🖼️ 3D y previews | Se corrigio soporte real de OBJ/STL y SVG seguro para thumbnails 3D/JSON/documentos. |
| 8 | 🔁 Pipeline media | Se optimizo reindex incremental, contenido de archivos y descarga/export binario. |
| 9 | 📚 Docs al dia | Este informe y las guias troncales registran el estado real posterior a la revision. |
| 10 | ✅ Validacion | `bun run check` queda verde con logs en `logs/check_2026-05-08T22-48-29-917Z.log`. |

## Correcciones principales

### 📦 Dependencias

- Se ejecuto `bun update --latest`.
- Se agregaron scripts de mantenimiento:
  - `deps:outdated`
  - `deps:update`
  - `audit`
  - `db:generate-all-thumbnails`
  - `test:watch`
  - `test:e2e:debug`
- Se mantuvieron overrides coherentes con las versiones actualizadas.

### 🧾 Logging y scripts

- `scripts/run-with-log.js` y `scripts/run-with-log-tolerant.js` ahora detectan mejor comandos de lint, test, build, deps y typecheck.
- `scripts/error-parser.js` evita marcar como error lineas de contexto que solo contienen la palabra `error`.
- Los logs quedan en `logs/` con resumen automatico util para debugging.

### 🛡️ Descarga y contenido

- `src/server/routes/download.effect.ts` ya no devuelve una pagina HTML con `path` interpolado.
- `GET /api/download` y `POST /api/download` comparten el mismo flujo seguro de descarga.
- `Content-Disposition` codifica correctamente nombres UTF-8 y nombres con caracteres especiales.
- Se agrego `X-Content-Type-Options: nosniff`.
- `src/server/routes/files.effect.ts` ahora sirve `/api/files/content` con `Content-Type`, `Content-Length` y `nosniff`.

### 🏛️ Servicios y arquitectura

- `src/lib/effect/adapters/express.adapter.ts` reconoce errores tipo Zod y los mapea a 400 con detalles.
- `src/services/file-entity-mapper/core.service.ts` reemplaza `Map<EntityType, any>` por un contrato de processor.
- El mapper valida hash antes de consultar duplicados.
- `src/services/folder/reindex/reindex-incremental.service.effect.ts` reemplaza recursion + filtros repetidos por recorrido iterativo con mapa de hijos.

### 🖼️ 3D, objetos y previews

- `src/components/features/file-viewer/viewers/three-d-viewer.tsx` ahora soporta:
  - GLB/GLTF via `useGLTF`,
  - OBJ via `OBJLoader`,
  - STL via `STLLoader`,
  - normalizacion de escala/centro,
  - sombras y fallback de material,
  - reset local sin `window.location.reload()`.
- `src/services/file-entity-mapper/processors/file3d.processor.ts` genera SVG seguro con nombres escapados.
- `src/services/thumbnail/thumbnail-unified.service.ts` escapa texto inyectado en SVG para documentos, JSON y 3D.
- Los colores de esos SVG se movieron a constantes OKLCH coherentes con el sistema visual.

### ⚡ Performance y UX

- `src/components/features/file-browser-new/components/media-thumbnail/media-thumbnail.tsx` limpia `setTimeout`, RAF y `AbortController`.
- El cache/comparador de thumbnails evita `JSON.stringify(style)` en cada render.
- El memo de thumbnails ahora considera dimensiones, ratio, fecha y conteo de carpetas para evitar previews obsoletas.

## Validacion ejecutada

```bash
bun run deps:outdated
bun run check
```

Resultado validado:

- `bun run check` paso correctamente.
- Oxlint: `Found 0 warnings and 0 errors.`
- TypeScript: sin errores.
- Log principal: `logs/check_2026-05-08T22-48-29-917Z.log`.

## Riesgos residuales

El repo es amplio y conserva deuda historica que conviene atacar en lotes especificos:

- aun existen usos de `any` en componentes legacy, stores y processors;
- algunos docs historicos bajo `docs/` son auditorias antiguas y no deben tratarse como estado canonico;
- `src/lib/utils/video/ffmpeg-thumbnails.ts` todavia usa `console.*` directo en utilidades FFmpeg;
- la limpieza profunda de thumbnails huerfanos necesita una politica de borrado confirmada para no eliminar previews utiles;
- un smoke E2E completo con Playwright queda recomendado despues de levantar la app real.

## Proximo lote recomendado

1. 🧬 Tipos legacy: reducir `any` en cards, entity-card, processors y stores de entidades.
2. 🧪 E2E media: cubrir descarga, viewer 3D, thumbnails y reindex en Playwright.
3. 🧹 Docs legacy: mover auditorias historicas a `docs/archive/` o marcarlas como snapshot.
4. 🎬 FFmpeg logger: reemplazar `console.*` por `serverLogger` en utilidades multimedia.
5. 🧯 Thumbnail cleanup: definir politica explicita para borrar o conservar previews cuando falta el archivo original.
