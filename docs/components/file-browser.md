# Documentación del Componente FileBrowser

## Descripción General

El componente `FileBrowser` es una interfaz avanzada para visualizar y gestionar archivos de imágenes en diferentes modos de visualización. Permite la navegación, selección, y visualización detallada de imágenes con soporte para virtualización, carga optimizada de miniaturas y un panel de detalles interactivo.

```mermaid
graph TD
    A[FileBrowser] --> B[Gestión de Estado]
    A --> C[Visualización]
    A --> D[Interacción]
    A --> E[Panel de Detalles]

    B --> B1[useFileManager]
    B --> B2[useImageResources]
    B --> B3[useDetailsPanel]

    C --> C1[Modos de Vista]
    C --> C2[Virtualización]
    C --> C3[Carga de Miniaturas]

    D --> D1[Selección de Items]
    D --> D2[Menú Contextual]
    D --> D3[Eventos de Click]

    E --> E1[Información de Metadatos]
    E --> E2[Posicionamiento]
    E --> E3[Fijación/Arrastre]

    C1 --> C1a[Grid]
    C1 --> C1b[List]
    C1 --> C1c[Masonry]
    C1 --> C1d[Cards]

    style A fill:#d4f1f9
    style B fill:#ffecb3
    style C fill:#e1bee7
    style D fill:#c8e6c9
    style E fill:#f8bbd0
```

## Estructura y Componentes

### Propiedades

```typescript
export interface FileBrowserProps {
	items: FileItem[]; // Lista de archivos a mostrar
	isResizing?: boolean; // Indica si el contenedor está siendo redimensionado
	onItemClick?: (item: FileItem) => void; // Manejador de clic en item
	onItemDoubleClick?: (item: FileItem) => void; // Manejador de doble clic en item
	loadMoreItems?: () => void; // Función para cargar más items (scroll infinito)
}
```

### Hooks Principales

El componente utiliza varios hooks personalizados para separar la lógica:

1. **useFileManager**: Gestiona el estado global de selección y vista de archivos
2. **useImageResources**: Maneja la carga y caché de recursos de imágenes
3. **useDetailsPanel**: Controla la visibilidad y posición del panel de detalles
4. **useGridView**: Gestiona la visualización y scroll del grid
5. **useGridVirtualizer**: Implementa la virtualización para renderizado eficiente
6. **useThumbnailLoader**: Optimiza la carga de miniaturas

## Flujo de Datos

```mermaid
sequenceDiagram
    participant FB as FileBrowser
    participant FM as FileManager Store
    participant IR as ImageResources Store
    participant DP as DetailsPanel Store
    participant GV as GridView Hook
    participant VZ as Virtualizer
    participant TL as ThumbnailLoader

    FB->>FM: Obtener estado (selectedItems, viewMode)
    FB->>IR: Obtener recursos de imágenes
    FB->>DP: Obtener estado del panel (isVisible, isFixed)
    FB->>GV: Inicializar vista (parentRef, containerWidth)
    GV->>VZ: Configurar virtualización

    Note over FB,VZ: Renderizado inicial

    FB->>VZ: Obtener items virtuales
    VZ-->>FB: Items visibles
    FB->>TL: Cargar miniaturas para items visibles
    TL->>IR: Solicitar/almacenar recursos

    Note over FB,IR: Interacción del usuario

    FB->>FM: Actualizar selección
    FB->>DP: Actualizar panel de detalles
```

## Modos de Visualización

El componente soporta cuatro modos de visualización diferentes:

1. **Grid**: Vista en cuadrícula regular con tamaños uniformes
2. **List**: Vista de lista con información detallada en filas
3. **Masonry**: Vista en mosaico con alturas variables según proporción de imagen
4. **Cards**: Vista de tarjetas con información adicional

Cada modo utiliza un componente específico (`GridView`, `ListView`, `MasonryView`, `CardsView`) que implementa su propia lógica de renderizado y estilo.

## Optimizaciones de Rendimiento

- **Virtualización**: Solo renderiza los elementos visibles en pantalla
- **Carga diferida de miniaturas**: Carga solo las miniaturas visibles
- **Debounce en scroll**: Reduce la frecuencia de actualizaciones durante el scroll
- **Caché de recursos**: Almacena miniaturas ya cargadas para reutilización
- **Transiciones optimizadas**: Manejo de transiciones entre modos de vista

## Panel de Detalles

El panel de detalles es un componente flotante que muestra información detallada de los elementos seleccionados:

- Puede ser arrastrado por la interfaz (cuando no está fijado)
- Puede fijarse en una posición específica
- Muestra metadatos de las imágenes seleccionadas
- Se puede mostrar/ocultar según necesidad

## Manejo de Errores

El componente incluye manejo de casos especiales:

- Detección y procesamiento de ReactPromise
- Validación de IDs de items
- Manejo de items inválidos o corruptos
- Logging detallado para depuración

## Integración con el Sistema

El componente se integra con varios sistemas de la aplicación:

- Sistema de gestión de archivos
- Sistema de metadatos de imágenes
- Sistema de selección y navegación
- Sistema de caché y optimización de recursos

## Ejemplo de Uso

```tsx
<FileBrowser
	items={images}
	onItemClick={handleImageSelect}
	onItemDoubleClick={handleImageOpen}
	loadMoreItems={fetchMoreImages}
/>
```

## Consideraciones Técnicas

- El componente utiliza Zustand para gestión de estado global
- Implementa virtualización con @tanstack/react-virtual
- Utiliza Framer Motion para animaciones del panel de detalles
- Implementa optimizaciones para carga de imágenes y rendimiento
- Soporta interacciones avanzadas como arrastrar y soltar, menú contextual, etc.
