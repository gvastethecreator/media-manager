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

## 📝 Documentación del Proyecto

## 🚀 Progreso

### Últimas 4 tareas, si hay mas deben ir a changelog.md al final del archivo

1. **[2024-01-11] Optimización del Flujo de Inicialización**

   - Revisión y mejora del flujo de inicialización de la aplicación
   - Reorganización del orden de carga de servicios
   - Optimización de la pantalla de carga y estados visuales
   - Implementación de mejor manejo de errores y dependencias

2. **[2024-01-10] Separación de Componentes de Configuración**

   - Separación de FoldersSection y ThumbnailsSection en componentes independientes
   - Implementación de comunicación entre componentes
   - Optimización de la gestión de estado compartido
   - Mejora en la organización del código y responsabilidades

3. **[2024-01-10] Corrección del Sistema de Reindexado**

   - Análisis del flujo de eventos SSE en el proceso de reindexado
   - Corrección de la sincronización de estado en FoldersSection
   - Mejora en el manejo de tipos de eventos en EventsService
   - Optimización del manejo de progreso y estado

4. **[2024-01-09] Optimización para Server Components**

   - Refactorización del FileContext para Server Components
   - Migración de operaciones de base de datos al servidor
   - Implementación de Server Actions para operaciones de datos
   - Optimización del manejo de estado cliente/servidor
