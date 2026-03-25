# 🖼️ Image Manager

Aplicación monolítica para gestión multimedia local con frontend en React 19, backend Express sobre Bun, Drizzle ORM + SQLite y soporte opcional de escritorio vía Tauri 2.

[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite%2B](https://img.shields.io/badge/Vite%2B-0.1.14-646CFF?logo=vite)](https://viteplus.dev)
[![Bun](https://img.shields.io/badge/Bun-1.2+-000000?logo=bun)](https://bun.sh)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)](https://orm.drizzle.team)
[![Tauri](https://img.shields.io/badge/Tauri-2.10+-FFC131?logo=tauri)](https://tauri.app)

## ✨ Qué incluye

- Gestión de carpetas y archivos multimedia con metadatos y thumbnails.
- Soporte para imágenes, video, audio, documentos, JSON y archivos 3D.
- Organización por tags, álbumes, grupos, colecciones y favoritos.
- Módulos de worldbuilding: personajes, lugares, conceptos y world items.
- Reindexación estructurada con progreso y utilidades de mantenimiento.
- Interfaz React con Zustand, TanStack Query, componentes Radix UI y design tokens propios.

## 🧱 Stack real

| Capa | Tecnologías |
| --- | --- |
| Frontend | React 19, TypeScript 6, React Router 7, Vite+ |
| Estado | Zustand, Immer, TanStack Query |
| UI | Tailwind CSS 4, Radix UI, GSAP, Lucide |
| Backend | Express 5, Bun, Effect |
| Datos | Drizzle ORM, SQLite / libsql |
| Desktop | Tauri 2 |
| Testing | Vitest, Playwright, Testing Library |

## 🚀 Puesta en marcha

### Requisitos

- Bun 1.2 o superior.
- Node.js 20+ como fallback para herramientas auxiliares.
- FFmpeg opcional para miniaturas avanzadas de video/audio.

### Instalación

```bash
git clone <repository-url>
cd media-manager
bun install
```

### Variables de entorno

El proyecto ya usa `.env` para desarrollo local y expone un `.env.example` sincronizado.

Variables principales:

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

## 💻 Desarrollo diario

### Comandos principales

| Comando | Qué hace |
| --- | --- |
| `bun run dev:full` | Arranca frontend + backend |
| `bun run dev:vite` | Arranca sólo el frontend |
| `bun run dev:server:hot` | Arranca sólo el backend |
| `bun run dev:tauri` | Abre la app en Tauri |
| `bun run build` | Build completo |
| `bun run check` | Lint + typecheck |
| `bun run test` | Tests unitarios/integración |
| `bun run test:e2e` | Tests E2E Playwright |

### Puertos por defecto

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Preview Vite: `http://localhost:4173`

## 🧪 Calidad, logs y debugging

Los scripts de lint, typecheck, tests y build escriben logs en `logs/` usando `scripts/run-with-log.js`.

### Scripts con logging automático

- `bun run lint`
- `bun run lint:fix`
- `bun run format`
- `bun run format:check`
- `bun run tsc`
- `bun run check`
- `bun run build:vite`
- `bun run build:server`
- `bun run build:tauri`
- `bun run test`
- `bun run test:ci`
- `bun run test:e2e`

### Utilidades de logs

| Comando | Uso |
| --- | --- |
| `bun run logs:list` | Lista logs recientes |
| `bun run logs:clean` | Limpia logs antiguos |
| `bun run check:errors` | Resume errores detectados en logs |

Notas operativas:

- Los logs se guardan con timestamp en `logs/`.
- La rotación básica de logs antiguos se ejecuta automáticamente cuando se usan los scripts con logging.
- Los resúmenes automáticos se agregan al inicio del log cuando la herramienta detecta errores de lint, tests o TypeScript.

## 🗂️ Estructura del repo

```text
src/
├─ components/        # UI, vistas, features y navegación
├─ server/            # Express, middleware y rutas
├─ services/          # Lógica de negocio
├─ transformers/      # Conversión Drizzle -> DTO/ViewModel
├─ store/             # Zustand stores
├─ lib/               # Drizzle, logger, effect, utils
├─ hooks/             # Hooks compartidos
├─ providers/         # Providers de aplicación
└─ types/             # Tipos y esquemas

tests/
├─ unit/
├─ integration/
└─ e2e/

docs/
├─ core/
├─ guides/
├─ audits/
└─ planning/
```

## 🏗️ Arquitectura resumida

1. **Routes** en `src/server/routes/` validan input y delegan.
2. **Services** en `src/services/` encapsulan la lógica y el acceso a Drizzle.
3. **Transformers** enriquecen datos antes de llegar al cliente.
4. **Stores + Query** coordinan estado de UI y estado servidor.
5. **Views** consumen componentes compartidos y features complejas como `file-browser-new`.

## 📚 Documentación útil

| Documento | Propósito |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | Convenciones operativas del repositorio |
| [`docs/core/ARCHITECTURE.md`](./docs/core/ARCHITECTURE.md) | Arquitectura general |
| [`docs/core/API-REFERENCE.md`](./docs/core/API-REFERENCE.md) | Endpoints principales |
| [`docs/core/DATABASE-SCHEMA.md`](./docs/core/DATABASE-SCHEMA.md) | Modelo de datos |
| [`docs/core/FRONTEND-GUIDE.md`](./docs/core/FRONTEND-GUIDE.md) | Patrones frontend |
| [`docs/core/SERVICES-GUIDE.md`](./docs/core/SERVICES-GUIDE.md) | Capa de servicios |
| [`docs/core/LOGGING-SYSTEM-GUIDE.md`](./docs/core/LOGGING-SYSTEM-GUIDE.md) | Logging y request tracing |

## ✅ Flujo recomendado para contribuir

```bash
bun run check
bun run test
bun run build
```

Si tocas rutas, búsqueda, thumbnails o reindexación, añade además:

```bash
bun run test:e2e
```

## 🧹 Higiene del repo

- `public/uploads/`, `logs/`, resultados de Playwright y archivos SQLite auxiliares están ignorados para evitar ruido y datos sensibles.
- Mantén los cambios quirúrgicos: sin refactors masivos no solicitados.
- Evita `console.*` en código productivo del cliente; usa los loggers del proyecto.

## 📝 Licencia

[MIT](./LICENSE)
