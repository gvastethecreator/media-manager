# Estructura de Vistas de Archivos Escaneados

Este documento describe la arquitectura de vistas para archivos escaneados (imágenes, videos, audio, documentos, etc.) en el sistema.

## 📋 Tabla de Contenidos

- [Resumen General](#resumen-general)
- [Vistas Disponibles](#vistas-disponibles)
- [Items de Canvas](#items-de-canvas)
- [Patrón de Implementación](#patrón-de-implementación)
- [FileBrowser](#filebrowser)
- [Mejores Prácticas](#mejores-prácticas)

## Resumen General

El sistema maneja archivos escaneados a través de:

1. **Vistas Principales** - Componentes que muestran listas/grids de archivos por tipo
2. **FileBrowser** - Componente de alto rendimiento con canvas para mostrar grandes colecciones
3. **Items de Canvas** - Componentes especializados para renderizar cada tipo de archivo
4. **Stores** - Estado global por tipo de archivo usando Zustand

## Vistas Disponibles

Todas las vistas de archivos escaneados siguen el mismo patrón y usan `FileBrowser`:

### 1. All Images View (`src/components/views/all-images/`)

**Propósito:** Galería de todas las imágenes escaneadas del sistema

**Características:**
- ✅ FileBrowser con virtualización canvas
- ✅ Visor de imágenes integrado (doble click)
- ✅ Sistema de indexación automática
- ✅ Upload de nuevas imágenes
- ✅ Reindexación manual

**Store:** `useImageStore` - `/store/entities/image`

**Ejemplo:**
```tsx
<FileBrowser
  items={images}
  isLoading={isLoading}
  onItemClick={handleImageClick}
  onItemDoubleClick={handleImageDoubleClick}
/>
```

### 2. Videos View (`src/components/views/videos/`)

**Propósito:** Galería de todos los videos escaneados

**Características:**
- ✅ FileBrowser con items especializados de video
- ✅ Visor de videos integrado
- ✅ Preview thumbnails
- ✅ Información de resolución

**Store:** `useVideoStore` - `/store/entities/video`

### 3. Audio View (`src/components/views/audio/`)

**Propósito:** Biblioteca de archivos de audio

**Características:**
- ✅ FileBrowser con items de audio
- ✅ Waveform opcional
- ✅ Metadatos de audio (duración, formato)
- ✅ Badge verde distintivo

**Store:** `useAudioStore` - `/store/entities/audio`

### 4. Documents View (`src/components/views/documents/`)

**Propósito:** Gestor de documentos escaneados

**Características:**
- ✅ FileBrowser con items de documento
- ✅ Detección automática de tipo (PDF, Word, Excel, etc.)
- ✅ Badge de tipo con color distintivo
- ✅ Tamaño de archivo

**Store:** `useDocumentStore` - `/store/entities/document`

**Tipos soportados:**
- PDF
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- PowerPoint (`.ppt`, `.pptx`)
- Text (`.txt`)
- Markdown (`.md`)

### 5. File3D View (`src/components/views/file3d/`)

**Propósito:** Galería de modelos y archivos 3D

**Características:**
- ✅ FileBrowser con items 3D
- ✅ Badge 3D animado
- ✅ Tipo de archivo 3D (OBJ, FBX, GLTF, etc.)
- ✅ Tamaño en MB

**Store:** `useFile3DStore` - `/store/entities/file-3d`

**Formatos soportados:**
- OBJ, FBX, GLTF, GLB
- DAE, 3DS, STL, PLY
- Blender (`.blend`)

### 6. JSON Files View (`src/components/views/json-files/`)

**Propósito:** Explorador de archivos JSON

**Características:**
- ✅ FileBrowser con items JSON
- ✅ Preview opcional de estructura
- ✅ Badge morado distintivo
- ✅ Tamaño de archivo

**Store:** `useJsonFileStore` - `/store/entities/json-file`

### 7. Folders View (`src/components/views/folders/`)

**Propósito:** Navegación de carpetas escaneadas

**Características:**
- ⚠️ NO usa FileBrowser (caso especial)
- ✅ Usa `FolderCard` en grid
- ✅ Preview compuesto de contenido
- ✅ Navegación a contenido de carpeta

**Store:** Usa hooks de API directamente (`useFolders`)

**Nota:** Las carpetas usan un patrón diferente porque necesitan navegación jerárquica y cards más grandes con información adicional.

## Items de Canvas

Cada tipo de archivo tiene un componente especializado para renderizado en el FileBrowser:

### BaseItem (`base-item.tsx`)

**Propósito:** Componente base con funcionalidad común

**Proporciona:**
- Click y double-click handlers
- Estados (selected, hovered, active)
- Context menu
- Keyboard navigation
- Helpers para thumbnails y fallbacks

**Props:**
```tsx
interface BaseItemProps {
  item: MediaItem;
  size: number;
  isSelected?: boolean;
  isHovered?: boolean;
  isActive?: boolean;
  onClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
  onDoubleClick?: (item: MediaItem) => void;
  onContextMenu?: (event: React.MouseEvent, item: MediaItem) => void;
}
```

### ImageItem (`image-item.tsx`)

**Características:**
- Thumbnail con object-cover
- Hover zoom effect
- Overlay con gradiente
- Resolución opcional (width × height)
- Detección de GIF animado

**Props extras:**
```tsx
showResolution?: boolean;
showDuration?: boolean;
```

### VideoItem (`video-item.tsx`)

**Características:**
- Thumbnail del video
- Botón de play superpuesto
- Overlay con gradiente
- Resolución del video

**Props extras:**
```tsx
showResolution?: boolean;
```

### AudioItem (`audio-item.tsx`)

**Características:**
- Waveform simplificada opcional
- Badge verde con ícono musical
- Formato de audio (MP3, WAV, etc.)
- Fallback con ícono de audio

**Props extras:**
```tsx
showWaveform?: boolean;
```

### DocumentItem (`document-item.tsx`)

**Características:**
- Badge amarillo con tipo de documento
- Detección automática de tipo por extensión
- Tamaño en KB
- Fallback con ícono de documento

**Props extras:**
```tsx
showDocumentType?: boolean;
```

**Tipos detectados:**
- PDF → Badge "PDF"
- Word → Badge "Word"
- Excel → Badge "Excel"
- PowerPoint → Badge "PowerPoint"
- Text → Badge "Text"
- Markdown → Badge "Markdown"
- Otros → Badge "DOC"

### File3DItem (`file3d-item.tsx`)

**Características:**
- Badge cyan animado "3D"
- Badge gris con tipo de archivo (OBJ, FBX, etc.)
- Tamaño en MB
- Detección de formato por extensión

**Props extras:**
```tsx
showFileType?: boolean;
```

### JsonItem (`json-item.tsx`)

**Características:**
- Badge morado "JSON"
- Preview opcional con sintaxis simplificada
- Tamaño en KB
- Estilo terminal/código

**Props extras:**
```tsx
showPreview?: boolean;
```

### FolderItem (`folder-item.tsx`)

**Características:**
- Preview compuesto usando `MediaThumbnail`
- Contador de items
- Navegación al hacer click
- Preview SVG generado por el backend

**Props extras:**
```tsx
showItemCount?: boolean;
```

## Patrón de Implementación

### Estructura de Vista Típica

```tsx
// 1. Imports
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { useXXXStore } from '@/store/entities/xxx';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';

export default function XXXView(_props: ViewProps) {
  // 2. Estado del store
  const items = useXXXStore((s) => s.items);
  const isLoading = useXXXStore((s) => s.isLoading);
  const error = useXXXStore((s) => s.error);
  const fetchItems = useXXXStore((s) => s.fetchItems);

  // 3. Inicialización (solo una vez)
  const hasInitRef = useRef(false);
  useEffect(() => {
    if (!hasInitRef.current && items.length === 0 && !isLoading) {
      hasInitRef.current = true;
      fetchItems();
    }
  }, [items.length, isLoading, fetchItems]);

  // 4. Visor de archivos
  const { openViewer } = useFileViewerStore();

  // 5. Handlers
  const handleClick = useCallback((item: AnyEntityWithStats) => {
    // Acción al hacer click simple
  }, []);

  const handleDoubleClick = useCallback((item: AnyEntityWithStats) => {
    // Abrir visor
    openViewer(items, currentIndex);
  }, [items, openViewer]);

  // 6. Manejo de errores
  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchItems} />;
  }

  // 7. Render
  return (
    <div className="h-full">
      {/* Toolbar con título y stats */}
      <div className="border-b px-3 py-2">
        <h2>Vista Title</h2>
        <p>{items.length} items</p>
      </div>

      {/* FileBrowser */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <FileBrowser
          items={items}
          isLoading={isLoading}
          onItemClick={handleClick}
          onItemDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  );
}
```

### Store Pattern

Todos los stores de archivos siguen el mismo patrón:

```tsx
interface XXXStore {
  // Estado
  items: XXX[] | Record<string, XXX>;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchItems: () => Promise<void>;
  addItem: (item: XXX) => void;
  updateItem: (id: string, data: Partial<XXX>) => void;
  deleteItem: (id: string) => void;

  // Helpers
  getById: (id: string) => XXX | undefined;
  clearError: () => void;
}
```

## FileBrowser

El componente central para mostrar archivos con alto rendimiento.

### Características Principales

1. **Virtualización Canvas** - Renderiza solo items visibles
2. **Múltiples Vistas** - Grid, List, Masonry, Cards, Table
3. **Selección Múltiple** - Click + Ctrl/Shift, drag selection
4. **Búsqueda y Filtros** - Integrados en la barra de herramientas
5. **Ordenamiento** - Por nombre, fecha, tamaño, tipo
6. **Context Menu** - Click derecho para acciones
7. **Keyboard Navigation** - Flechas, Enter, Espacio
8. **Drag & Drop** - Para reorganizar o mover archivos

### Props Principales

```tsx
interface FileBrowserProps {
  items: AnyEntityWithStats[];
  isLoading?: boolean;
  onItemClick?: (item: AnyEntityWithStats) => void;
  onItemDoubleClick?: (item: AnyEntityWithStats) => void;
  className?: string;
}
```

### Modos de Vista

- **Grid** (default) - Grid con tamaño ajustable
- **List** - Lista con detalles en columnas
- **Masonry** - Grid con alturas variables (ideal para imágenes)
- **Cards** - Cards más grandes con más información
- **Table** - Tabla con todas las propiedades
- **Canvas** - Modo de alto rendimiento con virtualización

### Rendimiento

- ✅ Virtualización: Solo renderiza 20-50 items visibles
- ✅ Canvas rendering: 60 FPS con miles de items
- ✅ Lazy loading: Thumbnails se cargan on-demand
- ✅ Image caching: Cache de ImageBitmap para thumbnails
- ✅ Prefetch inteligente: Prefetch con overscan y debouncing

## Mejores Prácticas

### 1. Siempre Usar FileBrowser para Archivos

✅ **Correcto:**
```tsx
<FileBrowser
  items={images}
  onItemDoubleClick={(img) => openViewer(images, idx)}
/>
```

❌ **Incorrecto:**
```tsx
<div className="grid">
  {images.map(img => <ImageCard image={img} />)}
</div>
```

**Razón:** FileBrowser maneja virtualización, selección, ordenamiento, etc.

### 2. Inicializar Store Solo Una Vez

✅ **Correcto:**
```tsx
const hasInitRef = useRef(false);
useEffect(() => {
  if (!hasInitRef.current && items.length === 0 && !isLoading) {
    hasInitRef.current = true;
    fetchItems();
  }
}, [items.length, isLoading, fetchItems]);
```

❌ **Incorrecto:**
```tsx
useEffect(() => {
  fetchItems(); // Se ejecuta en cada render
}, []);
```

### 3. Manejar Estados de Carga

✅ **Correcto:**
```tsx
if (error) return <ErrorDisplay />;
if (isLoading && items.length === 0) return <LoadingScreen />;
return <FileBrowser items={items} isLoading={isLoading} />;
```

**Razón:** FileBrowser puede mostrar loading overlays para actualizaciones incrementales.

### 4. Usar Callbacks Memoizados

✅ **Correcto:**
```tsx
const handleClick = useCallback((item) => {
  console.log(item);
}, []);
```

**Razón:** Evita recrear funciones en cada render.

### 5. Integrar con Visores Apropiados

- **Imágenes** → `useImageViewerStore`
- **Videos/Audio** → `useFileViewerStore`
- **Documentos** → Viewer específico o descarga

## Resumen de Archivos

| Tipo | Vista | Item | Store | Visor |
|------|-------|------|-------|-------|
| **Images** | `all-images-view.tsx` | `image-item.tsx` | `useImageStore` | `useImageViewer` |
| **Videos** | `videos-view.tsx` | `video-item.tsx` | `useVideoStore` | `useFileViewerStore` |
| **Audio** | `audio-view.tsx` | `audio-item.tsx` | `useAudioStore` | `useFileViewerStore` |
| **Documents** | `documents-view.tsx` | `document-item.tsx` | `useDocumentStore` | - |
| **3D Files** | `file3d-view.tsx` | `file3d-item.tsx` | `useFile3DStore` | - |
| **JSON** | `json-files-view.tsx` | `json-item.tsx` | `useJsonFileStore` | - |
| **Folders** | `folders-view.tsx` | `folder-item.tsx` | `useFolders` (API) | - |

## Próximos Pasos

### Mejoras Potenciales

1. **Viewers Especializados**
   - Document viewer (PDF, Office)
   - 3D model viewer (Three.js)
   - JSON viewer con syntax highlighting

2. **Metadata Enriquecida**
   - EXIF para imágenes
   - ID3 tags para audio
   - Video codec info

3. **Acciones en Batch**
   - Mover múltiples archivos
   - Agregar tags en batch
   - Export/download múltiple

4. **Filtros Avanzados**
   - Por fecha, tamaño, tipo
   - Favoritos
   - Asociaciones con entidades

## Conclusión

El sistema de vistas de archivos está bien estructurado y consistente:

- ✅ Todas las vistas usan FileBrowser
- ✅ Todos los items siguen el patrón BaseItem
- ✅ Todos los stores usan la misma estructura
- ✅ Excelente rendimiento con virtualización canvas
- ✅ Soporte completo para todos los tipos de archivo

El patrón es fácil de extender para nuevos tipos de archivo siguiendo los ejemplos existentes.
