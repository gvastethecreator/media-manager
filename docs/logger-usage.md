# Guía de Uso del Logger

## Estructura y Organización

El sistema de logging de la aplicación está centralizado en la carpeta `src/lib/logger`. La estructura es la siguiente:

```
src/lib/logger/
├── console-formatter.ts  # Formato para mensajes en consola
├── enhanced-logger.ts    # Logger mejorado (legacy/compatibilidad)
├── index.ts             # Punto de entrada principal para importaciones
├── logger.config.ts     # Configuración del logger
└── server-logger.ts     # Implementación principal del logger
```

## Importación Recomendada

Para mantener la coherencia en todo el código, se recomienda importar siempre desde `@/lib/logger` en lugar de importar directamente de los archivos específicos:

```typescript
// ✅ RECOMENDADO
import { serverLogger, createLogger } from '@/lib/logger';

// ❌ NO RECOMENDADO
import { serverLogger } from '@/lib/logger/server-logger';
import { createLogger } from '@/lib/logger/server-logger';
```

## Funciones y Objetos Disponibles

El módulo `@/lib/logger` exporta las siguientes funcionalidades principales:

- **`serverLogger`**: Instancia global del logger para uso general
- **`createLogger(context)`**: Función para crear un logger con un contexto específico
- **`ServerLogger`**: Clase para crear instancias de logger personalizadas
- **Tipos**: `Logger`, `LogLevel`, `LoggerConfig`, `ServerLoggerOptions`

## Ejemplo de Uso

```typescript
// Importar el logger
import { serverLogger, createLogger } from '@/lib/logger';

// Usar directamente serverLogger
serverLogger.info('Mensaje informativo');
serverLogger.error('Error en el proceso', errorObject);

// Crear un logger específico para un componente o servicio
const logger = createLogger('MiServicio');
logger.debug('Inicializando servicio');
logger.success('Operación completada con éxito');
```

## Niveles de Log

El sistema soporta los siguientes niveles de log, en orden de severidad:

1. `error` - Errores críticos que impiden el funcionamiento
2. `warn` - Advertencias sobre situaciones problemáticas
3. `info` - Información general (nivel por defecto)
4. `debug` - Información detallada para depuración

## Configuración

La configuración del logger se encuentra en `logger.config.ts`. Se puede ajustar el nivel de log global y por servicio, así como opciones de formato.