## Prompts para Creación de Características

Este conjunto de prompts está diseñado para guiar el proceso de creación e implementación de nuevas características en la aplicación. Son útiles cuando necesitamos desarrollar nuevas funcionalidades, desde componentes simples hasta características complejas que involucran múltiples capas de la aplicación.

### Componentes UI

Estos prompts se centran en la creación de componentes de interfaz de usuario. Son útiles para mantener la consistencia del diseño y asegurar una experiencia de usuario óptima.

#### Vista Previa de Imagen

```
Crea un componente de vista previa rápida de imagen con zoom, que incluya controles de navegación, zoom suave con gestos, soporte para diferentes formatos de imagen y optimización de rendimiento. Considera la accesibilidad y la experiencia móvil.
```

#### Selector de Etiquetas

```
Desarrolla un selector de etiquetas con autocompletado y creación al vuelo, que incluya validación, límites de caracteres, prevención de duplicados y sincronización con el backend. Implementa animaciones suaves para la entrada y salida de etiquetas.
```

#### Panel de Filtros

```
Implementa un panel de filtros avanzados para la galería que permita filtrar por múltiples criterios como fecha, tamaño, formato, metadatos EXIF y etiquetas personalizadas. Incluye la capacidad de guardar filtros predefinidos.
```

#### Comparador de Imágenes

```
Crea un componente de comparación de imágenes lado a lado con controles sincronizados de zoom y desplazamiento, marcadores de diferencias y capacidad de exportar la comparación. Optimiza el rendimiento para imágenes de alta resolución.
```

#### Línea de Tiempo

```
Desarrolla un componente de línea de tiempo para visualizar el historial de imágenes con agrupación por fecha, vista previa en miniatura, filtros rápidos y navegación eficiente. Implementa lazy loading para mejorar el rendimiento.
```

#### Panel de Metadatos

```
Crea un panel interactivo para visualizar y editar metadatos EXIF, incluyendo validación de campos, formateo automático y sincronización en tiempo real con el backend. Considera la organización jerárquica de los datos.
```

#### Visor de Colecciones

```
Implementa un visor de colecciones con vista en cuadrícula y lista, ordenamiento personalizable, arrastrar y soltar para organización, y acciones por lotes. Optimiza para grandes cantidades de imágenes.
```

#### Barra de Herramientas Contextual

```
Desarrolla una barra de herramientas contextual que se adapte al contenido seleccionado, con acciones relevantes, atajos de teclado y feedback visual. Asegura la accesibilidad y usabilidad en diferentes dispositivos.
```

### Servicios Backend

Estos prompts se enfocan en la creación de servicios del lado del servidor. Son fundamentales para manejar la lógica de negocio y el procesamiento de datos.

#### Búsqueda Avanzada

```
Implementa un servicio de búsqueda avanzada con filtros múltiples, incluyendo búsqueda por contenido de imagen, metadatos EXIF, texto en imágenes y similitud visual. Optimiza el rendimiento con índices y caché.
```

#### Exportación de Metadatos

```
Crea un servicio de exportación de metadatos que soporte múltiples formatos (JSON, CSV, XML), con opciones de filtrado, agrupación y personalización de campos. Implementa manejo de errores y progreso en tiempo real.
```

#### Respaldo Automático

```
Desarrolla un sistema de respaldo automático de la base de datos con programación personalizable, compresión, verificación de integridad y rotación de backups. Incluye notificaciones de estado y logs detallados.
```

#### Procesamiento por Lotes

```
Implementa un servicio de procesamiento por lotes de imágenes con cola de prioridad, límites de recursos, recuperación ante fallos y notificaciones de progreso. Optimiza para grandes volúmenes de archivos.
```

#### Sistema de Notificaciones

```
Crea un sistema de notificaciones para eventos de procesamiento con diferentes niveles de prioridad, persistencia opcional, agrupación inteligente y entrega en tiempo real. Implementa estrategias de retry para mensajes importantes.
```

#### Sincronización de Directorios

```
Desarrolla un servicio de sincronización bidireccional entre directorios locales y la base de datos, con detección de cambios en tiempo real, resolución de conflictos y manejo de errores robusto.
```

#### API de Metadatos

```
Implementa una API RESTful para la gestión de metadatos con validación, versionado, rate limiting y documentación automática. Considera la compatibilidad con diferentes estándares de metadatos.
```

#### Servicio de Estadísticas

```
Crea un servicio para recopilar y analizar estadísticas de uso, rendimiento y almacenamiento, con agregación temporal, exportación de reportes y alertas configurables.
```

### Integración y Flujos

Estos prompts se centran en la creación de flujos de trabajo completos que integran múltiples componentes y servicios.

#### Organización por Arrastrar y Soltar

```
Implementa un sistema completo de arrastrar y soltar para organizar colecciones, incluyendo previsualización, animaciones suaves, actualización en tiempo real y sincronización con el backend. Optimiza para dispositivos táctiles.
```

#### Importación Masiva

