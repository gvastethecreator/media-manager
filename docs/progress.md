# Progress Log - Image Manager

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

#### Soluciones Implementadas:

1. **Corrección de Rutas Dinámicas**:

```typescript
// Antes
const id = params.id;

// Después
const id = await Promise.resolve(params.id);
```

2. **Mejora en el Manejo de Streams**:

- Implementación de timeout configurable (10s)
- Aumento de reintentos de conexión (50 intentos)
- Mejor manejo de cleanup de recursos

3. **Mejora en la Sincronización**:

- Evento 'connected' para confirmar establecimiento de conexión
- Heartbeat para mantener conexiones vivas
- Mejor manejo de estados de conexión

4. **Estructura de Archivos Clave**:

- `/src/lib/stream.ts`: Manejo central de streams SSE
- `/src/app/api/folders/reindex/[id]/events/route.ts`: Endpoint SSE
- `/src/app/api/folders/reindex/[id]/route.ts`: Endpoint de reindexación
- `/src/services/folder.service.ts`: Servicios de carpetas

#### Puntos de Atención:

1. Siempre esperar la confirmación de conexión SSE antes de iniciar procesos
2. Implementar timeouts adecuados para evitar bloqueos
3. Manejar correctamente la limpieza de recursos
4. Mantener logs detallados para debugging

#### TODO:

- [ ] Implementar retry con backoff exponencial
- [ ] Mejorar manejo de errores en el cliente
- [ ] Agregar tests para escenarios de fallo
- [ ] Implementar circuit breaker para conexiones SSE
- [ ] Mejorar documentación de API

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
