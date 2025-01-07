## Prompts para Creación y Actualización de Tests

Este conjunto de prompts está diseñado para guiar el proceso de creación, mantenimiento y mejora de tests en la aplicación. Son útiles para asegurar la calidad del código, prevenir regresiones y mantener una cobertura adecuada de pruebas.

### Tests Unitarios

Estos prompts se centran en la creación y mantenimiento de tests unitarios para componentes y funciones individuales.

#### Tests de Componentes React

```
Crea o actualiza los tests unitarios para el componente [nombre], incluyendo pruebas de renderizado, interacciones de usuario y estados. Asegura la cobertura de todos los props y callbacks. Implementa mocks para servicios y contextos externos.
```

#### Tests de Servicios

```
Desarrolla tests unitarios completos para el servicio [nombre], cubriendo todos los métodos públicos, manejo de errores y casos límite. Implementa mocks para dependencias externas y asegura el aislamiento de las pruebas.
```

#### Tests de Hooks

```
Crea tests exhaustivos para el hook [nombre], verificando su comportamiento en diferentes escenarios de uso, manejo de efectos secundarios y limpieza de recursos. Utiliza act() para cambios de estado asíncronos.
```

#### Tests de Utilidades

```
Implementa tests unitarios para las funciones de utilidad en [archivo], cubriendo todos los casos de uso, validaciones y manejo de errores. Incluye casos límite y valores inesperados.
```

#### Tests de Estado

```
Desarrolla tests para el store de Zustand [nombre], verificando las actualizaciones de estado, selectores y efectos secundarios. Asegura la consistencia del estado en diferentes escenarios.
```

#### Tests de API

```
Crea tests unitarios para los endpoints de la API en [archivo], cubriendo diferentes métodos HTTP, validación de datos y manejo de errores. Implementa mocks para la base de datos y servicios externos.
```

#### Tests de Transformación de Datos

```
Implementa tests para las funciones de transformación de datos en [archivo], verificando el formateo, validación y manipulación de diferentes estructuras de datos.
```

#### Tests de Validación

```
Desarrolla tests unitarios para las funciones de validación en [archivo], cubriendo diferentes escenarios de entrada, reglas de negocio y mensajes de error.
```

### Tests de Integración

Estos prompts se enfocan en probar la interacción entre diferentes partes del sistema.

#### Tests de Flujos de Usuario

```
Crea tests de integración para el flujo de [nombre], verificando la interacción entre componentes, servicios y estado global. Simula acciones de usuario completas y verifica los resultados esperados.
```

#### Tests de Servicios Compuestos

```
Desarrolla tests de integración para la interacción entre los servicios [nombres], verificando el flujo de datos, manejo de errores y estados intermedios. Implementa mocks selectivos para aislar el alcance de las pruebas.
```

#### Tests de API End-to-End

```
Implementa tests de integración para las rutas de API relacionadas con [característica], verificando la interacción con la base de datos, servicios externos y middleware. Incluye casos de éxito y error.
```

#### Tests de Estado Global

```
Crea tests de integración para verificar la interacción entre diferentes stores de Zustand, asegurando la consistencia del estado global y la correcta propagación de cambios.
```

#### Tests de Eventos

```
Desarrolla tests para el sistema de eventos, verificando la correcta emisión, recepción y manejo de eventos entre diferentes partes del sistema. Incluye escenarios de concurrencia.
```

#### Tests de Caché

```
Implementa tests de integración para el sistema de caché, verificando la interacción entre diferentes niveles de caché, invalidación y actualización de datos.
```

#### Tests de Autenticación

```
Crea tests de integración para el flujo de autenticación, verificando la interacción entre frontend, API y servicios de autenticación. Incluye diferentes escenarios de autorización.
```

#### Tests de Procesamiento de Imágenes

```
Desarrolla tests de integración para el pipeline de procesamiento de imágenes, verificando la interacción entre servicios de procesamiento, almacenamiento y metadatos.
```

### Tests E2E

Estos prompts se centran en pruebas de extremo a extremo utilizando Cypress.

#### Tests de Navegación

```
Crea tests E2E para los flujos de navegación principales, verificando rutas, transiciones y estado de la aplicación. Incluye diferentes dispositivos y condiciones de red.
```

#### Tests de Funcionalidad Core

```
Desarrolla tests E2E para las funcionalidades core de [característica], simulando interacciones reales de usuario y verificando el comportamiento completo del sistema.
```

#### Tests de Formularios

```
Implementa tests E2E para los formularios de [característica], verificando validación, envío de datos y feedback al usuario. Incluye casos de error y recuperación.
```

#### Tests de Carga de Datos

```
Crea tests E2E para escenarios de carga de datos, verificando estados de carga, manejo de errores y actualización de la UI. Simula diferentes condiciones de red.
```

#### Tests de Responsive

```
Desarrolla tests E2E para verificar el comportamiento responsive de la aplicación, probando diferentes tamaños de pantalla y orientaciones.
```

#### Tests de Performance

```
Implementa tests E2E para medir y verificar el rendimiento de la aplicación, incluyendo tiempos de carga, interactividad y consumo de recursos.
```

#### Tests de Accesibilidad

```
Crea tests E2E para verificar la accesibilidad de la aplicación, incluyendo navegación por teclado, lectores de pantalla y contraste de colores.
```

#### Tests de Integración Visual

```
Desarrolla tests E2E para verificar la consistencia visual de la aplicación, incluyendo comparación de snapshots y validación de estilos.
```

### Mantenimiento de Tests

Estos prompts se centran en mantener y mejorar la suite de tests existente.

#### Refactorización de Tests

```
Analiza y refactoriza los tests en [archivo] para mejorar mantenibilidad, reducir duplicación y aumentar claridad. Implementa mejores prácticas y patrones de testing.
```

#### Optimización de Performance

```
Mejora el rendimiento de la suite de tests en [directorio], optimizando setup/teardown, reduciendo duplicación de código y mejorando el uso de mocks.
```

#### Actualización de Mocks

```
Actualiza los mocks y fixtures utilizados en los tests de [característica] para reflejar cambios en la API o estructura de datos. Mantén la consistencia con la implementación actual.
```

#### Cobertura de Tests

```
Analiza y mejora la cobertura de tests en [módulo], identificando áreas sin cobertura y agregando tests para casos límite y escenarios de error.
```

#### Documentación de Tests

```
Mejora la documentación de los tests en [archivo], incluyendo descripciones claras, casos de uso y requisitos. Actualiza comentarios y nombres de tests para mayor claridad.
```

#### Mantenimiento de Fixtures

```
Actualiza y organiza los fixtures utilizados en los tests, asegurando que los datos de prueba sean representativos y mantenibles.
```

#### Limpieza de Tests

```
Identifica y elimina tests obsoletos o redundantes en [módulo], manteniendo la suite de tests eficiente y relevante.
```

#### Integración de CI/CD

```
Mejora la integración de tests en el pipeline de CI/CD, optimizando la ejecución, reportes y notificaciones de fallos.
```
