# Progress Log - Image Manager

## Tarea Actual: Optimización y Consolidación de Servicios (2024-01-05)

### Servicios Identificados para Optimización:

1. **Sistema de Archivos y Observación**:

   - `files.service.ts` (4.2KB) - Manejo de archivos
   - `fs.server.ts` (5.4KB) - Operaciones de sistema de archivos
   - `watcher.service.ts` (1.9KB) - Observador de cambios
   - `watcher.server.ts` (1.4KB) - Servidor de observación

2. **Procesamiento de Imágenes**:
   - `image.service.ts` (6.0KB) - Manejo de imágenes
   - `thumbnail.service.ts` (15KB) - Generación de miniaturas

### Plan de Acción:

1. **Fase 1 - Análisis y Documentación**:

   - [x] Identificar servicios duplicados
   - [x] Documentar funcionalidades actuales
   - [ ] Mapear dependencias entre servicios
   - [ ] Identificar componentes que utilizan estos servicios

2. **Fase 2 - Consolidación de Watchers**:

   - [ ] Analizar diferencias entre `watcher.service.ts` y `watcher.server.ts`
   - [ ] Crear nuevo servicio unificado
   - [ ] Migrar funcionalidades manteniendo compatibilidad
   - [ ] Pruebas de integración

3. **Fase 3 - Sistema de Archivos**:

   - [ ] Consolidar lógica entre `files.service.ts` y `fs.server.ts`
   - [ ] Separar responsabilidades cliente/servidor
   - [ ] Implementar mejor manejo de errores
   - [ ] Pruebas de funcionalidad

4. **Fase 4 - Servicios de Imágenes**:
   - [ ] Analizar superposición entre servicios de imágenes
   - [ ] Optimizar generación de miniaturas
   - [ ] Mejorar manejo de memoria
   - [ ] Implementar procesamiento por lotes

### Riesgos y Mitigaciones:

1. **Compatibilidad**:

   - Mantener interfaces existentes durante la migración
   - Implementar deprecation warnings
   - Pruebas exhaustivas antes de eliminar código

2. **Performance**:
   - Monitorear tiempos de respuesta
   - Implementar métricas de rendimiento
   - Mantener caché existente

### Próximos Pasos Inmediatos:

1. Comenzar con el análisis detallado de `watcher.service.ts` y `watcher.server.ts`
2. Mapear todas las dependencias y usos de estos servicios
3. Crear plan detallado de migración

## Stack Tecnológico

- Next.js 15
- React 19
- TypeScript
- Prisma con SQLite
- Zustand para estado global
- Shadcn/ui para la interfaz
- EventSource para SSE (Server-Sent Events)

## Issues Actuales

### 1. Problemas con Reindexación de Carpetas (2024-01-XX)

#### Síntomas:

1. Error "Timeout esperando conexión SSE"
2. Error con `params.id` en rutas dinámicas
3. Problemas de sincronización entre cliente y servidor
4. Conexiones SSE que no se establecen correctamente

#### Causas Identificadas:

1. Uso incorrecto de `params.id` en rutas dinámicas de Next.js
2. Timing issues en la inicialización de streams SSE
3. Manejo inadecuado de la secuencia de eventos cliente-servidor
4. Problemas con el ciclo de vida de las conexiones SSE

#### Soluciones Implementadas (2024-01-XX):

1. **Corrección de Errores SSE**:

   - Implementado parseador robusto de eventos SSE
   - Corregido manejo de `params.id` en rutas dinámicas
   - Mejorado sistema de timeouts y reconexión

2. **Mejoras en el Manejo de Streams**:

   - Nuevo sistema de gestión de streams con limpieza automática
   - Implementado heartbeat para mantener conexiones vivas
   - Mejor manejo de desconexiones y cleanup de recursos

3. **Correcciones de Tipos**:
   - Interfaces mejoradas para callbacks y eventos
   - Eliminados tipos `any` implícitos
   - Mejor tipado para manejo de errores

