# Image Manager

Aplicación monolítica para **gestión multimedia local** con frontend en React 19, backend Express sobre Bun, persistencia con Drizzle ORM + SQLite/libsql y empaquetado opcional de escritorio con Tauri 2.

El proyecto está diseñado para trabajar con bibliotecas grandes de archivos y metadatos; no es solo un visor de imágenes. Su objetivo real es indexar, organizar, enriquecer y navegar contenido heterogéneo: imágenes, videos, audio, documentos, JSON, modelos 3D y entidades de worldbuilding.

## Qué resuelve

- Indexación de carpetas del sistema de archivos sin obligar a mover los archivos.
- Organización semántica mediante tags, álbumes, colecciones, grupos y favoritos.
- Gestión de dominios creativos y narrativos: personajes, lugares, conceptos y world items.
- Generación de thumbnails y extracción de metadatos para varios tipos de media.
- Búsqueda global, búsqueda FTS/LIKE y vistas de navegación ricas.
- Operación dual como app web local y como app de escritorio con Tauri.

## Stack real del proyecto

| Capa | Tecnologías principales |
| --- | --- |
| Frontend | React 19, TypeScript 6, React Router 7, Vite+ |
| Estado | Zustand, Immer, TanStack Query |
| UI | Tailwind CSS 4, Radix UI, GSAP, Lucide |
| Backend | Express 5, Bun, Effect |
| Persistencia | Drizzle ORM, SQLite, `@libsql/client` |
| Procesamiento media | Sharp, exifr, music-metadata, ffprobe-static, mediabunny |
| Testing | Vitest, Testing Library, Playwright |
| Desktop | Tauri 2 |
| Tooling | Oxc/Oxlint/Oxfmt, TypeScript, scripts Bun |

## Modos de ejecución

| Modo | Frontend | Backend | Desktop |
| --- | --- | --- | --- |
| Web local | `http://localhost:5173` | `http://localhost:4000` | No |
| Tauri dev | WebView Tauri | Express embebido/externo | Sí |
| Build producción | `dist/` | `dist/server/` | Opcional |

## Puesta en marcha

### Requisitos

- Bun 1.2+
- Node.js 20+ como soporte para tooling auxiliar
- Windows, macOS o Linux
- FFmpeg opcional para algunos flujos de thumbnails y metadata avanzada

### Instalación

```bash
bun install
```

### Entorno

El proyecto usa variables de entorno para puertos, base de datos y flags operativos.

Archivos relevantes:

- `.env` para entorno local
- `.env.example` como plantilla/base de referencia

Variables clave:

```env
NODE_ENV=development
API_PORT=4000
PORT=4000
DATABASE_URL=file:./db.sqlite
VITE_API_URL=http://localhost:4000/api
CORS_ORIGIN=http://localhost:5173
UPLOADS_DIR=public/uploads
LOG_TO_CONSOLE=true
LOG_LEVEL=info
DISABLE_FTS5=0
SEARCH_FTS_REQUIRE=0
```

## Comandos principales

| Comando | Propósito |
| --- | --- |
| `bun run dev:full` | Inicia frontend + backend |
| `bun run dev:vite` | Solo frontend |
| `bun run dev:server:hot` | Solo backend |
| `bun run dev:tauri` | Abre la app en Tauri |
| `bun run build` | Build completo |
| `bun run check` | Lint + typecheck |
| `bun run test` | Tests unitarios/integración |
| `bun run test:e2e` | Tests E2E Playwright |
| `bun run db:studio` | Exploración visual de DB |
| `bun run logs:list` | Listado de logs |

## Estructura del repositorio

```text
src/                # Aplicación principal (frontend + backend + servicios)
src-tauri/          # Shell desktop en Rust/Tauri
tests/              # Unit, integration y e2e
scripts/            # Scripts operativos Bun
docs/               # Documentación técnica, guías y auditorías
public/             # Assets públicos y uploads
drizzle/            # Migraciones generadas
logs/               # Logs de ejecución y métricas
```

## Cómo está organizado `src/`

| Ruta | Responsabilidad |
| --- | --- |
| `src/components/` | UI, layout, features, vistas y paneles |
| `src/router.tsx` | Mapa de rutas del cliente |
| `src/server/` | Servidor Express, middleware y rutas API |
| `src/services/` | Lógica de negocio y sistemas transversales |
| `src/transformers/` | Enriquecimiento y serialización de entidades |
| `src/store/` | Estado global con Zustand |
| `src/lib/` | Infraestructura compartida (Drizzle, logger, effect, filesystem, contexts) |
| `src/providers/` | Providers de aplicación y compatibilidad |
| `src/styles/` | Tokens, globals, animaciones y utilidades de tema |
| `src/types/` | Tipos del dominio |

