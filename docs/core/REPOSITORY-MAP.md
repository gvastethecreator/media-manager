# Mapa del repositorio

Este documento sirve como **guía de orientación del árbol del proyecto**. Su meta es que una persona nueva pueda entender dónde vive cada responsabilidad antes de tocar código.

## 1. Raíz del repositorio

| Ruta                   | Rol                                                            |
| ---------------------- | -------------------------------------------------------------- |
| `README.md`            | entrada general del proyecto                                   |
| `AGENTS.md`            | reglas operativas y convenciones del repo                      |
| `package.json`         | scripts, dependencias y tooling                                |
| `vite.config.ts`       | build, desarrollo y tests unitarios/integración mediante Vite+ |
| `playwright.config.ts` | tests E2E                                                      |
| `drizzle.config.ts`    | configuración de migraciones/schema                            |
| `tailwind.config.ts`   | integración visual y tokens                                    |
| `src/`                 | código principal                                               |
| `src-tauri/`           | shell desktop                                                  |
| `tests/`               | test suite                                                     |
| `scripts/`             | automatización y wrappers                                      |
| `docs/`                | documentación y auditorías                                     |
| `drizzle/`             | migraciones generadas                                          |
| `public/`              | assets y uploads                                               |
| `logs/`                | salidas operativas y métricas                                  |

## 2. `src/` por áreas

```text
src/
├─ App.tsx
├─ main.tsx
├─ router.tsx
├─ components/
├─ config/
├─ constants/
├─ hooks/
├─ lib/
├─ providers/
├─ scripts/
├─ server/
├─ services/
├─ store/
├─ styles/
├─ transformers/
├─ types/
└─ utils/
```

### Entrada y composición

- `main.tsx`: monta React y envuelve con `AppProvider`.
- `App.tsx`: compone providers UI, bootstrapper y `RouterProvider`.
- `router.tsx`: registra vistas, layouts y lazy loading.

## 3. `src/components/`

El árbol de componentes es amplio y está segmentado por intención.

| Carpeta                 | Uso principal                  |
| ----------------------- | ------------------------------ |
| `a11y/`                 | accesibilidad                  |
| `cards/`                | tarjetas reutilizables         |
| `common/`               | bloques compartidos            |
| `core/`                 | componentes estructurales base |
| `debug/`                | componentes de diagnóstico     |
| `entities/` / `entity/` | piezas por entidad             |
| `error/`                | errores y boundaries           |
| `features/`             | features complejas             |
| `forms/`                | formularios                    |
| `layout/`               | layout principal y paneles     |
| `loading/`              | loaders y placeholders         |
| `navigation/`           | navegación y árbol lateral     |
| `panels/`               | paneles especializados         |
| `settings/`             | interfaz de configuración      |
| `toolbar/`              | barras de herramientas         |
| `transitions/`          | transiciones/animación         |
| `ui/`                   | primitivas y wrappers UI       |
| `viewers/`              | viewers dedicados              |
| `views/`                | páginas/vistas completas       |

### Features destacadas

`src/components/features/` contiene dos piezas especialmente importantes:

- `file-browser-new/`: exploración de carpetas, previews, wrappers y navegación jerárquica.
- `file-viewer/`: visualización detallada por tipo de archivo/contenido.

### Vistas disponibles

`src/components/views/` agrupa secciones enteras del producto:

- dashboard
- folders
- all-images
- files
- images
- videos
- audio
- documents
- json-files
- file3d
- search
- tags
- albums
- collections
- groups
- favorites
- characters
- places
- concepts
- world-items
- prompts
- notes
- properties
- wildcards
- settings
- development

## 4. `src/server/`

Contiene el backend Express.

### Estructura

| Ruta          | Función                                   |
| ------------- | ----------------------------------------- |
| `index.ts`    | servidor, middleware y montaje de routers |
| `middleware/` | logging, validación, errores              |
| `routes/`     | endpoints REST/SSE/binarios               |

### Inventario de routers relevantes

- `images.effect.ts`
- `videos.effect.ts`
- `audios.effect.ts`
- `folders.effect.ts`
- `search.effect.ts`
- `albums.effect.ts`
- `collections.effect.ts`
- `characters.effect.ts`
- `worldbuilding.effect.ts`
- `secondary-services.effect.ts`
- `file-services.effect.ts`
- `files.effect.ts`
- `download.effect.ts`
- `events.effect.ts`
- `thumbnails.effect.ts`
- `thumbnails-unified.ts`
- `metadata.effect.ts`
- `profiles.effect.ts`
- `settings.effect.ts`
- `favorites.effect.ts`
- `queue.ts`
- `system.ts`
- `stats.ts`
- `activity.ts`
- `api/reindex-incremental.ts`
- `api/reindex-logs.ts`
- `debug/*`

## 5. `src/services/`

Es la capa de negocio y sistemas transversales.

### Servicios por dominio

- `image/`, `video/`, `audio/`, `document/`, `json-file/`, `file3d/`, `uploaded-images/`
- `folder/`, `folder-files/`, `file/`, `download/`, `file-changes/`, `file-entity-mapper/`
- `album/`, `collection/`, `group/`, `favorite/`, `profile/`, `settings/`
- `tag/`, `note/`, `prompt/`, `property/`, `task/`, `wildcard/`
- `character/`, `place/`, `concept/`, `world-item/`, `worldbuilding/`

### Infraestructura de soporte

- `cache/`
- `progress/`
- `thumbnail/`
- `thumbnail-config/`
- `activity/`
- `metadata/`
- `stats/`
- `toast/`
- `drag-selection/`
- `queue-job/`

