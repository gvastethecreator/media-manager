# Servicio de Eventos (EventService)

## Descripción

El `EventService` es un servicio centralizado para manejar eventos Server-Sent Events (SSE) en la aplicación. Implementa el patrón Singleton y proporciona una interfaz unificada para la gestión de eventos en tiempo real.

## Características

- ✨ Patrón Singleton para gestión centralizada
- 🔄 Reconexión automática con reintentos configurables
- 📝 Sistema de logging integrado
- 🎯 Tipado fuerte con TypeScript
- 🛡️ Manejo de errores robusto
- 🧹 Limpieza automática de recursos

## Uso

```typescript
import { eventService } from "@/services/events.service";

// Conectar a un endpoint
eventService.connect("/api/my-events");

// Suscribirse a eventos
eventService.on("progress", (data) => {
	console.log("Progreso:", data);
});

// Desuscribirse de eventos
const handler = (data) => console.log(data);
eventService.off("progress", handler);

// Desconectar
eventService.disconnect();
```

## API

### Métodos Principales

#### `connect(endpoint: string, config?: EventSourceConfig)`

Establece una conexión SSE con el endpoint especificado.

```typescript
eventService.connect("/api/events", {
	withCredentials: true,
	headers: { "Custom-Header": "value" },
});
```

#### `on(eventType: string, callback: EventCallback)`

Suscribe un manejador a un tipo de evento específico.

#### `off(eventType: string, callback: EventCallback)`

Elimina un manejador de eventos específico.

#### `disconnect()`

Cierra la conexión actual.

#### `clearHandlers()`

Limpia todos los manejadores de eventos registrados.

## Configuración

```typescript
interface EventSourceConfig {
	withCredentials?: boolean;
	headers?: Record<string, string>;
}
```

## Manejo de Errores

El servicio incluye:

- Reintentos automáticos de conexión
- Límite configurable de reintentos
- Logging detallado de errores
- Emisión de eventos de error

## Integración con Logger

El servicio utiliza el sistema de logging centralizado:

```typescript
private readonly logger = logger.withContext('EventService');
```

## Ejemplos de Uso

### Monitoreo de Progreso

```typescript
eventService.on("progress", (data) => {
	updateProgress(data.percentage);
});
```

### Manejo de Errores

```typescript
eventService.on("error", (error) => {
	showErrorNotification(error.message);
});
```

### Limpieza en Componentes React

```typescript
useEffect(() => {
	eventService.connect("/api/events");

	return () => {
		eventService.disconnect();
		eventService.clearHandlers();
	};
}, []);
```

## Mejores Prácticas

1. **Limpieza de Recursos**

   - Siempre desconectar y limpiar handlers en cleanup
   - Usar `clearHandlers()` al desmontar componentes

2. **Manejo de Errores**

   - Suscribirse al evento 'error' para manejar fallos
   - Implementar fallbacks apropiados

3. **Logging**

   - Aprovechar el sistema de logging integrado
   - Mantener niveles de log apropiados

4. **Tipado**
   - Definir interfaces para payloads de eventos
   - Usar tipos genéricos cuando sea posible

## Notas de Implementación

- El servicio usa `EventSourcePolyfill` para compatibilidad
- Implementa reconexión exponencial
- Mantiene estado interno de conexión
- Gestiona múltiples suscriptores por evento
