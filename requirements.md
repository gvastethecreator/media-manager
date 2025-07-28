# Requirements Document - File Browser Improvements

## Introduction

Este proyecto tiene como objetivo mejorar significativamente el navegador de archivos (file-browser.tsx) implementando funcionalidades avanzadas de navegación, visualización y gestión de archivos. El navegador actual ya tiene una base sólida con:

**Arquitectura Existente:**
- ✅ Soporte multi-entidad con `AnyEntityWithStats` y `EntityStatsType`
- ✅ Sistema completo de vistas: `ListView`, `GridView`, `CardsView`, `MasonryView`, `TrueMasonryView`
- ✅ Virtualización avanzada con `base-virtualized-view.tsx` y TanStack Virtual
- ✅ Sistema de stores por entidad (useImageStore, useVideoStore, useAudioStore, etc.)
- ✅ Sistema de cards completo con `EntityCard` y configuraciones de layout
- ✅ Menú contextual implementado con `context-menu/` directory completo
- ✅ Hooks especializados: `use-filtered-data`, `use-grid-virtualizer`, `use-thumbnail-loader`
- ✅ Configuración de grid en `config/grid-config.ts`
- ✅ File viewer funcional con navegación por teclado
- ✅ Sistema de servicios completo (file, settings, toast, etc.)
- ✅ Panel de detalles con `details-panel/` y registry system
- ✅ Sistema de configuración avanzado con transformers y validators

**Áreas de Mejora Identificadas:**
- Menú contextual necesita operaciones adicionales (copiar, pegar, renombrar, mover)
- Vistas necesitan mostrar más metadata y ser más personalizables
- Falta soporte completo para todos los tipos de EntityStatsType en file viewer
- Necesita sistema de selección drag and drop
- Falta integración de shortcuts de teclado
- Necesita sistema de progreso para operaciones largas

## Requirements

### Requirement 1 - Enhanced Context Menu System

**User Story:** Como usuario, quiero poder hacer click derecho en archivos y carpetas para acceder a opciones de gestión avanzadas, para poder realizar acciones comunes de manera eficiente y tener acceso completo a todas las funcionalidades del sistema.

**Current State:** Sistema de menú contextual existente en `src/components/features/file-browser/context-menu/` con:
- `context-menu.tsx` - Componente principal implementado
- `types.ts` - Tipos `ContextMenuAction` y `FileContextMenuProps` definidos
- `context-action-handler.ts` - Manejador de acciones básico implementado
- `components/` - Submenús para entidades implementados
- `hooks/use-entity-loader.ts` - Carga de entidades implementada

#### Acceptance Criteria

1. WHEN el usuario hace click derecho en un archivo THEN el sistema SHALL extender el menú contextual existente con opciones faltantes para el tipo de entidad (`EntityStatsType`)
2. WHEN el usuario hace click derecho en una carpeta THEN el sistema SHALL mostrar opciones específicas para carpetas usando el sistema existente
3. WHEN el usuario hace click derecho en espacio vacío THEN el sistema SHALL crear nuevo `EmptySpaceContextMenu` component
4. WHEN el usuario selecciona múltiples elementos y hace click derecho THEN el sistema SHALL crear nuevo `MultiSelectionContextMenu` component
5. WHEN el usuario selecciona "Copiar" THEN el sistema SHALL extender `context-action-handler.ts` con clipboard operations
6. WHEN el usuario selecciona "Pegar" THEN el sistema SHALL implementar paste usando existing file service
7. WHEN el usuario selecciona "Renombrar" THEN el sistema SHALL usar existing `renameFile` from file service con inline editing
8. WHEN el usuario selecciona "Eliminar" THEN el sistema SHALL usar existing `deleteFile` from file service con confirmación
9. WHEN el usuario selecciona "Descargar" THEN el sistema SHALL mejorar existing download en `context-action-handler.ts`
10. WHEN el usuario selecciona "Mover" THEN el sistema SHALL usar existing `moveFile` from file service
11. WHEN el usuario selecciona "Agregar a..." THEN el sistema SHALL usar existing submenus en `components/enhanced-submenu.tsx`
12. WHEN el usuario selecciona "Ver en explorador" THEN el sistema SHALL mejorar existing implementation en `context-action-handler.ts`
13. WHEN el usuario selecciona "Abrir" THEN el sistema SHALL usar existing `useFileViewerStore` integration
14. WHEN el usuario selecciona "Marcar" THEN el sistema SHALL usar existing `useSelectionStore` integration
15. WHEN el usuario selecciona "Seleccionar todo" en espacio vacío THEN el sistema SHALL usar existing `setSelectedIds` from selection store
16. WHEN el menú contextual está abierto THEN el sistema SHALL agregar keyboard navigation al existing menu system
17. WHEN el usuario hace click fuera del menú THEN el sistema SHALL usar existing menu close behavior