### Cambios Específicos

1. **Servicio de Carpetas (`folder.service.ts`)**:

   ```typescript
   - Nuevo parseador SSE con manejo de prefijos
   - Sistema de retry con backoff
   - Timeouts configurables para conexiones
   - Mejor manejo de errores y tipos
   ```

2. **API Routes**:

   ```typescript
   - Corrección de params.id en rutas dinámicas
   - Mejor formato de eventos SSE
   - Manejo robusto de streams
   ```

3. **Utilidad de Streams**:
   ```typescript
   - Sistema de limpieza automática
   - Mejor gestión de recursos
   - Heartbeat configurable
   ```

### Estado Actual

El sistema ahora maneja mejor:

- Conexiones SSE estables
- Reconexión automática
- Limpieza de recursos
- Tipado estricto
- Manejo de errores robusto

### Próximos Pasos

1. **Monitoreo**:

   - [ ] Implementar logging detallado
   - [ ] Agregar métricas de performance
   - [ ] Sistema de alertas para errores

2. **Optimizaciones**:

   - [ ] Implementar rate limiting
   - [ ] Mejorar manejo de memoria
   - [ ] Optimizar procesamiento de imágenes

3. **UX**:
   - [ ] Mejorar feedback visual
   - [ ] Agregar indicadores de progreso más detallados
   - [ ] Implementar cancelación de operaciones

## Notas Técnicas

### Server-Sent Events (SSE)

1. **Establecimiento de Conexión**:

   ```typescript
   const eventSource = new EventSource(`/api/folders/reindex/${id}/events`);
   ```

2. **Manejo de Eventos**:

   ```typescript
   eventSource.addEventListener("connected", () => {
   	// Iniciar proceso de reindexación
   });
   ```

3. **Cleanup**:
   ```typescript
   eventSource.close();
   cleanupStream(id);
   ```

### Mejores Prácticas

1. Siempre usar try-catch en operaciones asíncronas
2. Implementar timeouts para operaciones largas
3. Mantener estado de conexión actualizado
4. Limpiar recursos adecuadamente
5. Usar tipos estrictos de TypeScript

### Estructura de Eventos SSE

```typescript
interface StreamData {
	stream: TransformStream;
	writer: WritableStreamDefaultWriter;
	isActive: boolean;
	lastActivity: number;
	encoder: TextEncoder;
}
```

## Análisis del Servicio de Carpetas (Folders Service)

### Stack Tecnológico Relevante

- Next.js 15
- React 19
- TypeScript
- Prisma con SQLite
- Zustand (Estado)
- ShadcN/UI (Interfaz)

### Componentes Principales

1. `folders-section.tsx`: Componente de UI para gestión de carpetas
2. `folder.service.ts`: Servicio para operaciones con carpetas
3. Schema Prisma: Modelo de datos para Folders

### Problemas Detectados

1. Errores de TypeScript en `folders-section.tsx`:
   - Tipado incorrecto en llamadas a `reindexFolder`
   - Parámetros `any` implícitos en callbacks

### Flujo Actual

1. UI permite agregar nueva carpeta
2. Servicio intenta:
   - Agregar carpeta via POST a /api/folders
   - Iniciar indexación via SSE
   - Manejar eventos de progreso
   - Actualizar UI con estado

### Próximos Pasos

1. Simplificar el flujo de servicio
2. Corregir tipados
3. Verificar rutas de API
4. Implementar manejo de errores robusto

### Issues Actuales

- [ ] Revisar implementación de API routes en Next.js 15
- [ ] Verificar manejo de SSE en el servidor
- [ ] Corregir tipados en el servicio
- [ ] Simplificar lógica de reindexación

### Cambios Realizados

1. Corrección de Tipos:

   - Definidas interfaces claras para `IndexStats`, `IndexCallbacks`, `ReindexCallbacks` y `FolderResponse`
   - Corregidos tipos implícitos `any` en callbacks
   - Mejorado manejo de errores con tipos específicos

