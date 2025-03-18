## Prompts para Análisis del Código Base

Este conjunto de prompts está diseñado para realizar análisis profundos y detallados de diferentes aspectos de la base de código. Son útiles cuando necesitamos entender mejor cómo funciona una parte específica del sistema, identificar posibles problemas o planear mejoras.

### Análisis de Frontend

Estos prompts son útiles para analizar la estructura, el rendimiento y la arquitectura de los componentes del frontend. Nos ayudan a entender mejor el flujo de datos, la gestión del estado y la experiencia del usuario.

#### Vista de Galería

```
Realiza un análisis detallado del flujo de datos en los componentes de la vista de galería, incluyendo cómo se manejan las actualizaciones de estado, la carga de imágenes y la interacción del usuario. Considera especialmente el rendimiento con grandes colecciones de imágenes y la experiencia del usuario durante la carga.
```

#### Zustand

```
Examina la integración entre Zustand y los componentes de React en nuestra aplicación, detallando cómo se estructura el estado global, qué stores tenemos implementados y cómo se manejan las actualizaciones. Incluye un análisis de posibles problemas de rendimiento o memory leaks.
```

#### Server Components

```
Analiza la implementación actual de Server Components en nuestra aplicación, identificando qué componentes son server-side y client-side, cómo se manejan las interacciones entre ellos y cómo podríamos mejorar la división para optimizar el rendimiento y la experiencia del usuario.
```

#### Navegación y Animaciones

```
Realiza una revisión exhaustiva de la estructura de navegación y el manejo de rutas en la aplicación, incluyendo cómo se manejan las transiciones entre vistas, la gestión del historial y la experiencia de navegación del usuario. Considera la accesibilidad y el SEO.
```

#### Animaciones

```
Evalúa en detalle la implementación actual de las animaciones con Motion, analizando el impacto en el rendimiento, la fluidez de las transiciones y la experiencia del usuario. Incluye recomendaciones para optimizar las animaciones en dispositivos de bajo rendimiento.
```

#### Diseño Responsivo

```
Analiza la implementación de la interfaz de usuario para dispositivos móviles, incluyendo la respuesta táctil, el diseño responsivo y la adaptación de características principales para pantallas pequeñas.
```

#### Componentes Reutilizables

```
Examina la estructura y eficiencia de los componentes reutilizables, evaluando su flexibilidad, mantenibilidad y coherencia con el diseño del sistema.
```

#### Accesibilidad

```
Realiza un análisis profundo de la accesibilidad en los componentes principales, incluyendo el soporte para lectores de pantalla, navegación por teclado y conformidad con WCAG.
```

### Análisis de Backend

Estos prompts nos ayudan a evaluar la eficiencia, escalabilidad y robustez de nuestros servicios backend. Son cruciales para identificar cuellos de botella y oportunidades de optimización.

#### Endpoints

```
Realiza un análisis detallado de la estructura y eficiencia de nuestros endpoints en Next.js API Routes, incluyendo el manejo de errores, la validación de datos y la seguridad. Considera especialmente los endpoints relacionados con el procesamiento de imágenes y la gestión de metadatos.
```

#### Indexación de Carpetas

```
Examina a fondo la implementación del servicio de indexación de carpetas, analizando cómo se manejan grandes cantidades de archivos, el rendimiento durante la indexación inicial y la actualización incremental. Incluye recomendaciones para mejorar la velocidad y eficiencia.
```

#### Manejo de Metadatos

```
Analiza el sistema actual de manejo de metadatos de imágenes, incluyendo cómo se extraen, almacenan y actualizan los datos EXIF, la eficiencia del almacenamiento y la velocidad de recuperación. Considera la escalabilidad con grandes colecciones.
```

#### Procesamiento de Imágenes

```
Realiza una evaluación completa del flujo de procesamiento de imágenes con Sharp y Bull, incluyendo la gestión de colas, el manejo de errores y la recuperación ante fallos. Analiza el uso de recursos y la escalabilidad.
```

#### Eventos en Tiempo Real

```
Examina en detalle la implementación del sistema de eventos con EventSource, incluyendo la gestión de conexiones, el manejo de reconexiones y la eficiencia en la transmisión de datos en tiempo real.
```

#### Caché

```
Analiza la estructura y eficiencia del sistema de caché, incluyendo estrategias de invalidación, gestión de memoria y optimización de consultas frecuentes.
```

#### Autenticación y Autorización

```
Evalúa la implementación de la autenticación y autorización, considerando la seguridad, escalabilidad y experiencia del usuario.
```

#### Logging y Monitoreo

```
Realiza un análisis profundo del sistema de logging y monitoreo, incluyendo la captura de errores, métricas de rendimiento y diagnóstico de problemas.
```

### Análisis de Servicios

Estos prompts se centran en evaluar la integración y eficiencia de nuestros servicios principales. Son útiles para optimizar el funcionamiento del sistema como un todo.

#### Monitoreo y Procesamiento de Imágenes

```
Realiza un análisis exhaustivo de la integración entre el servicio de monitoreo y el procesamiento de imágenes, incluyendo cómo se detectan y manejan cambios en las carpetas monitoreadas, la eficiencia del procesamiento en segundo plano y la gestión de recursos del sistema.
```

