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

1. **[2024-01-12] Consolidación y Optimización de Servicios Core**

   - Análisis y optimización de servicios principales (ThumbnailService, ImageService, StatsService)
   - Mejora en la integración de servicios de caché y logging
   - Eliminación de duplicidad en llamadas y responsabilidades
   - Adaptación para Next.js 15 y Server Components

2. **[2024-01-11] Integración de Servicios de Gestión de Contenido**

   - Integración de FavoriteService, CollectionService y TagService
   - Optimización del ContextMenu y sus interacciones
   - Implementación de caché y gestión de estado
   - Mejora en el manejo de eventos y actualizaciones UI

3. **[2024-01-11] Optimización del Flujo de Inicialización**

   - Revisión y mejora del flujo de inicialización de la aplicación
   - Reorganización del orden de carga de servicios
   - Optimización de la pantalla de carga y estados visuales
   - Implementación de mejor manejo de errores y dependencias

4. **[2024-01-10] Separación de Componentes de Configuración**

   - Separación de FoldersSection y ThumbnailsSection en componentes independientes
   - Implementación de comunicación entre componentes
   - Optimización de la gestión de estado compartido
   - Mejora en la organización del código y responsabilidades

5. **[2024-01-10] Corrección del Sistema de Reindexado**

   - Análisis del flujo de eventos SSE en el proceso de reindexado
   - Corrección de la sincronización de estado en FoldersSection
   - Mejora en el manejo de tipos de eventos en EventsService
   - Optimización del manejo de progreso y estado

6. **[2024-01-09] Optimización para Server Components**

   - Refactorización del FileContext para Server Components
   - Migración de operaciones de base de datos al servidor
   - Implementación de Server Actions para operaciones de datos
   - Optimización del manejo de estado cliente/servidor

## Análisis y Mejoras de Servicios (2025-01-10)

## Problemas Identificados

### 1. Duplicación de Configuraciones
- Configuración de calidad de miniaturas duplicada en `thumbnail.service.ts` y `image.service.ts`
- Necesidad de unificar las configuraciones en un solo lugar

### 2. Inconsistencias en el Manejo de Caché
- `thumbnailCache` se usa en múltiples servicios sin una estrategia clara
- No hay una política de expiración consistente
- Falta manejo de errores unificado

### 3. Separación Cliente/Servidor
- Algunos servicios mezclan lógica de cliente y servidor
- `toast.service.ts` debe ser exclusivamente del lado del cliente
- Necesidad de separar endpoints y lógica de servidor

### 4. Gestión de Estados
- `stats.service.ts` utiliza eventos que podrían causar problemas en Next.js 15
- Necesidad de migrar a un sistema de estado más apropiado para Next.js

## Plan de Mejoras

### Fase 1: Refactorización de Servicios Base

1. Crear un servicio de configuración centralizado
   - Mover todas las configuraciones a `src/config/`
   - Implementar validación de configuración
   - Separar configuraciones de desarrollo y producción

2. Optimizar el sistema de caché
   - Implementar políticas de caché consistentes
   - Mejorar el manejo de errores
   - Añadir métricas de rendimiento

3. Separar lógica cliente/servidor
   - Mover `toast.service.ts` a `src/client/services/`
   - Crear endpoints API REST claros
   - Implementar validación de datos en endpoints

### Fase 2: Mejora de Servicios Específicos

1. Servicio de Imágenes
   - Unificar lógica de procesamiento de imágenes
   - Implementar mejor manejo de errores
   - Optimizar el procesamiento de miniaturas

2. Servicio de Estadísticas
   - Migrar a un sistema basado en Server Actions
   - Implementar cache invalidation apropiado
   - Mejorar el rendimiento de consultas

3. Sistema de Logging
   - Implementar niveles de log configurables
   - Añadir rotación de logs
   - Mejorar formato de logs para debugging

## Próximos Pasos

