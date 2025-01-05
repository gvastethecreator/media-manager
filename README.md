# Image Manager

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

## Estado actual del proyecto

### Características

- 🔄 Indexado completo de carpetas
- 🖼️ Generación de thumbnails
- 🗒️ Procesado de metadatos de imágenes
- 🖼️ Vista de grilla para las imágenes
- 🖼️ Visor avanzado de imagenes funcional
- 🎨 Tema claro/oscuro
- 💾 Base de datos local SQLite
- 📊 Estadísticas de carpetas y archivos
- ⚡ Navegación rápida y funcional
- 📈 Panel de estadisticas
- 📊 Panel de detalles basicos

### Vistas

- 🖼️ Vista de galería ( todas las imagenes )
- ⭐ Vista de favoritos
- 📂 Vista de carpetas
- 📕 Vista de colecciones
- 🔖 Vista de etiquetas
- 🔍 Vista de busqueda
- 🛠️ Vista de debug

## Configuración

- 👥 Gestion de usuarios
- 📂 Gestion de carpetas indexadas
- 📕 Gestion de colecciones
- 🔖 Gestion de etiquetas
- 🖼️ Gestion de miniaturas

### Servicios actuales

- 📂 Servicio de indexado de carpetas
- 📂 Servicio de monitoreo de carpetas
- 📂 Servicio de procesamiento de imágenes
- 🖼️ Servicio de generación de thumbnails
- 🗒️ Servicio de extracción de metadatos
- 📕 Servicio de gestión de colecciones
- 🔖 Servicio de gestión de etiquetas
- 👨🏻‍🦱 Servicio de gestión de usuarios
- 🧑🏻‍🦰 Servicio de gestión de perfiles

## Estructura del Proyecto

```
├───app
│   ├───actions
│   ├───api
│   │   ├───collections
│   │   │   └───[id]
│   │   │       ├───files
│   │   │       └───images
│   │   │           ├───all
│   │   │           └───id2
│   │   ├───favorites
│   │   ├───files
│   │   │   ├───folder
│   │   │   └───[id]
│   │   │       ├───download
│   │   │       ├───location
│   │   │       └───raw
│   │   ├───folders
│   │   │   ├───reindex
│   │   │   │   └───[id]
│   │   │   │       └───events
│   │   │   ├───stats
│   │   │   ├───test
│   │   │   ├───watch
│   │   │   ├───watched
│   │   │   └───[id]
│   │   │       ├───files
│   │   │       ├───images
│   │   │       │   └───all
│   │   │       ├───index
│   │   │       └───watch
│   │   ├───images
│   │   │   ├───all
│   │   │   ├───favorites
│   │   │   │   └───all
│   │   │   ├───reprocess-thumbnails
│   │   │   ├───thumbnail-stats
│   │   │   └───[id]
│   │   │       ├───favorite
│   │   │       ├───preview
│   │   │       └───thumbnail
│   │   │           └───generate
│   │   ├───profiles
│   │   │   └───[id]
│   │   │       └───activate
│   │   ├───seed
│   │   ├───settings
│   │   ├───stats
│   │   ├───system
│   │   │   ├───copy
│   │   │   ├───download
│   │   │   ├───open
│   │   │   └───status
│   │   ├───tags
│   │   │   └───[id]
│   │   │       ├───files
│   │   │       └───images
│   │   │           ├───all
│   │   │           ├───[id2]
│   │   │           └───[id]
│   │   └───thumbnails
│   │       ├───clean
│   │       ├───cleanup
│   │       ├───maintenance
│   │       ├───migrate
│   │       ├───optimize
│   │       ├───process
│   │       │   └───[folderId]
│   │       ├───reprocess
│   │       ├───stats
│   │       ├───validate
│   │       └───[id]
│   │           ├───delete
│   │           ├───download
│   │           ├───generate
│   │           └───preview
│   └───folders
│       └───[id]
│           └───view
├───components
│   ├───core
│   │   ├───data-display
│   │   │   ├───card-view
│   │   │   └───empty-state
│   │   ├───feedback
│   │   │   └───loading
│   │   ├───layout
│   │   │   └───main-layout
│   │   ├───navigation
│   │   │   ├───breadcrumbs
│   │   │   └───toolbar
│   │   └───theme
│   ├───features
│   │   ├───file-grid
│   │   └───file-viewer
│   │       └───components
│   ├───layout
│   ├───panels
│   │   ├───details
│   │   ├───nav
│   │   └───stats
│   ├───ui
│   └───views
│       ├───all-images
│       ├───collections
│       ├───debug
│       ├───favorites
│       ├───folders
│       ├───search
│       ├───settings
│       │   └───settings-sections
│       ├───shared
│       └───tags
├───config
├───context
├───hooks
├───lib
│   ├───constants
│   ├───contexts
│   ├───hooks
│   ├───sse
│   └───thumbnail
├───providers
├───services
│   └───watcher
├───store
├───tests
│   ├───api
│   ├───components
│   ├───integration
│   ├───mocks
│   └───unit
│       └───services
├───types
└───__tests__
    └───api
        └───folders
```

## Estado del Desarrollo

# Por desarrollar y planificar

- [ ] Funcionalidad de búsqueda detallada y funcional
- [ ] Sección de perfiles funcional e integrada
- [ ] Extracción completa de metadata y datos de generación ( AI )
- [ ] Optimización de rendimiento de la vista de grilla
- [ ] Panel de carpeta con información de la carpeta
- [ ] Panel de coleccion con información de la colección
- [ ] Panel de etiqueta con información de la etiqueta
- [ ] Panel de busqueda con información de la busqueda
- [ ] Vista de debug con información de la aplicación, documentación y otros
- [ ] Mejoras en los servicios de indexado, monitoreo y procesamiento de imágenes
- [ ] Tests para los servicios
- [ ] Tests para los componentes
- [ ] Paginado disponible para las vistas de grilla
- [ ] Scroll infinito para las vistas de grilla
- [ ] Toolbars para las vistas
- [ ] Mejoras en el visualizador de imágenes
- [ ] Nuevos temas de diferentes colores
- [ ] Modo performance sin animaciones
- [ ] Personalización de interfaz
- [ ] Gestión de favoritos
- [ ] Funcionalidad de marcar archivos
- [ ] Funcionalidad para empaquetar y descargar archivos marcados
- [ ] Funcionalidad para organizar archivos marcados y asignar colección, favoritos, etiquetas
- [ ] Funcionalidad para eliminar archivos marcados
- [ ] Navegación por teclado
- [ ] Funcionalidad para arrastrar y soltar archivos
- [ ] Funcionalidad de subcarpetas y tarjeta de carpeta para file-grid
- [ ] Edición de metadatos de archivos
- [ ] Edición básica de imagenes ( crop, rotación, zoom, etc )
- [ ] Renombrado avanzado de archivos
- [ ] Integración de procesado en batch para archivos seleccionados
- [ ] Interrogado de imagenes para usar con algún llm y generar prompts
- [ ] Generado de mind-maps a travez de metadata para hacer busqueda espacial
- [ ] Ordenado segun paleta de colores
- [ ] Organización de carpetas en el sistema de archivos de windows
