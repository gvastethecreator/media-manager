# NO BORRAR

Este proyecto es una aplicación moderna de gestión y visualización de archivos multimedia diseñada para proporcionar una experiencia fluida y eficiente en la organización y visualización de grandes colecciones de medios locales.

# Stack Tecnológico

## Front End

- **Next.js 15** - con App Router
- **React 19** - con Server Components
- **Tailwind CSS** - para estilos
- **shadcn/ui** - para componentes de UI
- **Zustand** - para gestión de estado
- **Jest** - para testing
- **Motion** - para animaciones
- **Lucide React** - para iconos
- **Typescript** - para tipado estático

## Back End

- **SQLite 3** - para base de datos local
- **Prisma ORM** - para ORM
- **Next.js API Routes** - para endpoints
- **Node.js fs/promises** - para manipulación de archivos

### Otras dependencias

- **Event Source Polyfill** - para soporte de eventos en navegadores antiguos
- **Event Source Stream** - para soporte de eventos en navegadores antiguos
- **Tanstack Query** - para gestión de datos
- **Bull** - para procesamiento de imágenes
- **Chokidar** - para monitoreo de cambios en carpetas
- **Exifr** - para extraer metadatos de imágenes
- **Sharp** - para procesamiento de imágenes
- **React Scan** - para debug de renderizado
- **React Color** - para color picker
- **Next Themes** - para gestión de temas
- **Eslint** - para linting

## 📝 Documentación del Proyecto (05/01/2024)

### 🎯 Tarea Actual: Documentación Detallada de Servicios y Componentes

#### Objetivo

- Crear documentación detallada de cada servicio y componente del proyecto
- Organizar la documentación en una estructura clara y mantenible
- Facilitar el entendimiento y mantenimiento del código

#### Estructura de Documentación

```
docs/
├── services/        # Documentación de servicios
│   ├── image-service.md
│   ├── thumbnail-service.md
│   ├── files-service.md
│   ├── folder-service.md
│   ├── watcher-service.md
│   ├── collection-service.md
│   ├── tag-service.md
│   └── favorite-service.md
├── components/      # Documentación de componentes
├── FRONTEND.md     # Guía general frontend
├── BACKEND.md      # Guía general backend
└── PRD.md         # Documento de requerimientos
```

#### Plan de Trabajo

1. **Análisis Inicial**

   - [x] Revisión de estructura actual
   - [x] Creación de carpetas de documentación
   - [x] Identificación de servicios principales
   - [ ] Identificación de componentes clave

2. **Documentación de Servicios**

   - [x] Servicio de Imágenes
   - [x] Servicio de Thumbnails
   - [x] Servicio de Archivos
   - [x] Servicio de Carpetas
   - [x] Servicio de Monitoreo
   - [x] Servicio de Colecciones
   - [x] Servicio de Etiquetas
   - [x] Servicio de Favoritos
   - [ ] Servicio de Búsqueda
   - [ ] Servicio de Estadísticas
   - [ ] Servicio de Perfiles
   - [ ] Servicio de Usuarios

3. **Documentación de Componentes**

   - [ ] Componentes de Layout
   - [ ] Componentes de Vista
   - [ ] Componentes de UI
   - [ ] Componentes de Features
   - [ ] Componentes Core

4. **Revisión y Validación**
   - [ ] Verificación de completitud
   - [ ] Validación de exactitud
   - [ ] Actualización de referencias

#### Estado Actual

- [x] Creadas carpetas base
- [x] Documentados 8 servicios principales
- [x] Añadidos diagramas de flujo a servicios
- [x] Documentados servicios restantes
- [ ] Pendiente documentación de componentes

#### Mejoras en Documentación

1. **Diagramas de Flujo**

   - Añadidos diagramas Mermaid para visualización de procesos
   - Documentados flujos principales de cada servicio
   - Incluidos escenarios de error y casos especiales
   - Mejorada comprensión de la arquitectura

2. **Servicios Actualizados**

   - Servicio de Imágenes: 4 diagramas
   - Servicio de Thumbnails: 4 diagramas
   - Servicio de Archivos: 4 diagramas
   - Servicio de Carpetas: 4 diagramas
   - Servicio de Monitoreo: 4 diagramas
   - Servicio de Colecciones: 4 diagramas
   - Servicio de Etiquetas: 4 diagramas
   - Servicio de Favoritos: 4 diagramas

