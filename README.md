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

### Características Implementadas

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

### Vistas Disponibles

- 🖼️ Vista de galería (todas las imágenes)
- ⭐ Vista de favoritos
- 📂 Vista de carpetas
- 📕 Vista de colecciones
- 🔖 Vista de etiquetas
- 🔍 Vista de búsqueda
- 🛠️ Vista de debug



## Contribución

1. Revisa la documentación en `/docs`
2. Sigue las guías de desarrollo
3. Asegúrate de añadir tests
4. Mantén la documentación actualizada

## Configuración

- 👥 Gestion de usuarios
- 📂 Gestion de carpetas indexadas
- 📕 Gestion de colecciones
- 🔖 Gestion de etiquetas
- 🖼️ Gestion de miniaturas

## Servicios Actuales

- 📂 Servicio de indexado de carpetas
- 📂 Servicio de monitoreo de carpetas
- 📂 Servicio de procesamiento de imágenes
- 🖼️ Servicio de generación de thumbnails
- 🗒️ Servicio de extracción de metadatos
- 📕 Servicio de gestión de colecciones
- 🔖 Servicio de gestión de etiquetas
- 👨🏻‍🦱 Servicio de gestión de usuarios
- 🧑🏻‍🦰 Servicio de gestión de perfiles

## Documentación Detallada a desarrollar

### Core Features

Consulta `/docs/features/` para documentación detallada de cada característica:

#### 1. Optimización y Rendimiento

- [Grid Performance](/docs/features/optimization/grid-performance.md)
- [Paginación y Scroll Infinito](/docs/features/optimization/pagination-infinite-scroll.md)

#### 2. Gestión de Archivos

- [Operaciones Batch](/docs/features/file-management/batch-operations.md)

#### 3. Interfaz de Usuario

- [Paneles Informativos](/docs/features/ui/info-panels.md)
- [Mejoras del Visualizador](/docs/features/viewer/image-viewer-improvements.md)

#### 4. Personalización

- [Temas y Performance](/docs/features/customization/themes-and-performance.md)

#### 5. Metadata y Edición

- [Gestión de Metadatos](/docs/features/metadata/metadata-management.md)

#### 6. Integración IA

- [Características IA](/docs/features/ai/ai-integration.md)

## Roadmap y Planificación

Consulta `/docs/ROADMAP.md` para ver la planificación detallada y prioridades del proyecto.