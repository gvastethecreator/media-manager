## Prompts para Explicación del Código Base

Este conjunto de prompts está diseñado para obtener explicaciones detalladas sobre diferentes aspectos del código base. Son útiles para entender la arquitectura, flujos de datos y decisiones de implementación.

### Arquitectura General

Estos prompts ayudan a entender la estructura general y organización del proyecto.

#### Estructura del Proyecto

```
Explica la estructura general del proyecto, incluyendo la organización de directorios, separación de responsabilidades y patrones arquitectónicos utilizados. Detalla cómo se relacionan los diferentes módulos.
```

#### Flujo de Datos

```
Describe el flujo de datos principal en la aplicación, desde la interfaz de usuario hasta la persistencia, incluyendo el manejo de estado global, caché y comunicación con el backend.
```

#### Patrones de Diseño

```
Identifica y explica los principales patrones de diseño utilizados en el proyecto, su implementación específica y los problemas que resuelven. Incluye ejemplos concretos del código.
```

#### Gestión de Estado

```
Detalla cómo se maneja el estado global en la aplicación usando Zustand, incluyendo la estructura de los stores, acciones principales y patrones de actualización.
```

#### Sistema de Routing

```
Explica el sistema de routing implementado con Next.js, incluyendo la estructura de rutas, manejo de parámetros y navegación entre páginas.
```

#### Manejo de Dependencias

```
Describe las principales dependencias del proyecto, su propósito, versiones utilizadas y cómo se integran en la arquitectura general.
```

#### Configuración del Proyecto

```
Explica la configuración del proyecto, incluyendo archivos de configuración, variables de entorno y ajustes de desarrollo/producción.
```

#### Integración de Servicios

```
Detalla cómo se integran los diferentes servicios externos y internos, incluyendo APIs, procesamiento de imágenes y almacenamiento.
```

### Componentes y UI

Estos prompts se centran en explicar la capa de presentación de la aplicación.

#### Jerarquía de Componentes

```
Explica la jerarquía y organización de componentes React, incluyendo componentes principales, composición y patrones de reutilización.
```

#### Sistema de Diseño

```
Describe el sistema de diseño implementado, incluyendo componentes de shadcn/ui, estilos con Tailwind y patrones de personalización.
```

#### Manejo de Formularios

```
Explica cómo se implementan y gestionan los formularios en la aplicación, incluyendo validación, manejo de errores y envío de datos.
```

#### Componentes Server/Client

```
Detalla la división entre componentes server y client, explicando las decisiones de implementación y optimizaciones realizadas.
```

#### Sistema de Temas

```
Explica el sistema de temas implementado con next-themes, incluyendo la configuración, personalización y cambios dinámicos.
```

#### Gestión de Assets

```
Describe cómo se manejan los assets en la aplicación, incluyendo imágenes, iconos y otros recursos estáticos.
```

#### Componentes Interactivos

```
Explica la implementación de componentes interactivos complejos, incluyendo drag and drop, modales y menús contextuales.
```

#### Optimización de UI

```
Detalla las estrategias de optimización implementadas en la UI, incluyendo lazy loading, virtualización y manejo de listas largas.
```

### Servicios Backend

Estos prompts ayudan a entender la implementación del backend y servicios.

#### API Routes

```
Explica la implementación de API routes en Next.js, incluyendo estructura, middleware y manejo de peticiones/respuestas.
```

#### Base de Datos

```
Describe la estructura de la base de datos SQLite, incluyendo el esquema Prisma, relaciones y optimizaciones implementadas.
```

#### Procesamiento de Imágenes

```
Explica el pipeline de procesamiento de imágenes, incluyendo Sharp, Bull y la gestión de colas de procesamiento.
```

#### Sistema de Eventos

```
Detalla el sistema de eventos implementado con EventSource, incluyendo emisión, suscripción y manejo de reconexiones.
```

#### Gestión de Archivos

```
Explica cómo se maneja el sistema de archivos, incluyendo monitoreo con Chokidar, indexación y gestión de metadatos.
```

#### Caché y Optimización

```
Describe las estrategias de caché implementadas, incluyendo diferentes niveles, invalidación y optimización de consultas.
```

#### Autenticación y Autorización

```
Explica el sistema de autenticación y autorización, incluyendo roles, permisos y protección de rutas.
```

#### Logging y Monitoreo

```
Detalla el sistema de logging y monitoreo implementado, incluyendo captura de errores y métricas de rendimiento.
```

### Flujos de Trabajo

Estos prompts se centran en explicar flujos de trabajo específicos.

#### Proceso de Indexación

```
Explica el proceso completo de indexación de carpetas, desde la detección de cambios hasta la actualización de la base de datos.
```

#### Gestión de Colecciones

```
Describe cómo funciona el sistema de colecciones, incluyendo creación, organización y sincronización de imágenes.
```

#### Procesamiento por Lotes

```
Explica cómo se implementa el procesamiento por lotes de imágenes, incluyendo cola de trabajos y manejo de errores.
```

#### Sistema de Búsqueda

```
Detalla cómo funciona el sistema de búsqueda, incluyendo indexación, filtros y optimización de resultados.
```

#### Gestión de Metadatos

```
Explica cómo se manejan los metadatos de imágenes, incluyendo extracción, almacenamiento y actualización.
```

#### Sincronización de Datos

```
Describe los mecanismos de sincronización de datos entre frontend y backend, incluyendo estrategias de actualización.
```

#### Flujo de Deployment

```
Explica el proceso de deployment, incluyendo build, optimizaciones y configuración de producción.
```

#### Sistema de Backup

```
Detalla cómo funciona el sistema de backup, incluyendo estrategias de respaldo y recuperación de datos.
```

### Debugging y Desarrollo

Estos prompts ayudan a entender las herramientas y procesos de desarrollo.

#### Herramientas de Desarrollo

```
Explica las herramientas de desarrollo disponibles, incluyendo scripts, utilidades y configuraciones de debug.
```

#### Manejo de Errores

```
Describe el sistema de manejo de errores, incluyendo captura, logging y presentación al usuario.
```

#### Proceso de Testing

```
Explica la infraestructura de testing, incluyendo configuración, herramientas y mejores prácticas.
```

#### Performance Monitoring

```
Detalla las herramientas y técnicas implementadas para monitorear y optimizar el rendimiento.
```

#### Desarrollo Local

```
Explica el entorno de desarrollo local, incluyendo configuración, variables de entorno y herramientas necesarias.
```

#### CI/CD Pipeline

```
Describe el pipeline de CI/CD, incluyendo pruebas automatizadas, linting y proceso de deployment.
```

#### Documentación

```
Explica el sistema de documentación, incluyendo estructura, mantenimiento y generación automática.
```

#### Contribución

```
Detalla el proceso de contribución al proyecto, incluyendo guías, estándares y flujo de trabajo con Git.
```