3. **Tipos de Diagramas**
   - Flujos de proceso principales
   - Sistemas de caché y optimización
   - Manejo de errores
   - Integración entre servicios

#### Próximos Pasos

1. Comenzar con la documentación de componentes core
2. Establecer plantillas de documentación
3. Integrar con documentación existente
4. Revisar y validar documentación

#### Servicios Documentados

1. **Servicio de Imágenes**

   - Procesamiento de imágenes
   - Gestión de thumbnails
   - Sistema de caché
   - Optimizaciones

2. **Servicio de Thumbnails**

   - Generación de miniaturas
   - Sistema de cola
   - Monitoreo y estadísticas
   - Optimizaciones

3. **Servicio de Archivos**

   - Gestión de archivos
   - Mapeo de tipos
   - Relaciones y metadata
   - Optimizaciones

4. **Servicio de Carpetas**

   - Indexación de carpetas
   - Sistema de callbacks
   - Monitoreo de progreso
   - Gestión de errores

5. **Servicio de Monitoreo**

   - Observación de cambios
   - Sistema de eventos
   - Cliente/Servidor
   - Optimizaciones

6. **Servicio de Colecciones**

   - Organización de imágenes
   - Metadatos personalizados
   - Estadísticas integradas
   - Gestión eficiente

7. **Servicio de Etiquetas**

   - Categorización flexible
   - Sistema de colores
   - Atajos de teclado
   - Búsqueda integrada

8. **Servicio de Favoritos**

   - Marcado de imágenes
   - Gestión por usuario
   - Acceso rápido
   - Estadísticas personales

9. **Servicio de Estadísticas**

   - Tracking de eventos
   - Rankings y métricas
   - Sistema de caché
   - Análisis de uso

10. **Servicio de Perfiles**

    - Gestión de preferencias
    - Temas y personalización
    - Sincronización
    - Activación/Desactivación

11. **Servicio de Usuarios**
    - Gestión de cuentas
    - Relaciones con recursos
    - Validaciones
    - Seguridad

#### Stack Tecnológico

##### Frontend

- Next.js 15 (App Router)
- React 19 (Server Components)
- Tailwind CSS
- Zustand
- TanStack Query

##### Backend

- SQLite 3
- Prisma ORM
- Next.js API Routes
- Node.js fs/promises

##### Herramientas

- Sharp (Procesamiento de imágenes)
- Chokidar (Monitoreo de archivos)
- Bull (Colas de trabajo)
- EventSource (Eventos en tiempo real)

#### Notas Importantes

- Los servicios están bien estructurados y documentados
- Se mantiene un patrón consistente en la documentación
- Se identifican áreas de mejora en cada servicio
- La documentación incluye tipos, interfaces y ejemplos
- Cada servicio tiene su propia documentación detallada
- Se mantiene consistencia en el formato y estructura
- Se incluyen ejemplos de código y tipos
- Se documentan áreas de mejora y optimizaciones

# EDITAR A PARTIR DE ACA

### 📝 Plan de Documentación de Componentes (05/01/2024)

#### Estructura de Documentación de Componentes

```
docs/components/
├── core/           # Componentes base y utilidades
├── features/       # Características específicas
├── layout/         # Componentes de estructura
├── panels/         # Paneles de la aplicación
├── ui/            # Componentes de interfaz reutilizables
└── views/         # Vistas principales
```

#### Plan de Trabajo para Componentes

#### Estado Actual de Documentación de Componentes (05/01/2024)

5. **UI Components** (Pendiente)

   - [ ] Buttons
   - [ ] Forms
   - [ ] Modals
   - [ ] Cards
   - [ ] Navigation
   - [ ] Data Display