#### Generación de Thumbnails

```
Examina en detalle el rendimiento del servicio de generación de thumbnails, incluyendo la eficiencia del procesamiento por lotes, la gestión de memoria y el almacenamiento en caché. Considera especialmente el manejo de diferentes formatos de imagen y resoluciones.
```

#### Gestión de Colecciones

```
Analiza la implementación completa del servicio de gestión de colecciones, incluyendo la organización de datos, la eficiencia de las consultas y la experiencia del usuario al manipular grandes colecciones.
```

#### Gestión de Etiquetas

```
Realiza una evaluación detallada del flujo de datos entre el servicio de etiquetas y la base de datos, incluyendo la eficiencia de las búsquedas, la actualización de etiquetas y la gestión de relaciones entre entidades.
```

#### Búsqueda de Imágenes

```
Examina la eficiencia del servicio de búsqueda de imágenes, incluyendo el rendimiento de las consultas, la relevancia de los resultados y la experiencia del usuario durante la búsqueda.
```

#### Procesamiento Asíncrono

```
Analiza la implementación del sistema de procesamiento asíncrono, incluyendo la gestión de tareas en segundo plano, priorización y recuperación ante fallos.
```

#### Notificaciones y Eventos

```
Evalúa el sistema de notificaciones y eventos, considerando la escalabilidad, fiabilidad y experiencia del usuario.
```

#### Respaldo y Recuperación

```
Realiza un análisis profundo del sistema de respaldo y recuperación, incluyendo estrategias de backup, integridad de datos y tiempos de recuperación.
```

### Análisis de Estado y Datos

Estos prompts nos ayudan a evaluar cómo manejamos los datos y el estado en toda la aplicación. Son fundamentales para mantener la consistencia y el rendimiento.

#### Estado Global

```
Realiza un análisis detallado de la estructura del estado global y su distribución en la aplicación, incluyendo la organización de los stores de Zustand, la gestión de estados derivados y la optimización de re-renders.
```

#### Tanstack Query

```
Examina en profundidad la implementación de Tanstack Query para el manejo de datos, incluyendo estrategias de caché, invalidación de datos y optimización de consultas. Considera especialmente el manejo de datos en tiempo real.
```

#### Base de Datos

```
Analiza exhaustivamente el esquema de la base de datos SQLite y su integración con Prisma, incluyendo la estructura de tablas, índices y relaciones. Evalúa la eficiencia de las consultas comunes y la escalabilidad.
```

#### Manejo de Caché

```
Realiza una evaluación completa del manejo de caché y optimización de consultas, incluyendo estrategias de precarga, invalidación selectiva y gestión de memoria.
```

#### Manejo de Estados Asíncronos

```
Examina en detalle la gestión de estados asíncronos en la aplicación, incluyendo el manejo de loading states, errores y recuperación ante fallos.
```

#### Persistencia de Datos

```
Analiza la implementación del sistema de persistencia de datos, incluyendo estrategias de sincronización y manejo de conflictos.
```

#### Migración de Datos

```
Evalúa el sistema de migración de datos, considerando la compatibilidad hacia atrás y la integridad de los datos.
```

#### Seguridad

```
Realiza un análisis profundo de la seguridad en el manejo de datos, incluyendo validación, sanitización y protección contra ataques comunes.
```

### Análisis de Rendimiento

Estos prompts se enfocan en identificar y resolver problemas de rendimiento en toda la aplicación. Son esenciales para mantener una experiencia de usuario fluida.

#### Rendimiento en Galería

```
Realiza un análisis exhaustivo de los puntos críticos de rendimiento en la vista de galería, incluyendo la medición de tiempos de carga, uso de memoria y eficiencia del renderizado. Considera especialmente el comportamiento con grandes colecciones de imágenes.
```

#### Optimización de Imágenes

```
Examina en detalle la eficiencia de la carga y procesamiento de imágenes, incluyendo estrategias de optimización, formatos de imagen y técnicas de compresión. Analiza el impacto en el rendimiento y la calidad visual.
```

#### Paginación y Scroll Infinito

```
Analiza la implementación actual de la paginación y scroll infinito, incluyendo la gestión de memoria, la eficiencia del renderizado y la experiencia del usuario. Considera el rendimiento con diferentes tamaños de colección.
```

#### Animaciones

```
Realiza una evaluación completa del impacto de las animaciones en el rendimiento general, incluyendo el uso de CPU/GPU, la fluidez en diferentes dispositivos y optimizaciones posibles.
```

#### Optimización de Recursos

```
Examina en detalle la optimización de recursos y carga inicial de la aplicación, incluyendo el análisis del bundle size, estrategias de code splitting y optimización de assets.
```

#### Rendimiento en Segundo Plano

```
Analiza el rendimiento de las operaciones en segundo plano, incluyendo el impacto en la UI y la experiencia del usuario.
```

#### Eficiencia del Sistema de Caché

```
Evalúa la eficiencia del sistema de caché en diferentes niveles, desde el cliente hasta la base de datos.
```

#### Rendimiento en Dispositivos Móviles

```
Realiza un análisis profundo del rendimiento en diferentes dispositivos y condiciones de red, incluyendo estrategias de optimización específicas.
```
