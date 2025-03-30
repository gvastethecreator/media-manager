# Guía del Sistema de Eventos del Servidor

## Introducción

El sistema de eventos del servidor es una arquitectura centralizada para la gestión de eventos en la aplicación. Este sistema reemplaza el uso del patrón EventEmitter tradicional, proporcionando una solución más robusta, tipada y mantenible para la comunicación entre componentes.

## Arquitectura

### Componentes Principales

1. **Núcleo del Sistema** (`src/lib/server/events.server.ts`):
   - Define tipos de eventos
   - Implementa la emisión de eventos
   - Maneja la revalidación de rutas

2. **Capa de Compatibilidad** (`src/lib/events/server.ts`):
   - Proporciona funciones de compatibilidad para código existente
   - Re-exporta tipos y funciones del núcleo

3. **Integración Cliente** (`src/lib/client/events.client.ts`):
   - Implementa el hook `useEvents` para componentes React
   - Proporciona funciones para suscribirse a eventos en el cliente

### Flujo de Eventos

1. Un servicio emite un evento utilizando la función `emit`
2. El sistema central registra el evento y revalida las rutas asociadas
3. Los componentes cliente suscritos al evento reciben la notificación
4. Las rutas afectadas se revalidan automáticamente

## Guía de Migración

### 1. Migración desde EventEmitter

#### Antes:
```typescript
import { EventEmitter } from 'events';

class MyService extends EventEmitter {
  constructor() {
    super();
  }

  doSomething() {
    // ... código ...
    this.emit('thing:done', { id: '123' });
  }
}
```

#### Después:
```typescript
import { emit } from '@/lib/server/events.server';

class MyService {
  constructor() {
    // No necesita extender de EventEmitter
  }

  async doSomething() {
    // ... código ...
    await emit({
      type: 'thing:done',
      id: '123',
      data: { /* datos adicionales */ }
    });
  }
}
```

### 2. Patrón de Implementación Recomendado

Para servicios más complejos que necesitan mantener callbacks locales además de emitir al sistema central:

```typescript
import { emit, type EventType } from '@/lib/server/events.server';
import { serverLogger } from '@/lib/logger/server-logger';

const serviceLogger = serverLogger.withContext('MyService');

// Definir tipos de eventos locales
export enum MY_EVENTS {
  PROGRESS = 'my:progress',
  ERROR = 'my:error',
  COMPLETE = 'my:complete',
}

// Implementación del servicio
class MyServiceClass {
  private static instance: MyServiceClass;
  private eventCallbacks = new Map<string, Set<CallableFunction>>();

  private constructor() {
    serviceLogger.info('🚀 Inicializando MyService');
  }

  static getInstance(): MyServiceClass {
    if (!MyServiceClass.instance) {
      MyServiceClass.instance = new MyServiceClass();
    }
    return MyServiceClass.instance;
  }

  // Métodos para gestionar callbacks
  private addCallback(event: string, callback: CallableFunction): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)?.add(callback);
  }

  private removeCallback(event: string, callback: CallableFunction): void {
    this.eventCallbacks.get(event)?.delete(callback);
  }

  // Método para emitir eventos
  private async emitEvent(event: string, ...args: unknown[]): Promise<void> {
    // Notificar a los callbacks locales
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          serviceLogger.error(`Error en callback para evento ${event}:`, error);
        }
      }
    }

    // Mapear a evento del sistema central
    let serverEventType: EventType | null = null;
    switch (event) {
      case MY_EVENTS.PROGRESS:
        serverEventType = 'update';
        break;
      case MY_EVENTS.ERROR:
        serverEventType = 'folder:error';
        break;
      case MY_EVENTS.COMPLETE:
        serverEventType = 'folder:complete';
        break;
      default:
        serverEventType = null;
    }

    // Emitir al sistema central
    if (serverEventType) {
      try {
        await emit({
          type: serverEventType,
          data: args[0],
        });
      } catch (emitError) {
        serviceLogger.error(`Error al emitir evento ${event}:`, emitError);
      }
    }
  }

  // Métodos públicos de suscripción
  onProgress(callback: (data: unknown) => void): void {
    this.addCallback(MY_EVENTS.PROGRESS, callback);
  }

  offProgress(callback: (data: unknown) => void): void {
    this.removeCallback(MY_EVENTS.PROGRESS, callback);
  }

  // Método de ejemplo que emite eventos
  async processItems(items: string[]): Promise<void> {
    try {
      const total = items.length;

      for (let i = 0; i < total; i++) {
        const item = items[i];

        // Emitir progreso
        await this.emitEvent(MY_EVENTS.PROGRESS, {
          current: i + 1,
          total,
          progress: Math.round(((i + 1) / total) * 100),
          currentItem: item,
        });

        // Procesar item...
        await this.processItem(item);
      }

      // Emitir completado
      await this.emitEvent(MY_EVENTS.COMPLETE, {
        itemsProcessed: total,
        timestamp: Date.now(),
      });

    } catch (error) {
      // Emitir error
      await this.emitEvent(MY_EVENTS.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  private async processItem(item: string): Promise<void> {
    // Implementación específica
  }
}

// Exportar singleton
export const myService = MyServiceClass.getInstance();
```

## Uso del Sistema de Eventos

### 1. Emisión de Eventos desde Server Actions