6. **View Components** ✅
   - [x] All Images View
     - [x] Grid Layout
     - [x] File Management
     - [x] Sorting & Filtering
   - [x] Collections View
     - [x] Collection Grid
     - [x] Collection Management
     - [x] Item Organization
   - [x] Debug View
     - [x] System Monitoring
     - [x] Performance Tools
     - [x] Debug Features
   - [x] Favorites View
     - [x] Favorites Grid
     - [x] Quick Actions
     - [x] State Management
   - [x] Folders View
     - [x] Folder Structure
     - [x] Navigation
     - [x] File Operations
   - [x] Search View
     - [x] Search Interface
     - [x] Filter System
     - [x] Results Display
   - [x] Settings View
     - [x] Preferences
     - [x] System Settings
     - [x] Advanced Options
   - [x] Tags View
     - [x] Tag Management
     - [x] Tag Assignment
     - [x] Tag Organization

#### Documentación Completada

- [x] Empty State Component (`docs/components/core/empty-state.md`)
- [x] Loading Components (`docs/components/core/loading-components.md`)
- [x] Motion Component (`docs/components/core/motion.md`)
- [x] Theme Toggle Component (`docs/components/core/theme-toggle.md`)
- [x] File Grid Component (`docs/components/features/file-grid.md`)
- [x] File Viewer Component (`docs/components/features/file-viewer.md`)
- [x] File Actions (`docs/components/features/file-actions.md`)
- [x] Search Components (`docs/components/features/search.md`)
- [x] Main Layout (`docs/components/layout/main-layout.md`)
- [x] Nav Panel (`docs/components/layout/nav-panel.md`)
- [x] Right Panel (`docs/components/layout/right-panel.md`)
- [x] Details Panel (`docs/components/panels/details-panel.md`)
- [x] Stats Panel (`docs/components/panels/stats-panel.md`)
- [x] View Container (`docs/components/views/view-container.md`)
- [x] All Images View (`docs/components/views/all-images.md`)
- [x] Collections View (`docs/components/views/collections.md`)
- [x] Debug View (`docs/components/views/debug.md`)
- [x] Favorites View (`docs/components/views/favorites.md`)
- [x] Folders View (`docs/components/views/folders.md`)
- [x] Search View (`docs/components/views/search.md`)
- [x] Settings View (`docs/components/views/settings.md`)
- [x] Tags View (`docs/components/views/tags.md`)

#### Próximos Pasos

1. ~~Documentar Theme Components~~ ✅
2. ~~Comenzar con Feature Components~~ ✅
   - ~~Analizar File Grid~~ ✅
   - ~~Documentar File Viewer~~ ✅
   - ~~Revisar File Actions~~ ✅
   - ~~Explorar Search Components~~ ✅
3. ~~Seguir con Layout Components~~ ✅
   - ~~Documentar Main Layout~~ ✅
   - ~~Analizar Nav Panel~~ ✅
   - ~~Revisar Right Panel~~ ✅
4. ~~Continuar con Panel Components~~ ✅
   - ~~Documentar Details Panel~~ ✅
   - ~~Analizar Stats Panel~~ ✅
5. ~~Documentar View Components~~ ✅
   - ~~Documentar ViewContainer~~ ✅
   - ~~Analizar vistas principales~~ ✅
   - ~~Revisar integración~~ ✅

#### Notas de Progreso

- Se ha completado la documentación de todos los componentes core
- Se han documentado todos los componentes de características
- Se ha completado la documentación de los componentes de layout
- Se ha completado la documentación de los componentes de panel
- Se ha completado la documentación de los componentes de vista
- Se mantiene una estructura consistente en la documentación
- Se incluyen diagramas de flujo para visualizar la lógica
- Se documentan consideraciones de performance y accesibilidad
- Se mantienen ejemplos de uso claros y prácticos
- Cada componente tiene su propia documentación detallada
- Se han identificado patrones comunes y mejores prácticas
- Se documentan mejoras futuras y optimizaciones pendientes
- Se mantiene un seguimiento claro del progreso
- Se ha mejorado la documentación de interacciones entre componentes
- Se han documentado las integraciones con los stores
- Se ha mejorado la documentación de la estructura de la aplicación
- Se han documentado los flujos de datos entre componentes
- Se ha completado la documentación de todas las vistas principales
- Se han documentado las integraciones entre vistas y stores
- Se han identificado áreas de mejora en cada vista
