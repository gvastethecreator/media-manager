# Guía de frontend

Este documento explica cómo está montada la interfaz del proyecto y cómo se relacionan sus piezas principales.

## 1. Boot sequence real

El arranque del frontend ocurre así:

```mermaid
flowchart TD
    A[main.tsx] --> B[AppProvider]
    B --> C[App.tsx]
    C --> D[RouterProvider]
    D --> E[MainLayout + vistas]
```

### `main.tsx`

Responsabilidades:

- localizar el nodo `root`,
- crear el root React,
- montar `AppProvider`,
- cargar estilos globales.

### `AppProvider`

Composición de infraestructura base:

- `ThemeProvider` de `src/providers/`
- `SettingsProvider`
- `QueryProvider`
- `CacheProvider`
- `FileProvider`
- `Toaster`

### `App.tsx`

Composición UI y runtime:

- `ThemeProvider` de `components/ui`
- `TooltipProvider`
- `ViewTransitionProvider`
- `ReactScanProvider`
- `FeedbackProvider`
- `ErrorBoundary`
- `SkipLink`
- bootstrap del catálogo y refresco SSE
- `RouterProvider`

## 2. Routing

La configuración vive en `src/router.tsx`.

### Características

- `MainLayout` como contenedor de toda la app.
- mezcla de vistas eager y lazy.
- rutas por dominio funcional.
- wrappers para casos de carpeta jerárquica y detalle por entidad.

### Familias de vistas del router

- dashboard
- development
- folders
- all-files / all-images
- videos / audios / documents / json-files / file3d
- favorites / collections / albums / groups / tags
- characters / places / world-items / concepts / wildcards / prompts / notes / properties
- search
- settings

## 3. Organización de componentes

### `src/components/ui/`

Primitivas y wrappers reutilizables.

Ejemplos de responsabilidad:

- botones,
- diálogos,
- tooltips,
- toaster,
- providers de UI,
- accesibilidad.

### `src/components/layout/`

Define la estructura principal y paneles del shell de la aplicación.

### `src/components/features/`

Dos features dominantes:

#### `file-browser-new/`

- wrappers para rutas de carpeta,
- navegación jerárquica,
- exploración visual,
- integración con paneles y selección.

#### `file-viewer/`

- visualización detallada por entidad/archivo,
- soporte a distintos formatos,
- interacción con stores de viewer.

### `src/components/views/`

Es el catálogo de páginas funcionales completas. Cada carpeta de vista representa una sección del producto.

## 4. Estado en cliente

### Zustand

Ubicación: `src/store/`

Stores relevantes:

- `ui.store.ts`
- `selection.store.ts`
- `search.store.ts`
- `reindex.store.ts`
- `thumbnails.store.ts`
- `file-view.store.ts`
- `details-panel.store.ts`
- `entity-catalog-store.ts`
- `unified-file-manager.store.ts`
- stores por entidad en `entities/`

### TanStack Query

`QueryProvider` usa `queryClient` de la capa web y sirve para:

- caché de respuestas,
- invalidación,
- soporte devtools en desarrollo,
- sincronización de estado servidor.

## 5. Providers y contextos

Hay una combinación de contextos ubicados en:

- `src/providers/`
- `src/lib/contexts/`
- `src/components/ui/`

### Implicación importante

El frontend mantiene una arquitectura funcional pero con herencia de migraciones. Conviene tratar los providers como capas complementarias, no como un único sistema perfectamente consolidado.

## 6. Sistema visual

### Estilos base

Se cargan desde:

- `src/app/globals.css`
- `src/styles/globals.css`
- `src/styles/scrollbar.css`
- `src/styles/selecto.css`
- `src/styles/view-transition.css`

### Tokens

El sistema visual se apoya en:

- `tokens.css`
- `design-tokens.css`
- `STYLES-AND-THEMES-GUIDE.md`

### Temas

Hay soporte a múltiples temas personalizados y resolución de tema del sistema.

## 7. Interacción con backend

El frontend consume el backend principalmente mediante:

- cliente HTTP/Query,
- stores y hooks,
- SSE para flujos de refresco/progreso,
- rutas de preview/thumbnail/original.

## 8. Patrones funcionales del frontend

### Navegación por dominio

Cada vista mapea una parte del dominio y evita un “todo en una sola página”.

### Lazy loading

Se usa para reducir bundle inicial y repartir el coste por sección.

### Bootstrap en background

`EntityCatalogBootstrapper` precarga el catálogo de entidades.

### Refresh por SSE

`useNavigationRefresh` sincroniza navegación o cambios del lado servidor.

## 9. Testing frontend

### Unit/integration

- Vitest
- jsdom
- Testing Library
- setup global en `tests/setup.ts`

### Qué prepara el entorno

- `@testing-library/jest-dom/vitest`
- `ResizeObserver`
- `requestAnimationFrame`
- `IntersectionObserver`
- `matchMedia`
- pragmas SQLite para entorno de pruebas

## 10. Riesgos y deuda visible

- Doble sistema de providers/theme composition.
- Anchura alta del catálogo de vistas.
- Algunas descripciones históricas de `README` internos del frontend ya no reflejan exactamente el estado del árbol.
- El browser y viewer concentran bastante complejidad de interacción.

## 11. Recomendaciones para tocar frontend

- Mirar primero `router.tsx` y la vista involucrada.
- Identificar si el cambio vive en `components/views`, `features`, `store` o `providers`.
- Revisar si el dato viene de Query, Zustand o ambos.
- Confirmar si el flujo ya está cubierto por preview/thumbnail/SSE.

## 12. Lecturas relacionadas

- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./REPOSITORY-MAP.md`](./REPOSITORY-MAP.md)
- [`./STYLES-AND-THEMES-GUIDE.md`](./STYLES-AND-THEMES-GUIDE.md)