```typescript
import { emit } from '@/lib/server/events.server';

export async function updateEntity(id: string, data: unknown) {
  'use server';

  try {
    // Actualizar entidad en la base de datos
    const updatedEntity = await db.entity.update({
      where: { id },
      data,
    });

    // Emitir evento de actualización
    await emit({
      type: 'update',
      id,
      data: updatedEntity,
    });

    return { success: true, entity: updatedEntity };
  } catch (error) {
    // Manejar error
    return { success: false, error };
  }
}
```

### 2. Suscripción a Eventos en Componentes

```tsx
'use client';

import { useEffect } from 'react';
import { clientEvents } from '@/lib/client/events.client';

export function EntityUpdatesListener() {
  useEffect(() => {
    // Función de callback para el evento
    const handleEntityUpdate = (data: unknown) => {
      console.log('Entidad actualizada:', data);
    };

    // Suscribirse al evento
    clientEvents.on('update', handleEntityUpdate);

    // Limpieza al desmontar
    return () => {
      clientEvents.off('update', handleEntityUpdate);
    };
  }, []);

  return null; // Este componente no renderiza nada
}
```

### 3. Uso de useEvents en Componentes

```tsx
'use client';

import { useEffect } from 'react';
import { clientEvents, useEvents } from '@/lib/client/events.client';
import { updateEntity } from '@/app/actions/entity';

interface EntityState {
  entities: Array<{ id: string; name: string }>;
  isLoading: boolean;
}

export function EntityList() {
  // Inicializar estado con useEvents
  const [state, addEvent] = useEvents<EntityState>({
    entities: [],
    isLoading: false,
  });

  // Cargar entidades al montar
  useEffect(() => {
    fetchEntities();
  }, []);

  // Función para actualizar una entidad
  async function handleUpdate(id: string, newName: string) {
    // Actualizar optimistamente el estado
    addEvent({
      type: 'update',
      id,
      data: {
        name: newName,
      },
    });

    // Enviar actualización al servidor
    await updateEntity(id, { name: newName });
  }

  // Renderizar lista de entidades
  return (
    <div>
      {state.entities.map(entity => (
        <div key={entity.id}>
          {entity.name}
          <button onClick={() => handleUpdate(entity.id, `${entity.name}-updated`)}>
            Update
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Tipos de Eventos

El sistema define varios tipos de eventos en `EventType`:

```typescript
export type EventType =
  | 'create'
  | 'update'
  | 'delete'
  | 'addImage'
  | 'removeImage'
  | 'collections:modified'
  | 'tags:modified'
  | 'albums:modified'
  | 'prompts:modified'
  | 'notes:modified'
  | 'characters:modified'
  | 'places:modified'
  | 'objects:modified'
  | 'world-items:modified'
  | 'favorites:modified'
  | 'images:modified'
  | 'files:modified'
  | 'folders:modified'
  | 'folder:progress'
  | 'folder:error'
  | 'folder:complete'
  | 'folder:stats'
  | 'folder:reindexAll:start'
  | 'folder:reindexAll:progress'
  | 'folder:reindexAll:complete'
  | 'uploaded-image:created'
  | 'uploaded-image:updated'
  | 'uploaded-image:deleted'
  | 'uploaded-images:changed';
```

Cada tipo de evento está asociado a un conjunto de rutas que se revalidarán automáticamente en el mapa `EVENT_PATHS`.

## Mejores Prácticas

1. **Utiliza tipos específicos para eventos**: Define claramente los tipos de eventos y datos para facilitar el mantenimiento.

2. **Maneja errores en callbacks**: Evita que un error en un callback bloquee la ejecución de otros.

3. **Documenta tus eventos**: Asegúrate de que otros desarrolladores entiendan qué eventos emite tu servicio.

4. **Evita eventos duplicados**: Consolida eventos similares para evitar revalidaciones innecesarias.

5. **Usa patrones consistentes**: Sigue un patrón consistente para nombres de eventos y estructura de datos.

6. **Gestiona concurrencia**: Utiliza técnicas como debounce para eventos que pueden ocurrir frecuentemente.

7. **Mantén los datos de eventos ligeros**: Envía solo los datos necesarios para reducir la carga.

## Resolución de Problemas

### 1. Eventos que no llegan a los suscriptores

- Verifica que estás utilizando el tipo de evento correcto
- Asegúrate de usar `await` en la llamada a `emit`
- Comprueba que las suscripciones estén correctamente configuradas

### 2. Rutas que no se revalidan

- Verifica que el tipo de evento esté registrado en `EVENT_PATHS`
- Comprueba que las rutas estén correctamente definidas
- Asegúrate de que no hay errores en la emisión del evento

### 3. Errores en callbacks

- Implementa un manejo de errores robusto en tus callbacks
- Utiliza try/catch para evitar que un error bloquee otros callbacks
- Registra errores con el logger para facilitar la depuración

## Conclusión

El nuevo sistema de eventos proporciona una forma más robusta, tipada y mantenible de manejar eventos en la aplicación. Al centralizar la lógica de eventos y revalidación, se mejora la consistencia y se reduce la duplicación de código.

Siguiendo las pautas y ejemplos de esta guía, podrás migrar tus servicios existentes al nuevo sistema y crear nuevos servicios que aprovechen todas sus ventajas.