## Documentación recomendada

### Documentación troncal actualizada

- [`docs/core/PRD.md`](./docs/core/PRD.md): visión de producto, alcance y requerimientos.
- [`docs/core/ARCHITECTURE.md`](./docs/core/ARCHITECTURE.md): arquitectura completa y flujos.
- [`docs/core/REPOSITORY-MAP.md`](./docs/core/REPOSITORY-MAP.md): mapa de carpetas y archivos.
- [`docs/core/DATABASE-SCHEMA.md`](./docs/core/DATABASE-SCHEMA.md): dominios y patrón del esquema Drizzle.
- [`docs/core/FRONTEND-GUIDE.md`](./docs/core/FRONTEND-GUIDE.md): bootstrap, providers, vistas, stores y UI.
- [`docs/core/DESIGN-AND-UX.md`](./docs/core/DESIGN-AND-UX.md): shell visual, paneles, temas y criterios UX.
- [`docs/core/SERVICES-GUIDE.md`](./docs/core/SERVICES-GUIDE.md): servicios, Effect-TS y sistemas transversales.
- [`docs/core/API-REFERENCE.md`](./docs/core/API-REFERENCE.md): familias de endpoints y convenciones.
- [`docs/core/IMPLEMENTATION-DETAILS.md`](./docs/core/IMPLEMENTATION-DETAILS.md): implementación de thumbnails, reindex, búsqueda, Tauri y tooling.
- [`docs/core/CODEBASE-HEALTH-2026-05-08.md`](./docs/core/CODEBASE-HEALTH-2026-05-08.md): auditoría aplicada, fixes, logs y riesgos residuales.

### Documentación especializada complementaria

- [`docs/core/LOGGING-SYSTEM-GUIDE.md`](./docs/core/LOGGING-SYSTEM-GUIDE.md)
- [`docs/core/STYLES-AND-THEMES-GUIDE.md`](./docs/core/STYLES-AND-THEMES-GUIDE.md)
- [`docs/core/THUMBNAIL-CONFIG.md`](./docs/core/THUMBNAIL-CONFIG.md)

### Convenciones operativas para agentes y colaboradores

- [`AGENTS.md`](./AGENTS.md)
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md)

## Características funcionales principales

### Dominios de archivo

- Imágenes
- Videos
- Audios
- Documentos
- JSON
- Archivos 3D
- Imágenes subidas

### Dominios organizativos y creativos

- Carpetas
- Tags
- Álbumes
- Colecciones
- Grupos
- Favoritos
- Profiles
- Settings
- Characters
- Places
- Concepts
- World Items
- Prompts
- Notes
- Properties
- Tasks
- Wildcards

### Sistemas técnicos relevantes

- Reindexado estructurado e incremental
- Mapper de archivos físicos a entidades de BD
- Thumbnailing unificado y previews específicos por tipo
- Búsqueda global y FTS con fallback
- Logging estructurado
- Sistema de cachés y métricas
- Undo/redo para operaciones de archivos
- Paneles, file browser y viewer multi-formato

## Flujo de desarrollo recomendado

```bash
bun run check
bun run test
bun run build
```

Estos comandos generan logs en `logs/` mediante `scripts/run-with-log.js`, incluyendo resumen automatico de errores para debugging.

Si tocas rutas, viewers, thumbnails, búsqueda o reindexado, añade además:

```bash
bun run test:e2e
```

## Notas arquitectónicas importantes

- Es un **monolito cliente-servidor**, no un conjunto de microservicios.
- Conviven capas nuevas en Effect-TS con utilidades y compatibilidad heredada.
- Hay doble composición de providers (`src/providers/*` y `src/components/ui/*`) por migraciones históricas; esto está documentado en la guía de arquitectura.
- El árbol `docs/` contiene material actual y también auditorías históricas; usa `docs/core/` como punto de entrada principal.

## Estado del proyecto

Proyecto en desarrollo activo con una base funcional amplia, una capa documental ya madura y una arquitectura con fuerte orientación a tipado, modularidad y operación local. No es un MVP diminuto; es un sistema bastante ancho, con varias capas de compatibilidad y herramientas de mantenimiento.

Última revisión integral aplicada: **2026-05-08**. El gate `bun run check` quedó verde con Oxlint 0 warnings/0 errors y TypeScript limpio.

## Licencia

Consulta la licencia del repositorio si aplica en tu entorno de distribución.
