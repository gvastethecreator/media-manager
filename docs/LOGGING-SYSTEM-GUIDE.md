# Sistema de Logging - Guía de Uso

## 🎯 Resumen Ejecutivo

Sistema de logging estructurado con correlación por `requestId`, contexto automático y eliminación de duplicados. Cada request HTTP tiene un logger pre-configurado disponible en `res.locals.logger`.

## 🔗 Correlación por Request ID

### Headers HTTP
```bash
# Entrada (opcional): Cliente puede enviar su propio ID
x-request-id: mi-request-personalizado

# Salida (automático): Servidor siempre devuelve el ID
X-Request-Id: b297e7e1-f534-446c-b051-1e6598d9b72a
```

### Propagación Automática
- ID se genera automáticamente si no viene en header
- Se almacena en `res.locals.requestId`
- Se incluye en todos los logs del request
- Se devuelve en header de respuesta

## 📝 Logger Contextual por Request

### Uso Recomendado

```typescript
// ✅ CORRECTO: Usar logger contextual
app.get('/api/users', async (req, res) => {
  const logger = res.locals.logger;
  
  logger.info('Iniciando búsqueda de usuarios', { 
    limit: req.query.limit,
    offset: req.query.offset 
  });
  
  try {
    logger.db('Consultando tabla users', { filters: req.query });
    const users = await db.select().from(usersTable);
    
    logger.success('Usuarios obtenidos', { count: users.length });
    res.json({ users, total: users.length });
    
  } catch (error) {
    logger.error('Error en consulta users', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ error: 'database_error' });
  }
});
```

### Anti-patrones (Evitar)

```typescript
// ❌ MAL: Console directo
console.log('Usuario obtenido'); // Sin contexto, sin correlación

// ❌ MAL: serverLogger sin contexto  
serverLogger.info('Procesando'); // Falta requestId y contexto

// ❌ MAL: Logs duplicados
console.log('Inicio');
logger.info('Inicio'); // Duplicación innecesaria
```

## 📊 Niveles de Logging

| Nivel | Uso | Ejemplo |
|-------|-----|---------|
| `debug` | Información detallada de desarrollo | Variables, estados internos |
| `info` | Flujo normal de la aplicación | Inicio de operaciones, resultados |
| `warn` | Situaciones inusuales no críticas | Deprecations, fallbacks |
| `error` | Errores que requieren atención | Excepciones, fallos de DB |
| `success` | Operaciones completadas exitosamente | Creaciones, actualizaciones |
| `http` | Requests y respuestas HTTP específicas | Llamadas a APIs externas |
| `db` | Operaciones de base de datos | Queries, transacciones |
| `api` | Interacciones con APIs externas | Llamadas, respuestas |
| `system` | Eventos del sistema | Startup, shutdown, configuración |

## 🎯 Contexto Automático

Cada `res.locals.logger` incluye automáticamente:

```typescript
{
  method: 'GET',           // Método HTTP
  url: '/api/users?page=1', // URL completa con query params
  ip: '127.0.0.1',         // IP del cliente
  requestId: 'uuid-here',   // ID de correlación
  startTime: 1234567890     // Para medir performance
}
```

## 📁 Archivos de Log

```bash
logs/
├── server-2025-09-01.log      # Log principal (HTTP middleware)
├── console-migration-report.json # Reporte de migración console.*
└── reindex/                   # Logs del sistema de reindexado
    ├── reindex-errors-*.log
    └── reindex-warnings-*.log
```

## 🔍 Formato de Logs

### En Archivo
```bash
[2025-09-01T04:49:48.936Z] [INFO] ℹ️ [rid:b297e7e1...] 🌐 GET /health - IP: 127.0.0.1 - START
[2025-09-01T04:49:48.937Z] [INFO] ℹ️ [rid:b297e7e1...] ✅ GET /health - 200 - 1ms - IP: 127.0.0.1 - END
```

### En Consola (Coloreado)
```bash
🔍 [HTTP-LOG] [rid:b297e7e1...] 🌐 GET /health - IP: 127.0.0.1 - START
🔍 [HTTP-LOG] [rid:b297e7e1...] ✅ GET /health - 200 - 1ms - IP: 127.0.0.1 - END
```

## ⚙️ Configuración