```
Desarrolla un flujo de importación masiva con validación previa, detección de duplicados, preservación de metadatos, procesamiento en segundo plano y reportes detallados. Implementa recuperación ante fallos.
```

#### Sincronización Multi-Carpeta

```
Crea un sistema de sincronización entre múltiples carpetas con resolución de conflictos, merge inteligente de metadatos y opciones de sincronización selectiva. Incluye monitoreo de estado y logs.
```

#### Editor de Imágenes

```
Implementa un flujo de edición básica de imágenes integrado con operaciones no destructivas, historial de cambios, previsualización en tiempo real y exportación en diferentes formatos. Optimiza el rendimiento.
```

#### Etiquetado Automático

```
Desarrolla un sistema de etiquetado automático basado en contenido utilizando ML, con validación manual, aprendizaje continuo y categorización jerárquica. Implementa procesamiento en segundo plano.
```

#### Flujo de Publicación

```
Crea un flujo de trabajo para publicación de imágenes con estados de revisión, aprobación por roles, versiones y programación de publicación. Incluye notificaciones y tracking de cambios.
```

#### Gestión de Versiones

```
Implementa un sistema de control de versiones para imágenes y metadatos con diferencias visuales, restauración puntual y gestión de espacio. Optimiza el almacenamiento de versiones.
```

#### Workflow de Procesamiento

```
Desarrolla un sistema de workflows personalizables para procesamiento de imágenes con pasos configurables, condiciones, paralelización y monitoreo detallado.
```

### Optimización y Rendimiento

Estos prompts se enfocan en la implementación de características relacionadas con la optimización y el rendimiento.

#### Caché Inteligente

```
Implementa un sistema de caché inteligente para thumbnails con predicción de uso, limpieza automática, priorización de recursos y métricas de efectividad. Optimiza el uso de memoria y almacenamiento.
```

#### Carga Progresiva

```
Desarrolla un mecanismo de carga progresiva de imágenes con placeholders optimizados, priorización basada en viewport, cancelación inteligente y feedback visual. Implementa estrategias de retry.
```

#### Compresión Adaptativa

```
Crea un sistema de compresión adaptativa de imágenes que ajuste la calidad según el dispositivo, conexión y preferencias del usuario. Implementa diferentes estrategias de compresión.
```

#### Precarga Inteligente

```
Implementa un mecanismo de precarga inteligente basado en patrones de uso, con límites de recursos, cancelación dinámica y métricas de efectividad. Optimiza para diferentes condiciones de red.
```

#### Limpieza Automática

```
Desarrolla un sistema de limpieza automática de recursos con políticas configurables, análisis de uso, recuperación de espacio y logs detallados. Implementa mecanismos de seguridad.
```

#### Optimización de Assets

```
Crea un pipeline de optimización de assets con procesamiento automático, versionado de caché, compresión selectiva y delivery optimizado. Implementa diferentes estrategias según el tipo de asset.
```

#### Balanceo de Recursos

```
Implementa un sistema de balanceo de recursos para procesamiento de imágenes con priorización dinámica, límites adaptativos y recuperación ante sobrecarga. Monitorea el uso de recursos.
```

#### Optimización de Búsqueda

```
Desarrolla estrategias de optimización para búsquedas frecuentes con índices especializados, caché de resultados y sugerencias predictivas. Implementa análisis de patrones de búsqueda.
```

### Características Avanzadas

Estos prompts se centran en la implementación de características más complejas que requieren integración de tecnologías avanzadas.

#### Reconocimiento Facial

```
Implementa un sistema básico de reconocimiento facial con detección, agrupación automática, entrenamiento incremental y privacidad configurable. Optimiza el rendimiento y uso de recursos.
```

#### Modo Presentación

```
Desarrolla un modo de presentación con transiciones personalizables, controles remotos, adaptación automática de contenido y soporte para múltiples pantallas. Implementa diferentes layouts.
```

#### Organización por Similitud

```
Crea un sistema de organización automática por similitud visual utilizando ML, con clustering dinámico, retroalimentación del usuario y visualización interactiva. Optimiza el procesamiento.
```

#### Editor de Metadatos

```
Implementa un editor de metadatos avanzado con validación en tiempo real, templates personalizables, historial de cambios y sincronización bidireccional. Soporta diferentes estándares.
```

#### Búsqueda por Similitud

```
Desarrolla un sistema de búsqueda por imagen similar utilizando técnicas de ML, con índices eficientes, ranking configurable y retroalimentación de relevancia. Optimiza la precisión y velocidad.
```

#### Análisis de Contenido

```
Implementa análisis automático de contenido de imágenes para detectar objetos, texto, colores dominantes y composición. Utiliza ML para mejorar la precisión con el tiempo.
```

#### Restauración Automática

```
Crea un sistema de restauración automática de imágenes con detección de problemas comunes, corrección inteligente y preservación de detalles. Implementa preview en tiempo real.
```

#### Generación de Colecciones

```
Desarrolla un sistema inteligente para generar colecciones automáticas basadas en diferentes criterios como eventos, ubicación, personas o temas. Implementa actualización incremental.
```
