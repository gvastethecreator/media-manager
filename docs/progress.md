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

1. **[2024-01-11] Integración de Servicios de Gestión de Contenido**

   - Integración de FavoriteService, CollectionService y TagService
   - Optimización del ContextMenu y sus interacciones
   - Implementación de caché y gestión de estado
   - Mejora en el manejo de eventos y actualizaciones UI

2. **[2024-01-11] Optimización del Flujo de Inicialización**

   - Revisión y mejora del flujo de inicialización de la aplicación
   - Reorganización del orden de carga de servicios
   - Optimización de la pantalla de carga y estados visuales
   - Implementación de mejor manejo de errores y dependencias

3. **[2024-01-10] Separación de Componentes de Configuración**

   - Separación de FoldersSection y ThumbnailsSection en componentes independientes
   - Implementación de comunicación entre componentes
   - Optimización de la gestión de estado compartido
   - Mejora en la organización del código y responsabilidades

4. **[2024-01-10] Corrección del Sistema de Reindexado**

   - Análisis del flujo de eventos SSE en el proceso de reindexado
   - Corrección de la sincronización de estado en FoldersSection
   - Mejora en el manejo de tipos de eventos en EventsService
   - Optimización del manejo de progreso y estado

5. **[2024-01-09] Optimización para Server Components**

   - Refactorización del FileContext para Server Components
   - Migración de operaciones de base de datos al servidor
   - Implementación de Server Actions para operaciones de datos
   - Optimización del manejo de estado cliente/servidor

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