2. Simplificación del Servicio:
   - Eliminada duplicación en llamadas a `reindexFolder`
   - Mejorada la gestión de errores con tipos específicos
   - Implementada validación de datos más robusta

### Estado Actual

El servicio de carpetas ahora tiene:

- Tipos correctamente definidos
- Manejo de errores mejorado
- Flujo de reindexación simplificado

### Próximos Pasos

1. Implementación de API:

   - [ ] Revisar implementación de SSE en Next.js 15
   - [ ] Implementar manejo de timeouts en SSE
   - [ ] Mejorar manejo de reconexión en cliente

2. Mejoras de UX:

   - [ ] Implementar feedback visual durante indexación
   - [ ] Mejorar mensajes de error
   - [ ] Agregar opción de cancelar indexación

3. Optimizaciones:
   - [ ] Implementar procesamiento por lotes
   - [ ] Mejorar manejo de memoria en thumbnails
   - [ ] Agregar caché de metadatos

### Issues Pendientes

1. SSE y Next.js 15:

   - Verificar compatibilidad con Edge Runtime
   - Implementar fallback para navegadores sin soporte SSE
   - Mejorar manejo de timeouts

2. Manejo de Errores:

   - Implementar retry policy
   - Mejorar logging de errores
   - Agregar telemetría

3. Performance:
   - Optimizar generación de thumbnails
   - Implementar procesamiento en background
   - Mejorar manejo de memoria

## Mejoras de Diseño en Secciones de Configuración (2024-01-XX)

### Objetivo

Unificar y mejorar el diseño de todas las secciones de configuración siguiendo el patrón establecido en profiles-section.tsx

### Cambios Planificados

1. **General para todas las secciones:**

   - [x] Implementar estructura consistente con CardHeader y CardContent
   - [x] Unificar espaciado y tipografía
   - [x] Agregar animaciones suaves con Framer Motion
   - [x] Mejorar estados hover y focus
   - [x] Implementar transiciones fluidas

2. **Por Sección:**

   a) **Folders Section:**

   - [x] Reorganizar layout de carpetas
   - [x] Mejorar visualización de estadísticas
   - [x] Agregar animaciones en las cards
   - [x] Optimizar estados de carga

   b) **Thumbnails Section:**

   - [x] Rediseñar controles de calidad
   - [x] Mejorar grid de miniaturas
   - [x] Implementar animaciones en procesamiento
   - [x] Optimizar feedback visual

   c) **System Section:**

   - [x] Rediseñar métricas del sistema
   - [x] Mejorar visualización de recursos
   - [x] Agregar animaciones en indicadores
   - [x] Optimizar layout de mantenimiento

   d) **Tags Section:**

   - [x] Reorganizar estructura de etiquetas
   - [x] Mejorar UI de creación/edición
   - [x] Implementar animaciones suaves
   - [x] Optimizar estados de hover

   e) **Collections Section:**

   - [x] Rediseñar cards de colecciones
   - [x] Mejorar UI de creación/edición
   - [x] Agregar animaciones en transiciones
   - [x] Optimizar feedback visual

   f) **Shortcuts Section:**

   - [x] Reorganizar layout de atajos
   - [x] Mejorar visualización de teclas
   - [x] Implementar animaciones en hover
   - [x] Optimizar feedback de edición

### Stack Tecnológico para Mejoras

- Framer Motion para animaciones
- ShadcN/UI para componentes base
- CSS Modules para estilos específicos
- Lucide Icons para iconografía

### Estado Actual

- [x] Implementación completada
- [x] Diseño unificado
- [x] Animaciones implementadas
- [x] Feedback visual mejorado

### Próximos Pasos

1. [x] Implementar mejoras sección por sección
2. [x] Validar consistencia visual
3. [x] Optimizar rendimiento de animaciones
4. [x] Realizar pruebas de usabilidad

### Mejoras Adicionales Sugeridas

