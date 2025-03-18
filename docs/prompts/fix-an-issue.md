## Prompts para Resolución de Issues

Este conjunto de prompts está diseñado para ayudar en la identificación, diagnóstico y resolución de problemas reportados en el proyecto. Son útiles para abordar diferentes tipos de issues de manera sistemática y efectiva.

### Problemas de UI/UX

Estos prompts se centran en resolver problemas relacionados con la interfaz de usuario y experiencia de usuario.

#### Problemas de Diseño

```
Analiza y resuelve el problema de diseño en [componente/vista], considerando la consistencia visual, usabilidad y accesibilidad. Implementa correcciones que mantengan la coherencia con el sistema de diseño.
```

#### Problemas de Interacción

```
Diagnostica y corrige los problemas de interacción en [característica], mejorando el feedback visual, la respuesta a eventos de usuario y la accesibilidad. Considera diferentes dispositivos y métodos de entrada.
```

#### Problemas de Responsive

```
Resuelve los problemas de diseño responsive en [componente/vista], asegurando una experiencia consistente en diferentes tamaños de pantalla y orientaciones. Implementa breakpoints y layouts apropiados.
```

#### Problemas de Rendimiento UI

```
Identifica y corrige problemas de rendimiento en la UI de [componente/vista], optimizando animaciones, reduciendo re-renders y mejorando la experiencia general del usuario.
```

#### Problemas de Navegación

```
Resuelve los problemas de navegación en [sección], mejorando la estructura de rutas, transiciones entre vistas y manejo del historial. Implementa indicadores claros de ubicación.
```

#### Problemas de Formularios

```
Corrige los problemas en los formularios de [característica], mejorando la validación, feedback de errores y experiencia de usuario durante la entrada de datos.
```

#### Problemas de Accesibilidad

```
Resuelve los problemas de accesibilidad en [componente/vista], implementando ARIA labels, mejorando la navegación por teclado y asegurando compatibilidad con lectores de pantalla.
```

#### Problemas de Consistencia

```
Corrige los problemas de consistencia visual en [sección], alineando estilos, espaciado y comportamientos con el sistema de diseño general.
```

### Problemas Técnicos

Estos prompts ayudan a resolver problemas técnicos y de implementación.

#### Errores de JavaScript

```
Diagnostica y corrige los errores de JavaScript en [archivo/módulo], analizando stacktraces, implementando manejo de errores apropiado y mejorando la robustez del código.
```

#### Problemas de TypeScript

```
Resuelve los problemas de tipado en [archivo/módulo], corrigiendo definiciones de tipos, mejorando type safety y eliminando any types innecesarios.
```

#### Problemas de Build

```
Identifica y corrige problemas en el proceso de build, optimizando configuración de webpack, resolviendo conflictos de dependencias y mejorando tiempos de compilación.
```

#### Problemas de Dependencias

```
Resuelve conflictos y problemas con dependencias del proyecto, actualizando versiones, resolviendo incompatibilidades y optimizando el árbol de dependencias.
```

#### Problemas de Memoria

```
Diagnostica y corrige memory leaks y problemas de uso de memoria en [componente/servicio], implementando cleanup apropiado y optimizando el uso de recursos.
```

#### Problemas de Caché

```
Resuelve problemas relacionados con el caché en [característica], mejorando estrategias de invalidación, manejo de datos obsoletos y sincronización.
```

#### Problemas de Concurrencia

```
Corrige problemas de concurrencia en [servicio/operación], implementando locks apropiados, manejo de race conditions y sincronización de operaciones.
```

#### Problemas de Networking

```
Resuelve problemas de red en [característica], mejorando manejo de timeouts, retry logic y recuperación ante fallos de conexión.
```

### Problemas de Datos

Estos prompts se centran en resolver problemas relacionados con datos y estado.

#### Inconsistencia de Datos

```
Identifica y corrige problemas de inconsistencia de datos en [característica], implementando validaciones, normalizando datos y asegurando integridad referencial.
```

