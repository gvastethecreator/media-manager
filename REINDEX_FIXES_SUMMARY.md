/**
 * @file Resumen de correcciones aplicadas al sistema de reindexado
 * @description Documento que resume las mejoras implementadas para prevenir loops infinitos y cuelgues
 */

# Correcciones Aplicadas al Sistema de Reindexado

## 🛡️ 1. Circuit Breaker Pattern

### Implementación
- **Archivo**: `src/lib/system/circuit-breaker.ts`
- **Funcionalidad**: Previene operaciones repetitivas fallidas y loops infinitos
- **Características**:
  - 3 estados: CLOSED, OPEN, HALF_OPEN
  - Backoff exponencial (1s → 2s → 4s → 8s...)
  - Timeout configurable por operación (5-10 minutos)
  - Registry global para gestión centralizada

### Configuración por Tipo
```typescript
// Para reindexado de carpetas
{
  failureThreshold: 2,      // Solo 2 fallos
  recoveryTimeout: 120_000, // 2 minutos de cooldown
  operationTimeout: 600_000, // 10 minutos por carpeta
}

// Para auto-indexing
{
  failureThreshold: 3,      // 3 fallos permitidos
  recoveryTimeout: 300_000, // 5 minutos de cooldown
  operationTimeout: 180_000, // 3 minutos por lote
}
```

## 🔄 2. Hook de Auto-Indexing Mejorado

### Problemas Corregidos
- **Condiciones de carrera**: Referencias `useRef` para evitar estados inconsistentes
- **Cleanup adecuado**: Limpieza de intervals y flags al desmontar
- **Circuit breaker integration**: Protección automática contra fallos repetitivos
- **Cancelación**: Detecta desmontaje del componente para cancelar operaciones

### Mejoras Implementadas
```typescript
// Referencias para prevenir race conditions
const isIndexingRef = useRef(false);
const intervalRef = useRef<NodeJS.Timeout | null>(null);
const isUnmountedRef = useRef(false);
const circuitBreaker = useRef(getAutoIndexCircuitBreaker());
```

## 🧭 3. File Browser Data con Cooldown

### Sistema de Control Mejorado
```typescript
interface AutoReindexState {
  lastAttempt: number;
  attempts: number;
  maxAttempts: number;      // 3 por sesión
  cooldownPeriod: number;   // 5 minutos inicial
}
```

### Características
- **Cooldown period**: 5 minutos entre intentos (incrementa con fallos)
- **Límite de intentos**: Máximo 3 por carpeta por sesión
- **Backoff adaptativo**: Cooldown se incrementa 1.5x por cada fallo
- **Reset en éxito**: Intentos se resetean tras operación exitosa

## ⚙️ 4. Operation Queue con Timeout

### Mejoras en `unified-file-manager.store.ts`
- **Timeout por operación**: 2 minutos por defecto, configurable
- **Tracking de operaciones**: ID único y tiempo de inicio
- **Detección de cuelgues**: Cancelación automática tras 5 minutos
- **Estadísticas**: Métricas de cola y operaciones activas

### Nueva API
```typescript
async add<T>(
  operation: () => Promise<T>, 
  timeout = 120_000,
  id = generateId()
): Promise<T>

// Métodos de monitoreo
getStats() // Estado actual de la cola
cancelIfStuck(maxRunningTime) // Cancelar si está colgado
```

## 📊 5. Sistema de Monitoreo

### Archivo: `src/lib/system/reindex-monitor.ts`
- **Health checks**: Cada 30 segundos
- **Métricas**: Operaciones activas, tiempo promedio, ratio de errores
- **Detección automática**: Operaciones colgadas (10+ minutos)
- **Alertas**: Logs automáticos para condiciones anómalas

### Endpoints de Monitoreo
```
GET  /api/system/health         - Estado general del sistema
POST /api/system/reindex/reset  - Reset completo
POST /api/system/reindex/cancel - Cancelar operaciones activas
```

## 🔧 6. Protecciones Adicionales

