# 🗂️ File Browser Component

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

## Auditoría y limpieza V3 completada ✅

### Directorios eliminados por falta de uso

- ❌ **`download/`** - Sistema de descarga no utilizado (3 archivos eliminados)
- ❌ **`filters/`** - Panel de filtros no utilizado (2 archivos eliminados)
- ❌ **`config/`** - Configuraciones redundantes (1 archivo eliminado)
- ❌ **`settings/`** - Configuraciones no utilizadas externamente (5 archivos eliminados)

### Hooks innecesarios eliminados

- ❌ **`use-grid-virtualizer.ts`** - Virtualización compleja no utilizada
- ❌ **`use-stable-handlers.ts`** - Handlers obsoletos
- ❌ **`use-thumbnail-loader.ts`** - Carga de thumbnails redundante
- ❌ **`use-filtered-data.ts`** - Duplicado de hook en lib/

### Vistas redundantes eliminadas

- ❌ **`masonry-view-fixed.tsx`** - Implementación redundante de masonry
- ❌ **`true-masonry-view.tsx`** - Otra implementación redundante de masonry

### Archivos individuales eliminados

- ❌ **`entity-preloader.tsx`** - Precarga no utilizada
- ❌ **`grid-config.ts`** - Configuración solo usada por hook eliminado

### Estructura final limpia

```
file-browser/
├── file-browser.tsx              # Componente principal
├── index.ts                      # Exports limpios
├── image-renderer.tsx            # Renderizador de imágenes
├── types.tsx                     # Tipos del componente
├── README.md                     # Esta documentación
├── click-to-deselect.test.tsx    # Tests (mantenido)
├── components/                   # Sub-componentes
│   ├── grid-item.tsx
│   ├── selection-counter.tsx
│   └── index.ts
├── context-menu/                 # Sistema de menú contextual
├── hooks/                        # Solo hooks utilizados
│   ├── use-accessibility.ts
│   └── use-performance.ts
├── navigation/                   # Navegación por teclado
├── progress/                     # Indicadores de progreso
├── selection/                    # Sistema de selección
├── styles/                       # Estilos específicos
├── toolbar/                      # Barra de herramientas
├── undo-redo/                    # Sistema de deshacer/rehacer
└── views/                        # Vistas disponibles
    ├── cards-view.tsx
    ├── grid-view.tsx
    ├── list-view.tsx
    ├── masonry-view.tsx
    └── componentes de apoyo...
```

### Beneficios de la limpieza

1. **Reducción significativa de archivos:** 15+ archivos eliminados
2. **Imports más claros:** Solo se exporta lo que realmente se usa
3. **Menor complejidad:** Código más mantenible y enfocado
4. **Mejor rendimiento:** Menos código JavaScript en el bundle final
5. **Estructura más clara:** Directorios organizados por funcionalidad real

2. **Transiciones animadas:**
   - `AnimatePresence` para cambios suaves entre vistas
   - Animaciones sutiles que mejoran la UX sin impactar rendimiento

3. **Accesibilidad mejorada:**
   - `role="application"` en el contenedor principal
   - `aria-label` descriptivos para lectores de pantalla
   - Navegación por teclado mantenida

3. **Organizar directorios:**
   - Mover componentes relacionados a subdirectorios apropiados
   - Crear una estructura más clara para componentes, hooks y utilidades

4. **Documentar componentes:**
   - Actualizar o crear documentación para cada componente principal
   - Incluir ejemplos de uso y props

5. **Optimizar rendimiento:**
   - Revisar y optimizar la carga de imágenes
   - Mejorar la virtualización para grandes conjuntos de datos

## Estructura propuesta

```
file-browser/
├── index.ts                    # Exportaciones principales
├── file-browser.tsx            # Componente principal
├── integrated-file-browser.tsx # Versión integrada
├── components/                 # Subcomponentes
│   ├── toolbar/                # Componentes de barra de herramientas
│   ├── context-menu/           # Menú contextual
│   └── details/                # Panel de detalles
├── views/                      # Componentes de vista
│   ├── grid-view.tsx           # Vista de cuadrícula unificada
│   ├── list-view.tsx           # Vista de lista
│   ├── masonry-view.tsx        # Vista de mosaico
│   ├── cards-view.tsx          # Vista de tarjetas
│   └── virtualizer-wrapper.tsx # Wrapper de virtualización
├── hooks/                      # Hooks personalizados
├── utils/                      # Utilidades
├── styles/                     # Estilos
└── docs/                       # Documentación
```

## Tareas inmediatas

1. Eliminar archivos obsoletos
2. Consolidar `GridView` y `SimpleGridView`
3. Actualizar exportaciones en `index.ts`
4. Reorganizar la estructura de directorios
5. Actualizar la documentación

## Notas sobre componentes específicos

### SimpleGridView vs GridView

`SimpleGridView` es una implementación más reciente y optimizada que no depende del `VirtualizerWrapper`. Es más eficiente para conjuntos de datos pequeños a medianos y tiene mejor manejo de scroll.

`GridView` utiliza el `VirtualizerWrapper` para virtualización avanzada, pero puede tener problemas de rendimiento en algunos casos.

**Recomendación:** Mantener `SimpleGridView` como la implementación principal y eliminar o refactorizar `GridView`.

### VirtualizerWrapper

Este componente es complejo y proporciona virtualización avanzada, pero puede ser innecesario para conjuntos de datos pequeños. Debemos evaluar si realmente se necesita para todos los casos de uso o si podemos simplificarlo.

### Componentes de toolbar y acciones

Actualmente son componentes de marcador de posición (`ViewTypeSelector`, `SortTypeSelector`, etc.). Deberíamos implementarlos adecuadamente o moverlos a un archivo separado.

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