### Requirement 2 - Enhanced View Modes

**User Story:** Como usuario, quiero diferentes modos de visualización para archivos, para poder elegir la vista que mejor se adapte a mi flujo de trabajo.

**Current State:** Sistema completo de vistas existente en `src/components/features/file-browser/views/` con:
- `list-view.tsx` - Vista de lista básica implementada
- `grid-view.tsx` - Vista de grid implementada
- `cards-view.tsx` - Vista de cards implementada con EntityCard integration
- `masonry-view.tsx` - Vista masonry implementada
- `true-masonry-view.tsx` - Vista masonry alternativa
- `base-virtualized-view.tsx` - Sistema de virtualización base
- `config/grid-config.ts` - Configuraciones de layout existentes
- `hooks/use-grid-virtualizer.ts` - Hook de virtualización implementado

#### Acceptance Criteria

1. WHEN el usuario selecciona vista de lista THEN el sistema SHALL enhancer existing `list-view.tsx` con columnas configurables y metadata detallada
2. WHEN el usuario selecciona vista de mosaico THEN el sistema SHALL mejorar existing `masonry-view.tsx` para respetar aspect ratios usando existing grid config
3. WHEN el usuario selecciona vista de grid THEN el sistema SHALL enhancer existing `grid-view.tsx` con opciones de personalización usando existing `GridConfig`
4. WHEN el usuario selecciona vista de cards THEN el sistema SHALL enhancer existing `cards-view.tsx` con más interactividad usando existing `EntityCard`
5. WHEN el usuario está en vista de lista THEN el sistema SHALL usar existing entity data para mostrar metadata completa
6. WHEN el usuario está en vista de mosaico THEN el sistema SHALL optimizar existing masonry algorithm para mejor balance visual
7. WHEN el usuario está en vista de grid THEN el sistema SHALL usar existing `grid-config.ts` para personalización de thumbnails y aspect ratio
8. WHEN el usuario está en vista de cards THEN el sistema SHALL usar existing card layout system para hover interactions
9. WHEN el usuario cambia configuraciones de vista THEN el sistema SHALL usar existing settings service para persistir preferencias
10. WHEN el usuario redimensiona la ventana THEN el sistema SHALL usar existing `base-virtualized-view.tsx` para adaptación responsiva

### Requirement 3 - Multi-File Type Support

**User Story:** Como usuario, quiero poder navegar y visualizar diferentes tipos de archivos, para tener una experiencia unificada independientemente del tipo de contenido.

#### Acceptance Criteria

1. WHEN el sistema encuentra un archivo de video THEN el sistema SHALL mostrar una tarjeta específica para videos
2. WHEN el sistema encuentra un archivo de audio THEN el sistema SHALL mostrar una tarjeta específica para audios
3. WHEN el sistema encuentra un documento THEN el sistema SHALL mostrar una tarjeta específica para documentos
4. WHEN el sistema encuentra un archivo 3D THEN el sistema SHALL mostrar una tarjeta específica para modelos 3D
5. WHEN el sistema encuentra un archivo JSON THEN el sistema SHALL mostrar una tarjeta específica para JSON
6. WHEN el sistema encuentra un archivo Markdown THEN el sistema SHALL mostrar una tarjeta específica para Markdown
7. WHEN el sistema encuentra un tipo de archivo no soportado THEN el sistema SHALL mostrar una tarjeta genérica
8. WHEN el usuario hace click en cualquier tipo de archivo THEN el sistema SHALL abrir el archivo en file-viewer.tsx
9. WHEN el sistema carga archivos THEN el sistema SHALL detectar automáticamente el tipo basado en extensión y metadata
10. WHEN el usuario filtra por tipo THEN el sistema SHALL mostrar solo archivos del tipo seleccionado

### Requirement 4 - File Viewer Integration

**User Story:** Como usuario, quiero poder abrir y visualizar archivos directamente desde el navegador, para tener una experiencia fluida de navegación y visualización.

#### Acceptance Criteria

1. WHEN el usuario hace doble click en un archivo THEN el sistema SHALL abrir file-viewer.tsx con el archivo seleccionado
2. WHEN file-viewer.tsx se abre THEN el sistema SHALL soportar todos los tipos de archivos implementados
3. WHEN el usuario navega entre archivos en el viewer THEN el sistema SHALL mantener el contexto del navegador
4. WHEN el usuario cierra el viewer THEN el sistema SHALL regresar al navegador manteniendo la selección
5. WHEN el viewer encuentra un error THEN el sistema SHALL mostrar un mensaje de error apropiado
6. WHEN el usuario usa atajos de teclado THEN el sistema SHALL responder apropiadamente en ambos componentes

