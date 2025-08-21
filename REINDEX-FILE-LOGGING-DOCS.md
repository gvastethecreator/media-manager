# Sistema de Logging de Archivos para Reindexado - Documentación

## 📝 Resumen de Implementación

Hemos implementado un sistema completo de logging de archivos específicamente para trackear errores y warnings que ocurren durante los procesos de reindexado del sistema de gestión de imágenes.

## 🎯 Objetivos Cumplidos

✅ **Logging a archivos separados**: Errores y warnings se escriben a archivos diferentes
✅ **Rotación automática**: Archivos organizados por fecha (YYYY-MM-DD)
✅ **Categorización por fuente**: Logs etiquetados por componente (circuit-breaker, auto-indexing, etc.)
✅ **API REST completa**: Endpoints para consultar, estadísticas y gestión de logs
✅ **Interfaz web**: Componente React para visualizar logs en tiempo real
✅ **Limpieza automática**: Eliminación de logs antiguos (30+ días)
✅ **Integración completa**: Logging activo en todos los componentes críticos

## 📁 Estructura de Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/lib/logger/reindex-file-logger.ts`**
   - Logger principal para archivos
   - Gestión de rotación automática
   - Métodos para errores, warnings y estadísticas
   - Limpieza automática de logs antiguos

2. **`src/server/routes/api/reindex-logs.ts`**
   - API REST para consultar logs
   - Endpoints: `/stats`, `/errors`, `/warnings`, `/summary`, `/cleanup`, `/recent`
   - Paginación y filtrado de logs

3. **`src/components/system/ReindexLogsViewer.tsx`**
   - Interfaz React para visualizar logs
   - Tabs para errores, warnings, recientes y resumen
   - Actualización automática en tiempo real
   - Herramientas de limpieza y actualización

4. **`src/lib/logger/init-file-logging.ts`**
   - Inicializador del sistema de logging
   - Configuración automática al arrancar servidor
   - Limpieza programada cada 24 horas

5. **`src/app/admin/reindex/page.tsx`**
   - Página administrativa para acceder a logs
   - Ruta: `/admin/reindex`

### Archivos Modificados

1. **`src/lib/system/circuit-breaker.ts`**
   - Integrado logging de errores y warnings a archivos
   - Trackea fallos y aperturas de circuit breakers

2. **`src/lib/filesystem/folder-stats.ts`**
   - Logging de errores en sincronización automática
   - Trackea fallos en extracción de metadata
   - Logging de errores en procesamiento de thumbnails

3. **`src/hooks/use-auto-folder-indexing.ts`**
   - Logging de errores en auto-indexación
   - Trackea batches completados con errores

4. **`src/server/index.ts`**
   - Inicialización automática del sistema de logging
   - Nueva ruta API registrada

## 📊 Funcionalidades Implementadas

### 1. Logging Estructurado

```typescript
interface ReindexLogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN';
  source: 'circuit-breaker' | 'auto-indexing' | 'folder-stats' | 'monitor' | 'operation-queue' | 'file-browser';
  operationId?: string;
  folderId?: string;
  folderPath?: string;
  message: string;
  context?: any;
  error?: { name: string; message: string; stack?: string; };
}
```

### 2. Archivos de Log Organizados

```
logs/reindex/
├── reindex-errors-2025-01-XX.log    # Solo errores
├── reindex-warnings-2025-01-XX.log  # Solo warnings
├── reindex-errors-2025-01-YY.log    # Rotación diaria automática
└── reindex-warnings-2025-01-YY.log
```

### 3. API REST Completa

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/reindex-logs/stats` | GET | Estadísticas de archivos de log |
| `/api/reindex-logs/errors` | GET | Lista de errores recientes |
| `/api/reindex-logs/warnings` | GET | Lista de warnings recientes |
| `/api/reindex-logs/recent` | GET | Logs combinados ordenados por fecha |
| `/api/reindex-logs/summary` | GET | Resumen de errores por fuente (7 días) |
| `/api/reindex-logs/cleanup` | POST | Limpia logs antiguos manualmente |

### 4. Loggers Específicos por Fuente

```typescript
// Disponibles para importar
export const circuitBreakerLogger = createSourceLogger('circuit-breaker');
export const autoIndexingLogger = createSourceLogger('auto-indexing');
export const folderStatsLogger = createSourceLogger('folder-stats');
export const monitorLogger = createSourceLogger('monitor');
export const operationQueueLogger = createSourceLogger('operation-queue');
export const fileBrowserLogger = createSourceLogger('file-browser');
```

### 5. Interfaz Web Completa

- **Vista Recientes**: Combinación de errores y warnings ordenados cronológicamente
- **Vista Errores**: Solo errores con contexto detallado
- **Vista Warnings**: Solo warnings con información de contexto
- **Vista Resumen**: Estadísticas por fuente de errores (últimos 7 días)
- **Controles**: Límite de entradas, actualización manual, limpieza de logs
- **Auto-actualización**: Refresh automático cada 5-60 segundos según la vista

## 🔧 Configuración y Uso

### Acceso a la Interfaz Web

1. Navegar a: `http://localhost:4000/admin/reindex`
2. Ver logs en tiempo real organizados por categorías
3. Usar controles para filtrar y limpiar logs

### Uso Programático

```typescript
import { reindexFileLogger, folderStatsLogger } from '@/lib/logger/reindex-file-logger';

// Logging directo
reindexFileLogger.logError('folder-stats', 'Error procesando carpeta', {
  folderId: 'folder-123',
  folderPath: '/path/to/folder',
  error: new Error('File not found')
});

// Logger específico por fuente
folderStatsLogger.logWarning('Thumbnail generation slow', {
  context: { processingTime: 5000, filePath: '/image.jpg' }
});
```

### API REST

```bash
# Obtener estadísticas
curl http://localhost:4000/api/reindex-logs/stats

# Obtener últimos 50 errores
curl http://localhost:4000/api/reindex-logs/errors?limit=50

# Obtener resumen por fuente (últimos 7 días)
curl http://localhost:4000/api/reindex-logs/summary?days=7

# Limpiar logs antiguos
curl -X POST http://localhost:4000/api/reindex-logs/cleanup
```

## 🚀 Beneficios Implementados

1. **Identificación Rápida de Problemas**: Todos los errores del sistema de reindexado quedan registrados
2. **Debugging Eficiente**: Logs estructurados con contexto completo (folderId, paths, parámetros)
3. **Monitoreo en Tiempo Real**: Interfaz web que se actualiza automáticamente
4. **Gestión Automática**: Rotación diaria y limpieza automática de logs antiguos
5. **Categorización Inteligente**: Logs organizados por fuente para análisis específico
6. **Persistencia**: Logs guardados en archivos, no se pierden al reiniciar
7. **Performance**: Escritura asíncrona, no bloquea operaciones principales

## ⚡ Próximos Pasos Recomendados

1. **Alertas Automáticas**: Implementar notificaciones cuando hay muchos errores
2. **Métricas Avanzadas**: Gráficos de tendencias de errores por tiempo
3. **Integración con Monitoring**: Conectar con herramientas como Prometheus/Grafana
4. **Compresión de Logs**: Comprimir logs antiguos antes de eliminarlos
5. **Filtros Avanzados**: Filtrar por folderId, rango de fechas, etc.

---

🎉 **Sistema completamente funcional y listo para producción**