## 6. `src/store/`

Zustand centraliza estado de UI y apoyo a navegación.

| Archivo/carpeta                 | Responsabilidad                          |
| ------------------------------- | ---------------------------------------- |
| `base.store.ts`                 | utilidades base                          |
| `entities/`                     | stores por entidad                       |
| `selection.store.ts`            | selección de elementos                   |
| `search.store.ts`               | estado de búsqueda                       |
| `reindex.store.ts`              | progreso de reindexado                   |
| `thumbnails.store.ts`           | estado/caché relacionado con thumbnails  |
| `ui.store.ts`                   | estado general de interfaz               |
| `file-view.store.ts`            | viewer de archivos                       |
| `details-panel.store.ts`        | panel de detalles                        |
| `entity-catalog-store.ts`       | bootstrap de catálogo                    |
| `unified-file-manager.store.ts` | orquestación amplia de archivo/selección |

## 7. `src/lib/`

Es la caja de herramientas e infraestructura compartida del proyecto.

### Submódulos relevantes

| Carpeta                      | Función                                |
| ---------------------------- | -------------------------------------- |
| `api/` / `web/`              | cliente HTTP y React Query             |
| `contexts/`                  | contextos React reutilizados           |
| `database/`                  | cachés y utilidades alrededor de datos |
| `drizzle/`                   | ORM, cliente, schema y relaciones      |
| `effect/`                    | adapters y utilidades Effect-TS        |
| `events/`                    | eventos compartidos                    |
| `filesystem/`                | hash, escaneo y acceso a disco         |
| `logger/`                    | logging cliente/servidor               |
| `server/`                    | infraestructura del lado servidor      |
| `system/`                    | utilidades operativas                  |
| `tauri/`                     | helpers de integración desktop         |
| `view-transition/`           | soporte visual para transiciones       |
| `styles/`                    | helpers de color y estilo              |
| `hooks/`, `utils/`, `types/` | utilidades generales                   |

## 8. `src/lib/drizzle/schema/`

La estructura del schema se divide por dominios:

```text
schema/
├─ core/
├─ dev.ts
├─ files/
├─ organization/
├─ relations/
├─ taxonomy/
├─ worldbuilding/
└─ index.ts
```

### Inventario por dominio

- `core/`: `activities.ts`, `aggregates.ts`, `fileStats.ts`, `metadatas.ts`, `profiles.ts`, `queueJobs.ts`, `settings.ts`, `thumbnails.ts`
- `files/`: `audio.ts`, `documents.ts`, `file3Ds.ts`, `files.ts`, `images.ts`, `jsonFiles.ts`, `uploadedImages.ts`, `videos.ts`
- `organization/`: `albums.ts`, `collections.ts`, `favorites.ts`, `folders.ts`, `groups.ts`, `tags.ts`
- `taxonomy/`: `notes.ts`, `prompts.ts`, `properties.ts`, `tasks.ts`, `wildcards.ts`
- `worldbuilding/`: `characters.ts`, `concepts.ts`, `places.ts`, `worldItems.ts`

## 9. `src/styles/`

| Archivo                                       | Propósito                      |
| --------------------------------------------- | ------------------------------ |
| `globals.css`                                 | estilos globales               |
| `tokens.css`                                  | tokens semánticos              |
| `design-tokens.css`                           | paletas y escalas              |
| `transitions.css`                             | transiciones globales          |
| `view-transition.css`                         | soporte visual de transiciones |
| `scrollbar.css`                               | scrollbar                      |
| `selecto.css`                                 | utilidades de selección        |
| `card-animations.css` / `form-animations.css` | animación específica           |
| `utilities/`                                  | utilidades CSS auxiliares      |

## 10. `src-tauri/`

| Ruta              | Función                       |
| ----------------- | ----------------------------- |
| `tauri.conf.json` | configuración principal Tauri |
| `src/`            | código Rust                   |

Es la capa que convierte la app local en aplicación desktop distribuible.

## 11. `tests/`

```text
tests/
├─ e2e/
├─ factories/
├─ integration/
├─ setup.ts
├─ types/
└─ unit/
```

- `setup.ts` define polyfills y ajustes del entorno jsdom.
- `e2e/` usa Playwright y `bun run dev:full` como servidor base.

## 12. `scripts/`

Aquí viven los wrappers y automatizaciones operativas:

- `dev-full.js`, `dev-server-hot.js`, `tauri-dev.js`
- `run-with-log.js`, `run-with-log-tolerant.js`
- `check-errors.js`, `logging-utils.js`
- scripts de DB, thumbnails, migraciones y diagnósticos

## 13. `docs/`

| Carpeta     | Contenido                            |
| ----------- | ------------------------------------ |
| `core/`     | documentación técnica principal      |
| `guides/`   | guías temáticas y migraciones        |
| `audits/`   | auditorías históricas                |
| `planning/` | documentos de planificación          |
| `archive/`  | material antiguo o congelado         |
| `RULES/`    | reglas y referencias complementarias |

## 14. Ruta de onboarding recomendada

1. Leer `README.md`.
2. Revisar `docs/core/ARCHITECTURE.md`.
3. Abrir `docs/core/REPOSITORY-MAP.md`.
4. Si vas al frontend, seguir con `FRONTEND-GUIDE.md`.
5. Si vas al backend/negocio, seguir con `SERVICES-GUIDE.md` y `API-REFERENCE.md`.
6. Si tocas persistencia, revisar `DATABASE-SCHEMA.md`.