### Requirement 5 - Toolbar and Status Bar Integration

**User Story:** Como usuario, quiero que la barra de herramientas y la barra de estado estén completamente integradas con el navegador, para tener acceso rápido a todas las funciones.

#### Acceptance Criteria

1. WHEN el usuario está en el navegador THEN la barra de herramientas SHALL mostrar acciones relevantes al contexto
2. WHEN el usuario selecciona elementos THEN la barra de herramientas SHALL actualizar las acciones disponibles
3. WHEN el usuario cambia de vista THEN la barra de herramientas SHALL reflejar las opciones de la vista actual
4. WHEN el sistema procesa archivos THEN la barra de estado SHALL mostrar el progreso
5. WHEN el usuario selecciona elementos THEN la barra de estado SHALL mostrar información de selección
6. WHEN ocurren errores THEN la barra de estado SHALL mostrar notificaciones apropiadas
7. WHEN el usuario usa la barra de herramientas THEN las acciones SHALL ejecutarse en el contexto del navegador
8. WHEN el sistema cambia de estado THEN ambas barras SHALL actualizarse en tiempo real

### Requirement 6 - Performance Optimization

**User Story:** Como usuario, quiero que el navegador mantenga un rendimiento fluido incluso con grandes volúmenes de archivos, para tener una experiencia responsiva.

#### Acceptance Criteria

1. WHEN el navegador carga más de 1000 archivos THEN el sistema SHALL mantener 60 FPS
2. WHEN el usuario se desplaza por la vista THEN el sistema SHALL usar virtualización para optimizar rendimiento
3. WHEN el sistema carga thumbnails THEN el sistema SHALL usar lazy loading
4. WHEN el usuario cambia de vista THEN la transición SHALL ser suave y sin bloqueos
5. WHEN el sistema procesa archivos THEN el sistema SHALL usar web workers cuando sea apropiado
6. WHEN el usuario interactúa con elementos THEN la respuesta SHALL ser inmediata (<100ms)
7. WHEN el sistema maneja memoria THEN el sistema SHALL limpiar recursos no utilizados
8. WHEN el navegador está inactivo THEN el sistema SHALL reducir el uso de recursos

### Requirement 7 - Drag and Drop Selection

**User Story:** Como usuario, quiero poder seleccionar múltiples archivos arrastrando el mouse, para poder realizar acciones masivas de manera eficiente.

#### Acceptance Criteria

1. WHEN el usuario arrastra el mouse sobre elementos THEN el sistema SHALL crear un área de selección visual
2. WHEN el área de selección toca elementos THEN el sistema SHALL resaltarlos como seleccionados
3. WHEN el usuario suelta el mouse THEN el sistema SHALL confirmar la selección de elementos tocados
4. WHEN el usuario mantiene Ctrl mientras arrastra THEN el sistema SHALL agregar a la selección existente
5. WHEN el usuario mantiene Shift mientras arrastra THEN el sistema SHALL extender la selección
6. WHEN la selección está activa THEN el sistema SHALL mostrar feedback visual claro
7. WHEN el usuario cancela la selección (Escape) THEN el sistema SHALL limpiar la selección
8. WHEN hay elementos seleccionados THEN el sistema SHALL habilitar acciones masivas
###
 Requirement 8 - User Experience Improvements

**User Story:** Como usuario, quiero una experiencia de navegación fluida y sin interferencias, para poder interactuar naturalmente con los archivos.

**Current Issues:**
- CSS `user-select` puede interferir con la selección de elementos
- No hay manera de deseleccionar elementos haciendo click en espacio vacío

#### Acceptance Criteria

1. WHEN el usuario intenta seleccionar texto en elementos del navegador THEN el sistema SHALL prevenir la selección de texto para evitar conflictos
2. WHEN el usuario hace click en un espacio vacío del navegador THEN el sistema SHALL deseleccionar todos los elementos seleccionados
3. WHEN el usuario hace click en un espacio vacío THEN el sistema SHALL usar existing `clearSelection` from useSelectionStore
4. WHEN el sistema previene selección de texto THEN el sistema SHALL mantener accesibilidad para lectores de pantalla
5. WHEN el usuario interactúa con elementos THEN el sistema SHALL proporcionar feedback visual claro sin interferencias
6. WHEN el usuario navega con teclado THEN el sistema SHALL mantener indicadores de foco visibles
7. WHEN el sistema está en modo de alto contraste THEN el sistema SHALL mantener visibilidad de selección
8. WHEN el usuario hace drag selection THEN el sistema SHALL no conflictuar con la prevención de selección de texto