1. Implementar servicio de configuración centralizado
2. Refactorizar sistema de caché
3. Migrar toast service al lado del cliente
4. Actualizar endpoints para Next.js 15
5. Implementar nuevas políticas de logging

## Estado Actual

- [x] Análisis inicial completado
- [ ] Implementación de mejoras
- [ ] Pruebas de integración
- [ ] Documentación actualizada

## Optimización del flujo de inicialización y caché del sistema [En progreso]

### Cambios realizados:

1. ✅ Creado store para gestión de favoritos (FavoritesStore)
2. ✅ Creado store para gestión de colecciones (CollectionsStore)
3. ✅ Creado store para gestión de tags (TagsStore)
4. ✅ Integrado ContextMenu con los nuevos stores
5. ✅ Implementado sistema de logging para mejor seguimiento
6. ✅ Agregado servicio de Content al proceso de inicialización
7. ✅ Optimizado manejo de estado y caché
8. ✅ Mejorado el manejo de errores y feedback
9. ✅ Corregidos tipos en FavoriteService para incluir imagen
10. ✅ Mejorada exportación de tipos en CollectionService
11. ✅ Mejorada exportación de tipos en TagService
12. ✅ Agregados métodos para obtener imágenes en servicios
13. ✅ Implementada interfaz común para tipos de servicios
14. ✅ Movidas operaciones de base de datos al servidor
15. ✅ Creados endpoints para favoritos
16. ✅ Creados endpoints para colecciones
17. ✅ Mejorado manejo de errores en endpoints
18. ✅ Implementado logging en endpoints
19. ✅ Integrado sistema de eventos en FileContext
20. ✅ Mejorada actualización en tiempo real de FileCard
21. ✅ Corregido endpoint de tags para manejo correcto de imágenes
22. ✅ Implementada actualización automática de contadores

### Próximos pasos:

1. 🔄 Implementar sistema de caché selectiva para favoritos
2. 🔄 Optimizar carga inicial de colecciones
3. 🔄 Mejorar sistema de eventos para tags
4. 🔄 Implementar sistema de retry para operaciones fallidas
5. 🔄 Agregar tests para los nuevos stores
6. 🔄 Implementar sistema de precarga de contenido
7. 🔄 Optimizar rendimiento de operaciones masivas
8. 🔄 Mejorar UX con feedback visual
9. 🔄 Implementar sistema de rollback para operaciones fallidas
10. 🔄 Optimizar actualizaciones de UI para evitar re-renders innecesarios
11. 🔄 Mejorar sincronización entre vistas
12. 🔄 Implementar sistema de cola para operaciones masivas

### Beneficios:

- Mejor organización del código y responsabilidades
- Sistema de caché más eficiente
- Mejor manejo de errores y logging
- Mayor eficiencia en operaciones
- Sistema de eventos más robusto
- Mejor feedback al usuario
- Mayor estabilidad en operaciones
- Mejor mantenibilidad del código
- Tipado más seguro y consistente
- Mejor integración entre servicios
- Mejor manejo de relaciones entre entidades
- Código más mantenible y escalable
- Operaciones de base de datos seguras en el servidor
- Mejor manejo de errores y respuestas HTTP
- Logging centralizado y consistente
- Actualización en tiempo real de componentes
- Mejor sincronización de estado
- Manejo más robusto de operaciones concurrentes

## Corrección de problemas de inicialización y reindexado [Completado]

### Problemas identificados:

1. ✅ Múltiples llamadas redundantes al iniciar la aplicación
2. ✅ Error 405 en el endpoint de reindexado
3. ✅ Falta de control de operaciones concurrentes
4. ✅ Headers incorrectos en las peticiones

### Soluciones implementadas:

1. ✅ Implementado sistema de debounce para llamadas a la API
2. ✅ Corregida la ruta de reindexado y su implementación
3. ✅ Implementado sistema robusto de control de concurrencia
4. ✅ Mejorado el manejo de estados durante las operaciones
5. ✅ Agregada notificación de progreso desde el inicio de las operaciones
6. ✅ Implementado sistema de caché para operaciones en curso
7. ✅ Mejorado el sistema de logging con contexto
8. ✅ Corregido el manejo de tipos para metadata de imágenes