### En `folder-stats.ts`
- **Logging mejorado**: Advertencias cuando se evita reindexado duplicado
- **Integración circuit breaker**: Solo en nivel raíz (no subcarpetas)
- **Monitoreo automático**: Tracking de todas las operaciones

### En `folder-scanner.ts`
- **Límite de concurrencia**: Máximo 4 operaciones paralelas
- **Timeout defensivo**: 5 segundos por metadata/thumbnail
- **Progress mapping**: Progreso nunca llega a 100% hasta completar subcarpetas

## 🚨 7. Condiciones de Fallo Manejadas

### Loops Infinitos
- ✅ Auto-reindex con cooldown y límite de intentos
- ✅ Circuit breaker previene reintentos inmediatos
- ✅ Operaciones duplicadas bloqueadas por ID único

### Condiciones de Carrera
- ✅ Referencias `useRef` en lugar de estado React
- ✅ Flags de desmontaje para cancelar operaciones
- ✅ Queue serializada para operaciones críticas

### Memory Leaks
- ✅ Cleanup de intervals y timeouts
- ✅ Límite de historial en monitor (100 operaciones)
- ✅ Clear de maps y sets en unmount

### Operaciones Colgadas
- ✅ Timeout global de 5-10 minutos por operación
- ✅ Detección automática de operaciones colgadas
- ✅ Cancelación forzada disponible via API

## 🎯 8. Casos Edge Manejados

### Carpetas Vacías o Inexistentes
```typescript
// Verificación temprana con logging
if (!folder) {
  throw new Error(`Carpeta con ID ${folderId} no encontrada`);
}
```

### Recursión Profunda
```typescript
// Límite de profundidad con warning
if (currentDepth >= maxDepth) {
  console.warn(`⚠️ Límite de profundidad alcanzado: ${currentDepth}/${maxDepth}`);
  return emptyStats;
}
```

### Fallos de Red/Disco
- Circuit breaker maneja timeouts y errores de I/O
- Retry automático con backoff exponencial
- Degradación graceful sin crash del sistema

## 📈 9. Métricas y Observabilidad

### Health Checks Automáticos
- **Operaciones activas** > 5: Warning
- **Ratio de errores** > 30%: Alert
- **Tiempo promedio** > 5 minutos: Alert
- **Presión de memoria**: Estimada por operaciones activas

### Dashboard de Estado
```json
{
  "health": {
    "activeOperations": 2,
    "averageOperationTime": 45000,
    "errorRate": 0.1,
    "memoryPressure": "low"
  },
  "circuitBreakers": {
    "folder-reindex": { "state": "CLOSED", "failureCount": 0 },
    "auto-index": { "state": "CLOSED", "failureCount": 0 }
  }
}
```

## 🔬 10. Testing y Validación

### Casos de Prueba Recomendados
1. **Loop prevention**: Carpeta que falla consistentemente
2. **Race conditions**: Navegación rápida entre carpetas
3. **Memory pressure**: Reindexado de 100+ carpetas
4. **Network issues**: Timeouts y reconexiones
5. **Graceful degradation**: Sistema bajo estrés

### Comandos de Debugging
```bash
# Verificar estado del sistema
curl http://localhost:4000/api/system/health

# Reset en caso de problemas
curl -X POST http://localhost:4000/api/system/reindex/reset

# Cancelar operaciones colgadas
curl -X POST http://localhost:4000/api/system/reindex/cancel
```

## 🏁 Resultado Final

### Antes de las Correcciones
- ❌ Loops infinitos en auto-reindex
- ❌ Frontend se colgaba indefinidamente
- ❌ Condiciones de carrera frecuentes
- ❌ Sin mecanismo de recuperación
- ❌ Operaciones sin timeout

### Después de las Correcciones
- ✅ Circuit breaker previene loops
- ✅ Timeouts garantizan terminación
- ✅ Cooldown periods evitan spam
- ✅ Monitoreo automático y alertas
- ✅ Recovery mechanisms robusto
- ✅ Observabilidad completa
- ✅ Graceful degradation