1. [ ] Agregar más variedad de animaciones
2. [ ] Implementar temas personalizados
3. [ ] Mejorar accesibilidad
4. [ ] Agregar más tooltips informativos

## Análisis Detallado de Servicios Watcher (2024-01-05)

### Estado Actual

1. **watcher.service.ts**:

   - Maneja la interfaz del cliente
   - Gestiona solicitudes HTTP a la API
   - Mantiene un mapa de watchers activos
   - Funciones principales:
     - `watchFolder(folderId)`: Inicia monitoreo vía API
     - `stopWatching(folderId)`: Detiene monitoreo vía API
     - `startWatchingAll()`: Inicia monitoreo de todas las carpetas marcadas
     - `stopWatchingAll()`: Detiene todos los watchers activos

2. **watcher.server.ts**:
   - Implementación del servidor usando chokidar
   - Maneja un único watcher global
   - Funciones principales:
     - `initializeWatcher()`: Configura chokidar para carpetas marcadas
     - `stopWatcher()`: Detiene el watcher global

### Problemas Identificados

1. **Duplicación**:

   - Ambos servicios mantienen su propia lógica de estado
   - Consultas duplicadas a la base de datos para carpetas observadas
   - Manejo redundante de eventos

2. **Inconsistencias**:
   - El cliente mantiene un mapa de watchers mientras el servidor usa uno global
   - No hay sincronización garantizada entre cliente y servidor
   - Posibles race conditions en el manejo de estado

### Plan de Consolidación

1. **Nueva Estructura Propuesta**:

   ```typescript
   // src/services/watcher/types.ts
   interface WatcherEvents {
   	onFileAdd: (path: string) => void;
   	onFileRemove: (path: string) => void;
   	onError: (error: Error) => void;
   }

   // src/services/watcher/server.ts
   class WatcherServer {
   	private watcher: chokidar.FSWatcher;
   	async initialize(paths: string[]): Promise<void>;
   	async addPath(path: string): Promise<void>;
   	async removePath(path: string): Promise<void>;
   	stop(): void;
   }

   // src/services/watcher/client.ts
   class WatcherClient {
   	async watchFolder(folderId: string): Promise<void>;
   	async unwatchFolder(folderId: string): Promise<void>;
   	async syncWatchedFolders(): Promise<void>;
   }
   ```

2. **Mejoras Planificadas**:

   - [ ] Implementar sistema de eventos unificado
   - [ ] Mejorar manejo de errores y reconexión
   - [ ] Agregar logging estructurado
   - [ ] Implementar health checks
   - [ ] Agregar métricas de rendimiento

3. **Pasos de Migración**:
   1. Crear nueva estructura de archivos
   2. Implementar nuevas clases manteniendo APIs existentes
   3. Migrar componentes gradualmente
   4. Deprecar y eliminar código antiguo

### Próximos Pasos

1. [ ] Crear estructura de directorios para el nuevo servicio
2. [ ] Implementar tipos compartidos
3. [ ] Desarrollar nueva implementación del servidor
4. [ ] Crear cliente compatible
5. [ ] Implementar pruebas
6. [ ] Migrar componentes existentes

### Implementación del Nuevo Servicio Watcher (2024-01-05)

#### Cambios Realizados:

1. ✅ **Estructura de Archivos**:

   ```
   src/services/watcher/
   ├── types.ts       - Tipos e interfaces
   ├── server.ts      - Implementación del servidor
   ├── client.ts      - Implementación del cliente
   └── index.ts       - Exportaciones
   ```

2. ✅ **Mejoras Implementadas**:

   - Sistema de tipos robusto y documentado
   - Manejo de errores mejorado
   - Logging estructurado
   - Configuración flexible
   - Sistema de eventos unificado
   - Singleton pattern para cliente y servidor

3. ✅ **Nuevas Características**:
   - Sincronización de estado cliente/servidor
   - Manejo de eventos de cambio de archivos
   - Configuración personalizable
   - API más limpia y documentada
   - Mejor manejo de recursos

