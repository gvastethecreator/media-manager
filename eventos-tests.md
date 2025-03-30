# Plan de Pruebas Unitarias: Sistema de Eventos del Servidor

## Introducción

Este documento describe el plan de pruebas para el nuevo sistema de eventos del servidor implementado en la aplicación de gestión de imágenes. El objetivo es garantizar que todos los componentes del sistema de eventos funcionen correctamente y que la migración de servicios al nuevo sistema sea exitosa.

## Objetivos de las Pruebas

1. Verificar que los eventos se emitan correctamente
2. Confirmar que los eventos sean recibidos por los suscriptores adecuados
3. Asegurar que la revalidación de rutas funcione según lo esperado
4. Validar la integración entre servidor y cliente para eventos
5. Comprobar el manejo de errores durante la emisión y recepción de eventos

## Estructura de Pruebas

### 1. Pruebas Unitarias del Sistema Base de Eventos

#### 1.1 Pruebas para `events.server.ts`

- **Prueba 1.1.1**: Verificar que `emit()` funcione correctamente
  - Simular la emisión de varios tipos de eventos
  - Comprobar que `revalidatePath()` se llame con las rutas correctas
  - Verificar el registro en el logger

- **Prueba 1.1.2**: Verificar que `emitProgress()` funcione correctamente
  - Comprobar que se añade timestamp si no está presente
  - Verificar que se emite el evento de tipo 'folder:progress'

#### 1.2 Pruebas para `server.ts` (Capa de Compatibilidad)

- **Prueba 1.2.1**: Verificar que `emit()` llame correctamente a `serverEmit()`
  - Probar con string como primer parámetro
  - Probar con objeto EventData como primer parámetro

- **Prueba 1.2.2**: Verificar que `emitProgress()` llame correctamente a `serverEmitProgress()`

#### 1.3 Pruebas para `events.client.ts`

- **Prueba 1.3.1**: Verificar que `useEvents()` actualice el estado correctamente
  - Simular eventos y comprobar que se emiten a los suscriptores

- **Prueba 1.3.2**: Verificar que `on()` registre correctamente los callbacks
  - Registrar múltiples callbacks para un mismo evento
  - Verificar que todos sean llamados

- **Prueba 1.3.3**: Verificar que `off()` elimine correctamente los callbacks
  - Registrar y luego eliminar callbacks
  - Verificar que no sean llamados

### 2. Pruebas de Integración para Servicios Migrados

#### 2.1 Pruebas para ThumbnailService

- **Prueba 2.1.1**: Verificar la emisión de eventos con callbacks locales
  - Registrar callbacks para diferentes tipos de eventos
  - Ejecutar operaciones que generen esos eventos
  - Comprobar que los callbacks son llamados

- **Prueba 2.1.2**: Verificar la emisión de eventos al sistema central
  - Simular una operación como `optimizeThumbnails()`
  - Verificar que el evento se emita al sistema central
  - Comprobar la revalidación de rutas correspondientes

- **Prueba 2.1.3**: Verificar el manejo de errores en callbacks
  - Registrar callbacks que lancen excepciones
  - Verificar que otros callbacks sigan siendo ejecutados
  - Comprobar el registro de errores

#### 2.2 Pruebas para FolderService

- **Prueba 2.2.1**: Verificar la emisión de eventos con mapeo completo
  - Probar todos los tipos de eventos definidos en FOLDER_EVENTS
  - Comprobar que se mapean correctamente a eventos del sistema central

- **Prueba 2.2.2**: Verificar la integración con operaciones de carpetas
  - Simular operaciones como `addFolder()`, `indexFolder()`, etc.
  - Comprobar que los eventos correspondientes se emiten
  - Verificar que las operaciones concurrentes se manejan correctamente

#### 2.3 Pruebas para StatsService

- **Prueba 2.3.1**: Verificar la emisión de eventos al sistema central
  - Probar operaciones como `incrementViewCount()`
  - Comprobar que los eventos se emiten correctamente

- **Prueba 2.3.2**: Verificar que statsEventEmitter (capa de compatibilidad) funcione
  - Probar la emisión de eventos a través de statsEventEmitter
  - Verificar que se traducen correctamente a eventos del nuevo sistema

### 3. Pruebas End-to-End

#### 3.1 Pruebas de Revalidación de Rutas

- **Prueba 3.1.1**: Verificar que las rutas se revaliden correctamente
  - Emitir eventos de diferentes tipos
  - Comprobar que las rutas asociadas en EVENT_PATHS se revalidan

#### 3.2 Pruebas de Integración Cliente-Servidor

- **Prueba 3.2.1**: Verificar que los eventos emitidos en el servidor llegan al cliente
  - Usar `useEvents()` en un componente
  - Emitir eventos desde el servidor
  - Comprobar que el componente se actualiza correctamente

## Herramientas y Metodología

### Herramientas de Prueba

1. **Jest**: Para pruebas unitarias y de integración
2. **React Testing Library**: Para probar componentes React que usan `useEvents()`
3. **msw (Mock Service Worker)**: Para simular respuestas del servidor
4. **@testing-library/jest-dom**: Para aserciones DOM más expresivas

### Metodología

1. **Mocking**: Simular dependencias externas (revalidatePath, etc.)
2. **Spies**: Verificar que las funciones son llamadas con los argumentos correctos
3. **Fixtures**: Usar datos de prueba predefinidos
4. **Isolation**: Probar componentes de forma aislada

## Implementación

### Estructura de Archivos de Prueba

```
__tests__/
  lib/
    server/
      events.server.test.ts
    events/
      server.test.ts
    client/
      events.client.test.ts
  services/
    thumbnail.service.test.ts
    folder.service.test.ts
    stats.service.test.ts
  integration/
    events-revalidation.test.ts
    client-server-events.test.ts
```

### Ejemplo de Prueba Unitaria

```typescript
// __tests__/lib/server/events.server.test.ts
import { emit, emitProgress } from '@/lib/server/events.server';
import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';

// Mock dependencies
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

jest.mock('@/lib/logger/server-logger', () => ({
  serverLogger: {
    withContext: () => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn()
    })
  }
}));

describe('Server Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('emit', () => {
    it('should emit an event and revalidate associated paths', async () => {
      // Arrange
      const event = {
        type: 'create',
        id: '123',
        data: { test: true }
      };

      // Act
      await emit(event);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    // More tests...
  });

  // More describe blocks...
});
```

## Cronograma

1. **Semana 1**: Implementación de pruebas unitarias para el sistema base
2. **Semana 2**: Implementación de pruebas de integración para servicios
3. **Semana 3**: Implementación de pruebas end-to-end
4. **Semana 4**: Corrección de errores y mejoras basadas en los resultados

## Criterios de Éxito

1. Cobertura de código del 80% o superior para los componentes del sistema de eventos
2. Todas las pruebas pasan sin errores
3. El sistema soporta todos los casos de uso definidos
4. La revalidación de rutas funciona correctamente
5. La integración cliente-servidor es fluida y sin errores

## Conclusión

Este plan de pruebas garantizará que el nuevo sistema de eventos del servidor funcione de manera confiable y que la migración de servicios sea exitosa. Al implementar pruebas exhaustivas en cada nivel (unitarias, integración, end-to-end), podemos tener confianza en la robustez del sistema.