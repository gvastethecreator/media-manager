# File Viewer System

Sistema completo de visualización de archivos que soporta múltiples tipos de entidades.

## Componentes Implementados

### 1. MultiEntityViewer

**Archivo:** `multi-entity-viewer.tsx`

Viewer principal que determina automáticamente qué viewer específico usar basado en el tipo de entidad.

**Características:**

- Soporte para múltiples tipos de entidades
- Navegación con teclado (flechas, ESC)
- Transiciones suaves entre viewers
- Integración con el sistema de tipos EntityStatsType

**Uso:**

```tsx
import { MultiEntityViewer } from '@/components/features/file-viewer/multi-entity-viewer';

<MultiEntityViewer
	entities={entities}
	currentIndex={currentIndex}
	isOpen={isOpen}
	onClose={onClose}
	onIndexChange={onIndexChange}
/>;
```

### 2. VideoViewer

**Archivo:** `viewers/video-viewer.tsx`

Viewer especializado para archivos de video.

**Características:**

- Controles de reproducción (play/pause, seek, volumen)
- Pantalla completa
- Información de metadatos (duración, resolución, codec)
- Navegación entre videos
- Descarga de archivos

### 3. AudioViewer

**Archivo:** `viewers/audio-viewer.tsx`

Viewer especializado para archivos de audio.

**Características:**

- Controles de reproducción de audio
- Visualización de forma de onda (placeholder)
- Información de metadatos (artista, álbum, duración, bitrate)
- Lista de reproducción
- Controles de volumen

### 4. DocumentViewer

**Archivo:** `viewers/document-viewer.tsx`

Viewer para documentos PDF y archivos de texto.

**Características:**

- Vista previa de PDFs con iframe
- Navegación por páginas
- Controles de zoom y rotación
- Búsqueda en documento
- Soporte para archivos de texto
- Información de metadatos (páginas, palabras, autor)

### 5. GenericFileViewer

**Archivo:** `viewers/generic-file-viewer.tsx`

Viewer genérico para tipos de archivo no específicos.

**Características:**

- Categorización automática de archivos
- Vista previa de contenido para archivos de texto pequeños
- Iconos específicos por tipo de archivo
- Información detallada de metadatos
- Opciones de descarga y apertura externa

## Tipos de Archivo Soportados

### Imágenes

- Usa el `FileViewer` existente
- Formatos: JPG, PNG, GIF, WebP, SVG, etc.

### Videos

- Formatos: MP4, WebM, AVI, MOV, etc.
- Controles nativos del navegador

### Audio

- Formatos: MP3, WAV, FLAC, AAC, OGG, etc.
- Controles de audio personalizados

### Documentos

- PDFs: Vista previa con iframe
- Texto: TXT, MD, JSON, XML, CSV
- Office: DOC, DOCX, XLS, XLSX, PPT, PPTX (descarga/apertura externa)

### Archivos Genéricos

- Código: JS, TS, Python, Java, etc.
- Comprimidos: ZIP, RAR, 7Z, etc.
- Datos: JSON, XML, CSV, SQL, etc.
- Ejecutables: EXE, MSI, DMG, etc.

## Integración con EntityStatsType

El sistema está completamente integrado con el enum `EntityStatsType`:

```typescript
switch (entity.type) {
  case EntityStatsType.IMAGE:
    return <FileViewer />;
  case EntityStatsType.VIDEO:
    return <VideoViewer />;
  case EntityStatsType.AUDIO:
    return <AudioViewer />;
  case EntityStatsType.DOCUMENT:
    return <DocumentViewer />;
  default:
    return <GenericFileViewer />;
}
```

## Navegación y Controles

### Teclado

- `←` / `→`: Navegar entre archivos
- `ESC`: Cerrar viewer
- `Space`: Play/Pause (video/audio)
- `+` / `-`: Zoom (documentos/imágenes)
- `R`: Reset view (imágenes)

### Mouse

- Click fuera del contenido: Cerrar
- Rueda del mouse: Zoom (donde aplique)
- Doble click: Reset view (imágenes)

## Estructura de Archivos

```
file-viewer/
├── file-viewer.tsx              # Viewer original para imágenes
├── multi-entity-viewer.tsx      # Viewer principal multi-tipo
├── README.md                     # Esta documentación
└── viewers/
    ├── video-viewer.tsx          # Viewer de videos
    ├── audio-viewer.tsx          # Viewer de audio
    ├── document-viewer.tsx       # Viewer de documentos
    └── generic-file-viewer.tsx   # Viewer genérico
```

## Próximas Mejoras

1. **Viewer 3D**: Para archivos .obj, .fbx, .gltf
2. **Viewer de Código**: Syntax highlighting para archivos de código
3. **Viewer de Archivos**: Explorador de archivos comprimidos
4. **Mejoras de Accesibilidad**: Mejor soporte para lectores de pantalla
5. **Thumbnails**: Generación automática de miniaturas
6. **Streaming**: Soporte para archivos grandes

## Dependencias

- `motion`: Animaciones y transiciones
- `lucide-react`: Iconos
- Componentes UI: `Button`, `Badge`, `Input`, `Textarea`
- Tipos de entidades del sistema

## Notas de Implementación

- Todos los viewers siguen el mismo patrón de props
- Manejo consistente de errores y estados de carga
- Responsive design por defecto
- Soporte para temas claro/oscuro
- Optimización de rendimiento con lazy loading