#### Próximos Pasos:

1. [ ] **Migración de Código**:

   - Identificar todos los componentes que usan el watcher antiguo
   - Crear plan de migración gradual
   - Implementar deprecation warnings
   - Actualizar documentación

2. [ ] **Pruebas**:

   - Implementar pruebas unitarias
   - Pruebas de integración
   - Pruebas de rendimiento
   - Pruebas de edge cases

3. [ ] **Documentación**:

   - Actualizar README
   - Agregar ejemplos de uso
   - Documentar API
   - Guía de migración

4. [ ] **Monitoreo**:
   - Implementar métricas de rendimiento
   - Agregar telemetría
   - Mejorar logging

#### Notas Técnicas:

1. **Cambios en la API**:

   ```typescript
   // Antes
   watcherService.watchFolder(folderId);

   // Ahora
   watcherClient.watchFolder(folderId);
   ```

2. **Nuevas Características**:

   ```typescript
   // Configuración personalizada
   const server = new WatcherServer({
   	stabilityThreshold: 1000,
   	pollInterval: 50,
   	ignoreInitial: false,
   });

   // Manejo de eventos
   watcherServer.on("onFileAdd", (path) => {
   	console.log(`Nuevo archivo: ${path}`);
   });
   ```

3. **Mejoras en Tipos**:
   ```typescript
   interface WatcherEvents {
   	onFileAdd: (path: string) => void;
   	onFileRemove: (path: string) => void;
   	onFileChange: (path: string) => void;
   	onError: (error: Error) => void;
   }
   ```

#### Estado Actual:

- ✅ Nueva estructura implementada
- ✅ Tipos y documentación
- ✅ Implementación base
- ❌ Migración de código existente
- ❌ Pruebas
- ❌ Documentación completa

### Plan de Migración del Servicio Watcher (2024-01-05)

#### Archivos a Modificar:

1. **API Routes**:

   - `src/app/api/folders/watch/route.ts`

   ```typescript
   // Antes
   import { watcherService } from "@/services/watcher.server";
   await watcherService.watchFolder(folder.id);
   await watcherService.stopWatching(folder.id);

   // Después
   import { watcherServer } from "@/services/watcher";
   await watcherServer.addPath(folder.path);
   await watcherServer.removePath(folder.path);
   ```

2. **Servicios Antiguos a Deprecar**:
   - `src/services/watcher.service.ts`
   - `src/services/watcher.server.ts`

#### Plan de Migración:

1. **Fase 1 - Preparación**:

   - [x] Implementar nuevo servicio
   - [ ] Agregar warnings de deprecación en servicios antiguos
   - [ ] Crear API route compatible con nuevo servicio

2. **Fase 2 - Migración API**:

   - [ ] Actualizar `api/folders/watch/route.ts`
   - [ ] Implementar nuevo endpoint `api/folders/watched`
   - [ ] Pruebas de integración de nuevos endpoints

3. **Fase 3 - Migración Cliente**:

   - [ ] Identificar componentes que usan el watcher
   - [ ] Actualizar imports a nuevo servicio
   - [ ] Adaptar llamadas a nueva API
   - [ ] Pruebas de componentes actualizados

4. **Fase 4 - Limpieza**:
   - [ ] Remover servicios antiguos
   - [ ] Actualizar documentación
   - [ ] Verificar no hay referencias pendientes

#### Estrategia de Migración Gradual:

1. **Deprecación**:

   ```typescript
   // En watcher.service.ts
   export const watcherService = {
   	async watchFolder(folderId: string): Promise<void> {
   		console.warn("⚠️ [Deprecated] Use watcherClient.watchFolder instead");
   		// ... resto del código
   	},
   	// ... resto de métodos
   };
   ```

2. **Coexistencia Temporal**:

   - Mantener ambos servicios funcionando
   - Logging de uso de métodos deprecados
   - Migración gradual de componentes

3. **Verificación**:
   - Monitorear logs de deprecación
   - Pruebas en ambos servicios
   - Validar funcionamiento correcto

