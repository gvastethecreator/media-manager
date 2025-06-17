# 🗂️ FileBrowser Component

## Descripción

El componente `FileBrowser` es un explorador de archivos completo con soporte para:

- 🖼️ Múltiples vistas (Grid, List, Cards, Masonry)
- 🔍 Selección múltiple con Ctrl/Shift
- 🌟 Marcado de favoritos
- 📋 Menú contextual con acciones avanzadas
- 📊 Panel de detalles integrado
- 🔍 Visor de archivos integrado
- 📱 Diseño responsivo con virtualización optimizada
- ⚡ Carga diferida y scroll infinito

## Estructura

```
src/components/features/file-browser/
├── context-menu/         # Menú contextual y acciones
├── details/             # Panel de detalles
├── filters/             # Filtros y búsqueda
├── hooks/               # Hooks personalizados
├── toolbar/             # Barra de herramientas
├── utils/               # Utilidades y helpers
├── views/               # Vistas (Grid, List, Cards, Masonry)
├── file-browser.tsx     # Componente principal
├── image-renderer.tsx   # Renderizador optimizado de imágenes
├── integrated-file-browser.tsx # Integración con toolbar
├── types.tsx            # Tipos compartidos
└── README.md            # Documentación
```

## Componentes principales

### `FileBrowser`

Componente principal para mostrar y manipular archivos. Gestiona:

- Selección de archivos
- Virtualización y renderizado eficiente
- Integración con el menú contextual
- Integración con el panel de detalles
- Integración con el visor de archivos

```tsx
<FileBrowser
  items={files}
  isLoading={isLoading}
  isReindexing={isReindexing}
  reindexProgress={progress}
  loadMoreItems={handleLoadMore}
  onItemSelect={handleSelect}
  onItemDoubleClick={handleDoubleClick}
/>
```

### `IntegratedFileBrowser`

Componente de nivel superior que integra `FileBrowser` con `FileBrowserToolbar`. Proporciona una experiencia completa:

```tsx
<IntegratedFileBrowser
  items={files}
  isLoading={isLoading}
  isReindexing={isReindexing}
  reindexProgress={progress}
  loadMoreItems={handleLoadMore}
  showSearch={true}
  showFilters={true}
  showDetailsToggle={true}
/>
```

## Flujo de datos

Este componente sigue el patrón de "estado global" con Zustand:

1. `viewOptionsSlice`: Gestiona el modo de vista, tamaño de items, ordenación y filtros
2. `selectionSlice`: Gestiona la selección de archivos
3. `detailsPanelStore`: Controla el panel de detalles
4. `fileViewerStore`: Gestiona el visor de archivos

## Optimizaciones

El `FileBrowser` incluye varias optimizaciones:

- **Virtualización**: Solo renderiza los elementos visibles en pantalla
- **Carga diferida**: Las imágenes se cargan solo cuando son visibles
- **Memoización**: Uso extensivo de `memo`, `useCallback` y `useMemo`
- **Cancelación de solicitudes**: Cancelación de peticiones de imágenes durante scroll
- **Transiciones suaves**: Animaciones optimizadas con motion/react

## Integraciones

- **Toolbar**: Integraciones con filtros, búsqueda y acciones masivas
- **Panel de detalles**: Actualización automática según la selección
- **Visor de archivos**: Apertura con doble clic y navegación
- **Menú contextual**: Acciones contextuales por archivo

## Uso

### Básico

```tsx
import { FileBrowser } from '@/components/features/file-browser';

export default function MyPage() {
  return (
    <FileBrowser
      items={myFiles}
      isLoading={isLoading}
    />
  );
}
```

### Integrado con Toolbar

```tsx
import { IntegratedFileBrowser } from '@/components/features/file-browser';

export default function MyPage() {
  return (
    <IntegratedFileBrowser
      items={myFiles}
      isLoading={isLoading}
      showSearch={true}
      showFilters={true}
    />
  );
}
```

## Estado del desarrollo

✅ Completado según las tareas definidas en CURRENT-TASK.md, incluyendo:

- Integración con menú contextual, panel de detalles y visor de archivos
- Selección múltiple con Ctrl/Shift
- Ordenación y filtrado
- Optimizaciones de rendimiento
- Documentación completa

# FileBrowser: Fallback visual y robustez de layout

## Fallback visual y logs controlados

Cuando el ancho del contenedor (`containerWidth`) es inválido (0, NaN o indefinido), FileBrowser:

- Muestra un Skeleton animado y FlickeringGrid como feedback visual amigable.
- Loguea el error solo una vez por ciclo usando un flag con `useRef`.
- Permite al usuario reintentar el cálculo manualmente.
- El flag de log se resetea automáticamente cuando el ancho es válido.

```mermaid
decision
    A[Render FileBrowser] --> B{containerWidth válido?}
    B -- Sí --> C[Renderiza grid normalmente]
    B -- No --> D[Renderiza Skeleton + FlickeringGrid]
    D --> E[Usuario puede reintentar cálculo]
    E --> B
    C --> F[UX normal]
    D --> G[UX amigable, sin logs infinitos]
```

## Protección extra para virtualizer

Si el virtualizer no está correctamente inicializado, se muestra un EmptyState con mensaje de error y se loguea el problema.

## Ejemplo visual del fallback

```tsx
{!containerWidth || containerWidth <= 0 ? (
  <div className="flex flex-col items-center justify-center h-full w-full gap-4">
    <div className="w-full max-w-5xl h-72 flex items-center justify-center relative">
      <Skeleton className="w-full h-full rounded-xl" />
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <FlickeringGrid squareSize={16} gridGap={12} maxOpacity={0.18} />
      </div>
    </div>
    <div className="text-xs text-muted-foreground text-center">
      Calculando layout...<br />
      <code>containerWidth: {containerWidth}</code><br />
      <code>ancho real del div padre: {realWidth}</code>
    </div>
    <button
      type="button"
      className="mt-2 px-3 py-1 rounded bg-muted text-xs hover:bg-accent border"
      onClick={() => {
        hasLoggedWidthErrorRef.current = false;
        forceRecalcWidth();
      }}
    >
      Reintentar cálculo
    </button>
  </div>
) : (
  // ...render normal del grid
)}
```

---

- El fallback visual utiliza los componentes `Skeleton` y `FlickeringGrid` para una experiencia de usuario fluida.
- El log de error solo se emite una vez por ciclo usando un flag con `useRef`, evitando spam.
- El usuario puede reintentar el cálculo manualmente.
- El flag de log se resetea automáticamente cuando el ancho es válido.
- Si el virtualizer falla, se muestra un EmptyState y se loguea el error.

---

> Última actualización: 2025-06-11
