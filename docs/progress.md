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

## Optimización del flujo de inicialización y caché del sistema [En progreso]

### Cambios realizados:

1. ✅ Creado nuevo servicio `SystemService` para centralizar llamadas al estado del sistema
2. ✅ Implementado caché específico para el estado del sistema
3. ✅ Optimizado el hook `useInitializeApp` para reducir llamadas redundantes
4. ✅ Mejorado el store de stats con caché y optimización de llamadas
5. ✅ Implementado logger para mejor seguimiento y debugging
6. ✅ Corregido error de exportación en CacheManager
7. ✅ Creado CacheProvider para manejo del ciclo de vida del caché
8. ✅ Integrado CacheProvider en AppProvider
9. ✅ Mejorado el sistema de logging con emojis para mejor visibilidad
10. ✅ Implementado sistema de eventos para invalidación de caché
11. ✅ Optimizado actualización de stats basado en eventos relevantes
12. ✅ Ajustado TTL del caché de stats a 5 minutos
13. ✅ Actualizado FolderService para usar el nuevo sistema de eventos
14. ✅ Eliminado código redundante de eventos en FolderService
15. ✅ Mejorado el manejo de errores y logging en FolderService
16. ✅ Actualizado FoldersView para usar el nuevo sistema de eventos
17. ✅ Implementada suscripción a eventos en FoldersView
18. ✅ Mejorado manejo de estados y errores en FoldersView

### Próximos pasos:

1. 🔄 Revisar y optimizar ViewContainer
2. 🔄 Verificar y ajustar tiempos de caché según necesidad
3. 🔄 Implementar manejo de errores más robusto
4. 🔄 Añadir métricas de rendimiento
5. 🔄 Documentar API del sistema
6. 🔄 Implementar sistema de invalidación de caché selectiva
7. 🔄 Añadir tests para el sistema de caché
8. 🔄 Monitorear uso de memoria del caché
9. 🔄 Implementar sistema de precarga de caché
10. 🔄 Implementar sistema de retry para operaciones fallidas

### Beneficios:

- Reducción de llamadas redundantes al API
- Mejor manejo de estado y caché
- Logging mejorado para debugging
- Mayor eficiencia en la inicialización
- Sistema de caché más robusto y mantenible
- Mejor gestión del ciclo de vida de los cachés
- Actualización de stats basada en eventos
- Menor consumo de recursos del servidor
- Sistema de eventos más limpio y eficiente
- Mejor manejo de errores y feedback
- Actualización automática de UI basada en eventos
- Mayor robustez en operaciones de carpetas

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