#### Pruebas Necesarias:

1. **Unitarias**:

   - [ ] Nuevo cliente watcher
   - [ ] Nuevo servidor watcher
   - [ ] Manejo de eventos
   - [ ] Manejo de errores

2. **Integración**:

   - [ ] API routes
   - [ ] Sincronización cliente/servidor
   - [ ] Eventos del sistema de archivos

3. **End-to-End**:
   - [ ] Flujo completo de observación
   - [ ] Manejo de errores
   - [ ] Performance

#### Timeline Estimado:

1. Fase 1: 1 día
2. Fase 2: 1-2 días
3. Fase 3: 2-3 días
4. Fase 4: 1 día

Total: 5-7 días laborables

### Actualización de Progreso - Migración Watcher (2024-01-05)

#### Completado:

1. ✅ **Nuevo Endpoint `GET /api/folders/watched`**:

   - Implementado endpoint para listar carpetas observadas
   - Incluye información detallada de cada carpeta
   - Manejo de errores mejorado

2. ✅ **Actualización `POST /api/folders/watch`**:

   - Migrado a nuevo servicio watcher
   - Mejorado manejo de errores
   - Agregada transaccionalidad
   - Validación de datos mejorada

3. ✅ **Mejoras Generales**:
   - Respuestas consistentes con `success` flag
   - Logging mejorado con emojis
   - Manejo de errores más robusto
   - Rollback automático en caso de error

#### Cambios en la API:

1. **GET /api/folders/watched**:

   ```typescript
   // Respuesta exitosa
   {
     success: true,
     folders: [
       {
         id: string,
         path: string,
         isWatched: boolean,
         name: string,
         createdAt: Date,
         updatedAt: Date
       }
     ]
   }

   // Error
   {
     success: false,
     error: string
   }
   ```

2. **POST /api/folders/watch**:

   ```typescript
   // Request
   {
     folderId: string,
     watch: boolean
   }

   // Respuesta exitosa
   {
     success: true,
     data: {
       folderId: string,
       isWatched: boolean
     }
   }

   // Error
   {
     success: false,
     error: string
   }
   ```

#### Próximos Pasos:

1. [ ] **Pruebas de Integración**:

   - Crear suite de pruebas para endpoints
   - Probar casos de error
   - Validar rollback en errores
   - Verificar formato de respuestas

2. [ ] **Migración de Componentes**:

   - Identificar componentes que usan API antigua
   - Actualizar llamadas a nuevos endpoints
   - Adaptar manejo de respuestas
   - Pruebas de integración

3. [ ] **Documentación**:
   - Actualizar documentación de API
   - Agregar ejemplos de uso
   - Documentar códigos de error
   - Actualizar guías de migración

#### Plan de Pruebas:

1. **Endpoints**:

   ```typescript
   // Test Cases
   - GET /api/folders/watched
     ✓ Retorna lista vacía si no hay carpetas
     ✓ Retorna solo carpetas observadas
     ✓ Maneja errores de BD correctamente

   - POST /api/folders/watch
     ✓ Inicia observación correctamente
     ✓ Detiene observación correctamente
     ✓ Valida folderId requerido
     ✓ Maneja carpeta no existente
     ✓ Rollback en error de watcher
   ```

2. **Integración**:
   ```typescript
   // Flujos a probar
   - Iniciar observación -> Verificar lista -> Detener observación
   - Error en watcher -> Verificar rollback
   - Múltiples carpetas -> Verificar sincronización
   ```

#### Notas Técnicas:

1. **Mejoras de Robustez**:

   - Implementado rollback automático
   - Validación de datos mejorada
   - Logging consistente
   - Manejo de errores unificado

2. **Consideraciones de Performance**:

   - Queries optimizadas
   - Transacciones eficientes
   - Logging asíncrono

3. **Seguridad**:
   - Validación de inputs
   - Sanitización de paths
   - Manejo seguro de errores

