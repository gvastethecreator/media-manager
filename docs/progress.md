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

### Últimas 4 tareas

1. **[2024-01-08] Optimización del servicio de miniaturas**

   - Refactorización del servicio de miniaturas para mejorar el manejo de errores y eventos
   - Implementación de optimización de miniaturas con Sharp
   - Actualización del componente ThumbnailsSection para usar el nuevo servicio
   - Corrección de errores en las rutas de API de miniaturas

2. **[2024-01-07] Mejoras en el sistema de caché**

   - Implementación de caché para metadatos de imágenes
   - Optimización del rendimiento en la carga de miniaturas
   - Corrección de errores en el manejo de caché

3. **[2024-01-06] Actualización del sistema de indexación**

   - Mejoras en el procesamiento de carpetas
   - Implementación de eventos SSE para seguimiento en tiempo real
   - Corrección de errores en el manejo de rutas

4. **[2024-01-05] Implementación de observador de carpetas**
   - Sistema de monitoreo de cambios en carpetas
   - Integración con el servicio de indexación
   - Manejo de eventos de sistema de archivos