### Beneficios logrados:

- Reducción de llamadas redundantes
- Mejor manejo de operaciones concurrentes
- Mayor estabilidad en operaciones de carpetas
- Mejor feedback al usuario
- Prevención de estados inconsistentes
- Sistema de logging más robusto
- Tipado más seguro para metadata

### Próximos pasos:

1. 🔄 Implementar sistema de retry automático para operaciones fallidas
2. 🔄 Mejorar el feedback visual durante las operaciones
3. 🔄 Implementar cola de operaciones para mejor control
4. 🔄 Agregar métricas de rendimiento
5. 🔄 Implementar sistema de precarga de caché

## Actualización del Sistema (2025-01-10)

### 1. Sistema de Logging Mejorado

Se ha implementado un nuevo sistema de logging con las siguientes características:
- Configuración centralizada en `src/config/logger.config.ts`
- Niveles de log configurables por servicio
- Formato personalizable con colores y timestamps
- Mejor manejo de contextos y datos estructurados

### 2. Migración a Server Actions

Se ha migrado el servicio de estadísticas a Server Actions:
- Creado nuevo archivo `src/app/actions/stats.actions.ts`
- Eliminado sistema basado en eventos
- Implementada revalidación automática de rutas
- Mejorado el sistema de caché con TTL configurable

### Cambios en Archivos

1. Nuevos Archivos:
   - `src/config/logger.config.ts`: Configuración del sistema de logging
   - `src/app/actions/stats.actions.ts`: Server Actions para estadísticas

2. Archivos Modificados:
   - `src/lib/logger.ts`: Implementación del nuevo sistema de logging
   - `src/services/stats.service.ts`: Migración a Server Actions
   - `src/config/cache.config.ts`: Mejoras en la configuración de caché

### Mejoras de Rendimiento

1. Sistema de Caché:
   - Configuración específica por tipo de caché
   - TTL optimizado según el uso
   - Mejor manejo de errores y fallbacks

2. Estadísticas:
   - Revalidación automática de datos
   - Reducción de llamadas a la base de datos
   - Mejor manejo de concurrencia

### Próximos Pasos

1. [x] Implementar sistema de logging mejorado
2. [x] Migrar estadísticas a Server Actions
3. [ ] Mover toast service al lado del cliente
4. [ ] Implementar validación de datos en endpoints
5. [ ] Actualizar tests

## Cambios Realizados (2025-01-10)

### 1. Implementación de Configuración Centralizada

Se ha creado un nuevo sistema de configuración centralizado en `src/config/` con los siguientes componentes:

1. `image.config.ts`
   - Configuración de calidades de miniaturas
   - Parámetros de procesamiento de imágenes
   - Validación de esquema con Zod

2. `cache.config.ts`
   - Configuraciones de caché por tipo
   - TTL y tamaños máximos
   - Intervalos de limpieza

3. `index.ts`
   - Exportación centralizada de configuraciones
   - Validación automática al inicio

### Servicios Actualizados

1. Cache Service (`src/lib/cache.ts`)
   - Migrado a usar configuración centralizada
   - Implementada configuración específica por tipo de caché
   - Mejorado el manejo de errores

2. Image Service (`src/services/image.service.ts`)
   - Eliminada configuración duplicada
   - Migrado a usar configuración centralizada
   - Actualizado para usar tipos compartidos

3. Thumbnail Service (`src/services/thumbnail.service.ts`)
   - Eliminada configuración duplicada
   - Migrado a usar configuración centralizada
   - Mejorada la integración con el sistema de caché

### Próximos Pasos

1. Migrar el servicio de estadísticas a Server Actions
2. Implementar nueva estructura de logging
3. Mover toast service al lado del cliente
