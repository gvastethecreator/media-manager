# Servicio de Eventos de Thumbnails

## Descripción

El `ThumbnailEventService` es un servicio singleton que maneja los eventos relacionados con el procesamiento de miniaturas en la aplicación. Proporciona una interfaz unificada para la emisión y suscripción de eventos relacionados con thumbnails.

## Características

- ✨ Patrón Singleton para gestión centralizada
- 🔄 Eventos en tiempo real para progreso y estados
- 📝 Sistema de logging integrado
- 🎯 Tipado fuerte con TypeScript
- 🛡️ Manejo de errores robusto
- 🧹 Limpieza automática de recursos

## Tipos de Eventos

1. **Progress**

   - Emitido durante el procesamiento de miniaturas
   - Incluye información de progreso y estado actual

2. **Error**

   - Emitido cuando ocurre un error en el procesamiento
   - Incluye detalles del error y contexto

3. **Complete**

   - Emitido al finalizar un proceso
   - Incluye estadísticas y resultados

4. **Stats**
   - Emitido al actualizar estadísticas
   - Incluye métricas y contadores

## Uso

```typescript
import { thumbnailEventService } from "@/services/thumbnail-events.service";

// Suscribirse a eventos
thumbnailEventService.onProgress((status) => {
	console.log("Progreso:", status);
});

// Emitir eventos
thumbnailEventService.emitProgress({
	current: 5,
	total: 10,
	status: "Procesando...",
});

// Desuscribirse de eventos
const handler = (data) => console.log(data);
thumbnailEventService.offProgress(handler);
```

## API

### Métodos de Emisión

#### `emitProgress(status: any)`

Emite un evento de progreso.

#### `emitError(error: any)`

Emite un evento de error.

#### `emitComplete(data: any)`

Emite un evento de completado.

#### `emitStats(stats: any)`

Emite un evento de estadísticas.

### Métodos de Suscripción

#### `onProgress(handler: (status: any) => void)`

Suscribe un manejador a eventos de progreso.

#### `onError(handler: (error: any) => void)`

Suscribe un manejador a eventos de error.

#### `onComplete(handler: (data: any) => void)`

Suscribe un manejador a eventos de completado.

#### `onStats(handler: (stats: any) => void)`

Suscribe un manejador a eventos de estadísticas.

### Métodos de Desuscripción

#### `offProgress(handler: (status: any) => void)`

Remueve un manejador de eventos de progreso.

#### `offError(handler: (error: any) => void)`

Remueve un manejador de eventos de error.

#### `offComplete(handler: (data: any) => void)`

Remueve un manejador de eventos de completado.

#### `offStats(handler: (stats: any) => void)`

Remueve un manejador de eventos de estadísticas.

### Utilidades

#### `removeAllListeners()`

Remueve todos los listeners registrados.

## Integración con Logger

El servicio utiliza el sistema de logging centralizado:

```typescript
private readonly logger = logger.withContext('ThumbnailEvents');
```

## Ejemplos de Uso

### Monitoreo de Progreso

```typescript
thumbnailEventService.onProgress((status) => {
	updateProgressBar(status.percentage);
	updateStatus(status.message);
});
```

### Manejo de Errores

```typescript
thumbnailEventService.onError((error) => {
	showErrorNotification(error.message);
	logError(error);
});
```

### Actualización de UI

```typescript
thumbnailEventService.onComplete((data) => {
	updateThumbnailGrid();
	showSuccessMessage(data.message);
});
```

## Mejores Prácticas

1. **Limpieza de Recursos**

   - Siempre desuscribirse de eventos cuando el componente se desmonta
   - Usar `removeAllListeners()` cuando sea apropiado

2. **Manejo de Errores**

   - Implementar manejadores de error para cada tipo de evento
   - Proporcionar fallbacks apropiados

3. **Logging**

   - Aprovechar el sistema de logging integrado
   - Mantener niveles de log apropiados

4. **Rendimiento**
   - No crear múltiples suscripciones innecesarias
   - Limpiar listeners no utilizados

## Notas de Implementación

- El servicio usa `EventEmitter` internamente
- Implementa un límite de 50 listeners por evento
- Mantiene estado interno de suscripciones
- Proporciona métodos de limpieza automática
