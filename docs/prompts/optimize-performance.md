## Prompts para Optimización de Rendimiento

Este conjunto de prompts está diseñado para identificar, analizar y mejorar el rendimiento en diferentes aspectos de la aplicación. Son útiles para optimizar la velocidad, eficiencia y uso de recursos del sistema.

### Optimización de Frontend

Estos prompts se centran en mejorar el rendimiento del lado del cliente.

#### Optimización de Bundle

```
Analiza y optimiza el tamaño del bundle de la aplicación. Implementa code splitting, lazy loading y tree shaking. Identifica y elimina dependencias innecesarias. Configura la compresión y minimización óptima.
```

#### Renderizado de Componentes

```
Optimiza el rendimiento de renderizado de los componentes React. Implementa memorización, reduce re-renders innecesarios y optimiza la jerarquía de componentes. Utiliza herramientas de profiling para identificar cuellos de botella.
```

#### Optimización de Assets

```
Mejora la carga y manejo de assets. Implementa lazy loading de imágenes, optimiza formatos y tamaños, utiliza CDN efectivamente. Configura la precarga de recursos críticos y la carga diferida de recursos no críticos.
```

#### Caché de Cliente

```
Implementa y optimiza estrategias de caché en el cliente. Configura service workers, utiliza caché de recursos estáticos y optimiza la persistencia de datos locales. Implementa estrategias de revalidación eficientes.
```

#### Performance Metrics

```
Establece y monitorea métricas clave de rendimiento (Core Web Vitals). Optimiza FCP, LCP, CLS y TTI. Implementa RUM (Real User Monitoring) y analiza métricas de campo.
```

#### Optimización de Rutas

```
Mejora el rendimiento de navegación entre rutas. Implementa prefetching inteligente, optimiza la carga de datos por ruta y reduce el tiempo de transición entre páginas.
```

#### Estado y Memoria

```
Optimiza la gestión de estado y uso de memoria. Implementa limpieza de recursos, previene memory leaks y optimiza el tamaño del estado global. Monitorea y optimiza el uso de memoria en tiempo de ejecución.
```

#### Animaciones y Transiciones

```
Mejora el rendimiento de animaciones y transiciones. Utiliza propiedades CSS optimizadas, implementa will-change estratégicamente y optimiza frames por segundo. Reduce jank y mantén animaciones fluidas.
```

### Optimización de Backend

Estos prompts se centran en mejorar el rendimiento del servidor.

#### Optimización de Base de Datos

```
Analiza y optimiza el rendimiento de la base de datos SQLite. Implementa índices efectivos, optimiza queries complejas y mejora el esquema para mejor rendimiento. Implementa estrategias de caché de consultas frecuentes.
```

#### Procesamiento de Imágenes

```
Optimiza el pipeline de procesamiento de imágenes. Mejora la eficiencia de Sharp, implementa procesamiento en lotes eficiente y optimiza el uso de recursos durante el procesamiento. Implementa estrategias de cola inteligentes.
```

#### API Performance

```
Mejora el rendimiento de las API routes. Implementa caché efectivo, optimiza la serialización de datos y reduce la latencia de respuesta. Implementa compresión y optimiza el tamaño de las respuestas.
```

#### Manejo de Concurrencia

```
Optimiza el manejo de operaciones concurrentes. Implementa pooling efectivo, mejora la gestión de recursos compartidos y optimiza el procesamiento paralelo. Implementa límites y throttling apropiados.
```

#### Optimización de Filesystem

```
Mejora el rendimiento de operaciones de sistema de archivos. Optimiza la lectura/escritura de archivos, implementa buffering efectivo y mejora el manejo de grandes volúmenes de archivos.
```

#### Caché de Servidor

```
Implementa y optimiza estrategias de caché en el servidor. Configura caché en memoria, optimiza la invalidación de caché y implementa caché distribuido cuando sea necesario.
```

#### Monitoreo de Recursos

```
Establece monitoreo efectivo de recursos del servidor. Implementa tracking de uso de CPU, memoria y I/O. Configura alertas y optimiza basado en métricas de uso.
```

#### Optimización de Network

```
Mejora el rendimiento de red. Optimiza headers, implementa compresión efectiva y reduce el overhead de red. Implementa estrategias de retry y timeout apropiadas.
```

### Optimización de Datos

Estos prompts se centran en mejorar el manejo y flujo de datos.

#### Optimización de Queries

```
Analiza y optimiza las consultas a la base de datos. Implementa N+1 query solutions, optimiza JOINs y mejora la eficiencia de consultas frecuentes. Implementa paginación y límites apropiados.
```

#### Caché de Datos

```
Implementa estrategias efectivas de caché de datos. Configura diferentes niveles de caché, implementa políticas de invalidación inteligentes y optimiza el hit rate.
```

#### Optimización de Payload

```
Mejora la eficiencia de transferencia de datos. Optimiza el tamaño de payloads, implementa compresión efectiva y reduce datos redundantes. Implementa serialización eficiente.
```

#### Data Prefetching

```
Implementa estrategias inteligentes de prefetching. Anticipa necesidades de datos, precarga datos críticos y optimiza la experiencia del usuario. Implementa límites apropiados para evitar sobrecarga.
```

#### Batch Processing

```
Optimiza el procesamiento por lotes. Implementa estrategias eficientes de procesamiento masivo, optimiza el uso de memoria y mejora la velocidad de procesamiento.
```

#### Sincronización de Datos

```
Mejora la eficiencia de sincronización de datos. Implementa sincronización incremental, optimiza la detección de cambios y reduce el overhead de sincronización.
```

#### Optimización de Storage

```
Mejora el uso y eficiencia del almacenamiento. Implementa estrategias de compresión, optimiza el almacenamiento de blobs y mejora la gestión del espacio.
```

#### Data Streaming

```
Optimiza el streaming de datos. Implementa buffering efectivo, mejora la eficiencia de transmisión y optimiza el manejo de grandes volúmenes de datos en tiempo real.
```

### Optimización de Integración

Estos prompts se centran en mejorar el rendimiento de integraciones.

#### Optimización de Servicios Externos

```
Mejora el rendimiento de integraciones con servicios externos. Implementa caché efectivo, optimiza la frecuencia de llamadas y mejora el manejo de fallos.
```

#### WebSocket Performance

```
Optimiza el rendimiento de conexiones WebSocket. Mejora la eficiencia de mensajes, implementa reconexión inteligente y optimiza el uso de recursos.
```

#### Event Processing

```
Mejora el rendimiento del procesamiento de eventos. Optimiza la propagación de eventos, implementa buffering efectivo y mejora la eficiencia del sistema de eventos.
```

#### API Gateway

```
Optimiza el rendimiento del API gateway. Implementa rate limiting efectivo, mejora el routing y optimiza el procesamiento de requests.
```

#### Service Communication

```
Mejora la eficiencia de comunicación entre servicios. Implementa protocolos optimizados, reduce la latencia y mejora la confiabilidad.
```

#### Batch Operations

```
Optimiza operaciones en lote entre servicios. Implementa agregación efectiva, mejora la eficiencia de procesamiento masivo y optimiza el uso de recursos.
```

#### Circuit Breaking

```
Implementa circuit breaking efectivo. Optimiza timeouts, mejora la detección de fallos y implementa fallbacks eficientes.
```

#### Monitoring Integration

```
Mejora el monitoreo de integraciones. Implementa tracking efectivo, optimiza la recolección de métricas y mejora la visibilidad del rendimiento.
```