#### Problemas de Sincronización

```
Resuelve problemas de sincronización de datos entre [componentes/servicios], mejorando estrategias de actualización y manejo de conflictos.
```

#### Problemas de Migración

```
Corrige problemas en la migración de datos para [característica], asegurando transformación correcta, manejo de casos edge y verificación de integridad.
```

#### Problemas de Validación

```
Mejora la validación de datos en [formulario/API], implementando reglas de negocio completas, feedback de errores claro y manejo de casos límite.
```

#### Problemas de Formato

```
Resuelve problemas de formato de datos en [característica], normalizando entrada/salida y asegurando consistencia en la presentación.
```

#### Problemas de Persistencia

```
Corrige problemas en la persistencia de datos para [característica], mejorando estrategias de almacenamiento y recuperación de información.
```

#### Problemas de Query

```
Optimiza y corrige problemas en queries de [característica], mejorando rendimiento, reduciendo complejidad y asegurando resultados correctos.
```

#### Problemas de Estado

```
Resuelve problemas de manejo de estado en [componente/vista], mejorando sincronización, actualizaciones y persistencia del estado.
```

### Problemas de Integración

Estos prompts ayudan a resolver problemas de integración entre diferentes partes del sistema.

#### Problemas de API

```
Diagnostica y corrige problemas en la integración con [API/servicio], mejorando manejo de errores, validación de respuestas y recuperación ante fallos.
```

#### Problemas de Autenticación

```
Resuelve problemas de autenticación en [característica], mejorando flujo de login, manejo de tokens y renovación de credenciales.
```

#### Problemas de Websockets

```
Corrige problemas en la comunicación websocket para [característica], mejorando reconexión, manejo de eventos y sincronización de estado.
```

#### Problemas de SSR

```
Resuelve problemas de Server-Side Rendering en [componente/vista], mejorando hidratación, manejo de estado inicial y optimización de carga.
```

#### Problemas de Servicios Externos

```
Corrige problemas en la integración con [servicio externo], implementando mejor manejo de errores, rate limiting y fallbacks.
```

#### Problemas de Eventos

```
Resuelve problemas en el sistema de eventos para [característica], mejorando propagación, manejo de errores y orden de ejecución.
```

#### Problemas de Middleware

```
Corrige problemas en el middleware de [característica], mejorando procesamiento de requests, manejo de errores y logging.
```

#### Problemas de Deployment

```
Resuelve problemas en el proceso de deployment para [componente/servicio], mejorando configuración, scripts y verificaciones post-deploy.
```

### Problemas de Performance

Estos prompts se centran en resolver problemas de rendimiento.

#### Problemas de Carga

```
Identifica y corrige problemas de tiempo de carga en [vista/característica], optimizando recursos, implementando lazy loading y mejorando percepción de velocidad.
```

#### Problemas de Renderizado

```
Resuelve problemas de rendimiento en el renderizado de [componente/vista], reduciendo re-renders, optimizando virtualización y mejorando métricas de performance.
```

#### Problemas de Bundle Size

```
Optimiza el tamaño del bundle para [módulo/característica], implementando code splitting, eliminando código no utilizado y optimizando dependencias.
```

#### Problemas de Recursos

```
Corrige problemas de uso excesivo de recursos en [característica], optimizando uso de memoria, CPU y red.
```

#### Problemas de Base de Datos

```
Resuelve problemas de rendimiento en queries de base de datos para [característica], optimizando índices, reduciendo complejidad y mejorando tiempos de respuesta.
```

#### Problemas de Caché

```
Optimiza estrategias de caché para [característica], mejorando hit rates, implementando precarga y reduciendo tiempo de respuesta.
```

#### Problemas de Assets

```
Mejora el rendimiento en la carga de assets para [característica], optimizando imágenes, implementando lazy loading y mejorando estrategias de caché.
```

#### Problemas de Métricas

```
Implementa o mejora la medición de performance para [característica], estableciendo baselines, monitoreando métricas clave y configurando alertas.
```