### Plan de Pruebas de Endpoints - Watcher (2024-01-05)

#### Endpoints a Probar:

1. **GET /api/folders/watched**

   ```http
   GET http://localhost:3000/api/folders/watched
   ```

   Casos de prueba:

   - [ ] Lista vacía (sin carpetas observadas)
   - [ ] Lista con carpetas observadas
   - [ ] Validar estructura de respuesta
   - [ ] Manejo de errores

2. **POST /api/folders/watch**

   ```http
   POST http://localhost:3000/api/folders/watch
   Content-Type: application/json

   {
     "folderId": "string",
     "watch": boolean
   }
   ```

   Casos de prueba:

   - [ ] Activar observación
   - [ ] Desactivar observación
   - [ ] ID inválido
   - [ ] Carpeta no existente
   - [ ] Rollback en error

#### Secuencia de Pruebas:

1. **Prueba Base**:

   ```bash
   # 1. Obtener lista inicial (debe estar vacía o con datos existentes)
   GET /api/folders/watched

   # 2. Intentar activar observación con ID inválido
   POST /api/folders/watch
   { "folderId": "invalid", "watch": true }

   # 3. Activar observación en carpeta válida
   POST /api/folders/watch
   { "folderId": "valid-id", "watch": true }

   # 4. Verificar lista actualizada
   GET /api/folders/watched

   # 5. Desactivar observación
   POST /api/folders/watch
   { "folderId": "valid-id", "watch": false }

   # 6. Verificar lista final
   GET /api/folders/watched
   ```

2. **Prueba de Errores**:

   ```bash
   # 1. Intentar sin folderId
   POST /api/folders/watch
   { "watch": true }

   # 2. ID no existente
   POST /api/folders/watch
   { "folderId": "non-existent", "watch": true }

   # 3. Payload inválido
   POST /api/folders/watch
   { "invalid": "data" }
   ```

3. **Prueba de Concurrencia**:

   ```bash
   # 1. Activar múltiples carpetas
   POST /api/folders/watch (carpeta1)
   POST /api/folders/watch (carpeta2)
   POST /api/folders/watch (carpeta3)

   # 2. Verificar todas activas
   GET /api/folders/watched

   # 3. Desactivar en orden inverso
   POST /api/folders/watch (carpeta3, false)
   POST /api/folders/watch (carpeta2, false)
   POST /api/folders/watch (carpeta1, false)
   ```

#### Resultados Esperados:

1. **GET /api/folders/watched**:

   ```typescript
   // Éxito - Lista vacía
   {
     "success": true,
     "folders": []
   }

   // Éxito - Con datos
   {
     "success": true,
     "folders": [
       {
         "id": "...",
         "path": "...",
         "isWatched": true,
         "name": "...",
         "createdAt": "...",
         "updatedAt": "..."
       }
     ]
   }

   // Error
   {
     "success": false,
     "error": "Error al obtener carpetas observadas"
   }
   ```

2. **POST /api/folders/watch**:

   ```typescript
   // Éxito
   {
     "success": true,
     "data": {
       "folderId": "...",
       "isWatched": true|false
     }
   }

   // Error - ID Faltante
   {
     "success": false,
     "error": "Se requiere el ID de la carpeta"
   }

   // Error - No Encontrado
   {
     "success": false,
     "error": "Carpeta no encontrada"
   }

   // Error - Servidor
   {
     "success": false,
     "error": "Error al actualizar monitoreo"
   }
   ```

#### Herramientas para Pruebas:

1. **Thunder Client / Postman**:

   - Crear colección para pruebas
   - Guardar ejemplos de respuestas
   - Documentar casos de prueba

2. **Scripts de Prueba**:
   ```bash
   # Ejemplo de script para pruebas secuenciales
   test-watcher.sh
   ```

#### Próximos Pasos:

1. [ ] Ejecutar pruebas manuales
2. [ ] Documentar resultados
3. [ ] Corregir issues encontrados
4. [ ] Preparar para integración