### Variables de Entorno
```bash
LOG_TO_CONSOLE=true     # Habilitar logs en consola (default: true)
LOG_LEVEL=info          # Nivel mínimo de logging (default: info)
```

### Configuración de Servicios
```typescript
// src/lib/logger/logger.config.ts
export const loggerConfig = {
  level: 'info',
  enableConsole: true,
  services: {
    HTTPMiddleware: { level: 'info' },
    ServerStartup: { level: 'info' },
    FileEntityMapper: { level: 'debug' },
    // ...
  }
};
```

## 🚀 Scripts de Análisis

```bash
# Ver logs recientes
bun run logs:list

# Limpiar logs antiguos (mantiene últimos 7 días)
bun run logs:clean

# Auditar console.* para migrar
bun run audit:console

# Análizar duplicados en logs
bun run analyze:logs
```

## 📚 Migración de Console.*

### Identificar Candidatos
```bash
# Generar reporte de console.* usage
bun run audit:console

# Ver top offenders
cat logs/console-migration-report.json | jq '.summary.topFiles'
```

### Patrón de Migración

```typescript
// ❌ Antes
export async function getUserById(id: string) {
  console.log('Buscando usuario:', id);
  
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    console.log('Usuario encontrado:', user?.email);
    return user;
  } catch (error) {
    console.error('Error buscando usuario:', error);
    throw error;
  }
}

// ✅ Después (en un handler Express)
app.get('/api/users/:id', async (req, res) => {
  const logger = res.locals.logger;
  const { id } = req.params;
  
  logger.info('Buscando usuario', { userId: id });
  
  try {
    logger.db('Consultando tabla users', { userId: id });
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    
    if (user) {
      logger.success('Usuario encontrado', { email: user.email });
      res.json(user);
    } else {
      logger.warn('Usuario no encontrado', { userId: id });
      res.status(404).json({ error: 'user_not_found' });
    }
  } catch (error) {
    logger.error('Error buscando usuario', { 
      userId: id, 
      error: error.message 
    });
    res.status(500).json({ error: 'database_error' });
  }
});
```

## 🔧 TypeScript Support

### Tipos Disponibles
```typescript
// Auto-completado para logger
res.locals.logger.info();  // ✅ Tipado
res.locals.requestId;      // ✅ string

// Interfaz RequestLogger exportada
import type { RequestLogger } from '../server/middleware/logging';
```

### Augmentación Express
Los tipos están automáticamente disponibles via `src/types/express.d.ts`:
```typescript
declare global {
  namespace Express {
    interface Locals {
      logger: RequestLogger;
      requestId: string;
    }
  }
}
```

## 🐛 Troubleshooting

### Logger no disponible
```typescript
// ✅ Verificar middleware está aplicado
app.use(requestLogger);

// ✅ Verificar orden de middlewares
app.use(requestLogger);  // Debe ir antes que las rutas
app.use('/api', userRoutes);
```

### Logs duplicados
```typescript
// ❌ Evitar múltiples loggers para la misma acción
logger.info('Procesando usuario');
console.log('Procesando usuario'); // Duplicado

// ✅ Un solo log por acción
logger.info('Procesando usuario', { action: 'process_user' });
```

### RequestId no aparece en logs
```bash
# Verificar que el middleware está corriendo
curl -i http://localhost:4000/health

# Buscar logs con requestId
grep "rid:" logs/server-$(date +%Y-%m-%d).log
```

## ✅ Checklist de Migración

- [ ] Identificar archivos con console.* via `bun run audit:console`
- [ ] Migrar handlers Express a usar `res.locals.logger`  
- [ ] Reemplazar console.* en funciones utilitarias
- [ ] Verificar que no hay logs duplicados
- [ ] Confirmar correlación con requestId en archivos de log
- [ ] Actualizar documentación específica del módulo

## 📈 Beneficios Post-Migración

- ✅ **Correlación**: Todos los logs de un request se pueden correlacionar
- ✅ **Contexto**: Información automática de método, URL, IP
- ✅ **Performance**: Tiempo de respuesta incluido automáticamente
- ✅ **Estructurado**: Logs consistentes y parseables
- ✅ **Observabilidad**: Fácil debugging y monitoring
- ✅ **Sin duplicados**: Eliminada la duplicación de middleware