## Prompts para Corrección de Servicios

Este conjunto de prompts está diseñado para ayudar en la identificación, diagnóstico y corrección de problemas en servicios del backend. Son útiles para mejorar la eficiencia, confiabilidad y mantenibilidad de los servicios.

### Problemas de Procesamiento

Estos prompts se centran en resolver problemas relacionados con el procesamiento de datos y operaciones.

#### Cuellos de Botella

```
Identifica y resuelve cuellos de botella en el servicio [nombre], analizando tiempos de respuesta, uso de recursos y optimizando operaciones críticas. Implementa mejoras de rendimiento y paralelización cuando sea apropiado.
```

#### Manejo de Memoria

```
Diagnostica y corrige problemas de uso de memoria en el servicio [nombre], optimizando el manejo de grandes conjuntos de datos y implementando limpieza de recursos apropiada.
```

#### Procesamiento por Lotes

```
Mejora el procesamiento por lotes en el servicio [nombre], optimizando el tamaño de los lotes, implementando recuperación ante fallos y mejorando el monitoreo del progreso.
```

#### Operaciones Asíncronas

```
Corrige problemas en operaciones asíncronas del servicio [nombre], mejorando el manejo de promesas, implementando timeouts apropiados y gestionando errores de manera robusta.
```

#### Concurrencia

```
Resuelve problemas de concurrencia en el servicio [nombre], implementando bloqueos apropiados, manejo de condiciones de carrera y estrategias de retry.
```

#### Validación de Datos

```
Mejora la validación de datos en el servicio [nombre], implementando validaciones completas, sanitización de entrada y manejo de casos límite.
```

#### Transformación de Datos

```
Optimiza las operaciones de transformación de datos en el servicio [nombre], mejorando la eficiencia y manteniendo la integridad de los datos.
```

#### Pipeline de Procesamiento

```
Corrige y optimiza el pipeline de procesamiento en el servicio [nombre], mejorando el flujo de datos, manejo de errores y recuperación ante fallos.
```

### Problemas de Base de Datos

Estos prompts ayudan a resolver problemas relacionados con la base de datos.

#### Optimización de Consultas

```
Analiza y optimiza las consultas de base de datos en el servicio [nombre], mejorando índices, reduciendo la complejidad y optimizando el rendimiento.
```

#### Conexiones

```
Resuelve problemas con el manejo de conexiones a la base de datos en el servicio [nombre], implementando pooling eficiente y manejo apropiado de desconexiones.
```

#### Transacciones

```
Corrige problemas en el manejo de transacciones del servicio [nombre], asegurando atomicidad y consistencia en operaciones complejas.
```

#### Migraciones

```
Mejora el sistema de migraciones en el servicio [nombre], asegurando actualizaciones suaves del esquema y manejo de datos históricos.
```

#### Integridad de Datos

```
Resuelve problemas de integridad de datos en el servicio [nombre], implementando validaciones, constraints y manejo de relaciones apropiado.
```

#### Caché de Base de Datos

```
Optimiza el sistema de caché para operaciones de base de datos en el servicio [nombre], mejorando hit rates y estrategias de invalidación.
```

#### Backup y Recuperación

```
Mejora los procesos de backup y recuperación en el servicio [nombre], implementando estrategias robustas y verificación de integridad.
```

#### Escalabilidad

```
Optimiza la escalabilidad de las operaciones de base de datos en el servicio [nombre], implementando sharding o particionamiento según sea necesario.
```

### Problemas de API

Estos prompts se centran en resolver problemas relacionados con la API.

#### Endpoints

```
Corrige problemas en los endpoints del servicio [nombre], mejorando la estructura de rutas, validación de parámetros y respuestas HTTP.
```

#### Rate Limiting

```
Implementa o mejora el rate limiting en el servicio [nombre], protegiendo contra abusos y asegurando fair use de recursos.
```

#### Autenticación

```
Resuelve problemas de autenticación en el servicio [nombre], mejorando la seguridad, manejo de tokens y renovación de credenciales.
```

#### Documentación de API

```
Mejora la documentación de la API del servicio [nombre], incluyendo ejemplos, descripciones claras y casos de uso.
```

#### Versionado

```
Implementa o corrige el versionado de API en el servicio [nombre], asegurando compatibilidad hacia atrás y migración suave.
```

#### Middleware

```
Optimiza el middleware del servicio [nombre], mejorando el manejo de errores, logging y procesamiento de requests.
```

#### Respuestas

```
Mejora la estructura y consistencia de las respuestas API del servicio [nombre], implementando formatos estándar y códigos de error apropiados.
```

#### Seguridad

```
Refuerza la seguridad de la API en el servicio [nombre], implementando validaciones, sanitización y protección contra ataques comunes.
```

### Problemas de Integración

Estos prompts ayudan a resolver problemas de integración con otros servicios.

#### Comunicación entre Servicios

```
Optimiza la comunicación entre el servicio [nombre] y otros servicios, mejorando protocolos, manejo de timeouts y recuperación ante fallos.
```

#### Eventos

```
Corrige problemas en el sistema de eventos del servicio [nombre], mejorando la emisión, suscripción y procesamiento de eventos.
```

#### Sincronización

```
Resuelve problemas de sincronización entre el servicio [nombre] y otros sistemas, implementando estrategias robustas de consistencia.
```

#### Dependencias Externas

```
Mejora el manejo de dependencias externas en el servicio [nombre], implementando circuit breakers y fallbacks apropiados.
```

#### Formatos de Datos

```
Optimiza la conversión y validación de formatos de datos en el servicio [nombre], asegurando compatibilidad entre sistemas.
```

#### Logging

```
Mejora el sistema de logging en el servicio [nombre], implementando niveles apropiados, formato consistente y agregación efectiva.
```

#### Monitoreo

```
Optimiza el monitoreo del servicio [nombre], implementando métricas relevantes, alertas y dashboards informativos.
```

#### Testing de Integración

```
Mejora los tests de integración del servicio [nombre], cubriendo diferentes escenarios y casos límite en la interacción con otros servicios.
```

### Problemas de Mantenibilidad

Estos prompts se centran en mejorar la calidad y mantenibilidad del código.

#### Estructura del Código

```
Mejora la estructura y organización del código en el servicio [nombre], aplicando principios SOLID y patrones de diseño apropiados.
```

#### Dependencias

```
Optimiza las dependencias del servicio [nombre], actualizando versiones, eliminando dependencias innecesarias y mejorando la gestión de paquetes.
```

#### Testing

```
Mejora la cobertura y calidad de tests en el servicio [nombre], implementando tests unitarios, de integración y e2e según sea necesario.
```

#### Documentación

```
Actualiza y mejora la documentación del servicio [nombre], incluyendo setup, configuración, API y ejemplos de uso.
```

#### Error Handling

```
Optimiza el manejo de errores en el servicio [nombre], implementando logging apropiado, recuperación y notificaciones.
```

#### Configuración

```
Mejora el sistema de configuración del servicio [nombre], implementando validación, documentación y manejo de diferentes entornos.
```

#### Deployment

```
Optimiza el proceso de deployment del servicio [nombre], mejorando scripts, configuración y verificaciones post-deploy.
```

#### Monitoreo y Debugging

```
Mejora las capacidades de monitoreo y debugging del servicio [nombre], implementando logging detallado y herramientas de diagnóstico.
```
