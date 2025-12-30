# File Browser - Nueva Estructura de Vistas

## 📁 Estructura Reorganizada

La estructura de vistas del file-browser ha sido reorganizada en carpetas especializadas:

```
src/components/features/file-browser/views/
├── canvas/          # Vistas basadas en Canvas (actuales)
├── virtualized/     # Vistas virtualizadas (futuro)
└── webgl/          # Vistas WebGL (futuro)
```

## 🎨 Vista Canvas - Items Especializados

Se han creado componentes de items especializados para cada tipo de archivo:

### Componentes de Items

- **`BaseItem`** - Componente base con funcionalidades comunes
- **`ImageItem`** - Especializado para imágenes con overlays y resolución
- **`VideoItem`** - Con indicador de play y resolución
- **`AudioItem`** - Con waveform simplificada y indicadores
- **`FolderItem`** - Con emoji personalizable y contador de items
- **`DocumentItem`** - Con indicador de tipo de documento y tamaño
- **`JsonItem`** - Con preview de contenido JSON
- **`File3DItem`** - Con indicadores animados y tipos de archivo 3D

### Características de los Items

#### BaseItem
- Soporte para teclado (Enter/Space)
- Estados visuales (selected, hovered, active)
- Accessibility completo (ARIA labels, roles)
- Props de eventos comunes (onClick, onDoubleClick, onContextMenu)

#### Especialización por Tipo
- **Imágenes**: Hover effects, resolución, tipo de imagen
- **Videos**: Botón de play, resolución, overlays
- **Audio**: Waveform visual, tipo de codec
- **Carpetas**: Emoji personalizable, contador de elementos
- **Documentos**: Tipo de archivo, tamaño formateado
- **JSON**: Preview del contenido, indicador de tipo
- **Archivos 3D**: Tipo de formato, indicadores animados

## 🔧 Migración Realizada

### Archivos Movidos
Todas las vistas existentes se movieron de:
```
views/*.tsx → views/canvas/*.tsx
```

### Imports Actualizados
- `file-browser.tsx` - Rutas actualizadas a `views/canvas/`
- Todas las vistas - Imports relativos corregidos
- Archivos canvas internos - Rutas ajustadas

### Validación
- ✅ TypeScript sin errores
- ✅ Servidor funcionando correctamente
- ✅ Todas las vistas accesibles

## 🚀 Próximos Pasos

### Vista Virtualizada
- Implementar usando `@tanstack/react-virtual`
- Optimizar para listas grandes (>1000 items)
- Soporte para scroll infinito

### Vista WebGL
- Renderizado 3D para archivos 3D
- Efectos visuales avanzados
- Performance optimizada para hardware acceleration

### Mejoras de Items
- Thumbnails dinámicos
- Animaciones de transición
- Preview on hover
- Drag & drop mejorado

## 📊 Tipos Soportados

Los componentes soportan todos los tipos de archivo del sistema:

```typescript
type EntityType = 
  | 'image'      // → ImageItem
  | 'video'      // → VideoItem  
  | 'audio'      // → AudioItem
  | 'folder'     // → FolderItem
  | 'document'   // → DocumentItem
  | 'jsonFile'   // → JsonItem
  | 'file3d'     // → File3DItem
```

## 🎯 Compatibilidad

La reorganización mantiene compatibilidad completa:
- API sin cambios
- Props de componentes inalteradas
- Funcionalidad existente preservada
- Performance equivalent o mejorada
