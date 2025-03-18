## Prompts para Corrección de Componentes

Este conjunto de prompts está diseñado para ayudar en la identificación, diagnóstico y corrección de problemas en componentes React. Son útiles para mejorar la calidad, rendimiento y mantenibilidad de los componentes.

### Problemas de Renderizado

Estos prompts se centran en resolver problemas relacionados con el renderizado de componentes.

#### Re-renders Innecesarios

```
Analiza y corrige los problemas de re-renders innecesarios en el componente [nombre], identificando las causas (props, estado, contexto) y optimizando usando memo, useMemo o useCallback según sea necesario.
```

#### Problemas de Hidratación

```
Diagnostica y resuelve los errores de hidratación en el componente [nombre], asegurando la consistencia entre el renderizado del servidor y el cliente. Verifica el uso correcto de useEffect y componentes client/server.
```

#### Problemas de Layout

```
Identifica y corrige los problemas de layout en el componente [nombre], incluyendo shifts inesperados, overflow y comportamiento responsive. Optimiza los estilos y estructura del DOM.
```

#### Flickering

```
Resuelve los problemas de flickering en el componente [nombre], identificando las causas (estado inicial, transiciones, datos asíncronos) e implementando soluciones apropiadas.
```

#### Renderizado Condicional

```
Corrige los problemas en el renderizado condicional del componente [nombre], asegurando transiciones suaves y manejo correcto de estados intermedios.
```

#### Problemas de Animación

```
Diagnostica y resuelve problemas con las animaciones en el componente [nombre], optimizando el rendimiento y asegurando transiciones fluidas.
```

#### Problemas de Suspense

```
Corrige los problemas relacionados con Suspense y lazy loading en el componente [nombre], mejorando la experiencia de carga y manejo de errores.
```

#### Problemas de Portal

```
Resuelve los problemas con portales en el componente [nombre], asegurando el correcto renderizado y manejo de eventos en diferentes contextos del DOM.
```

### Problemas de Estado

Estos prompts ayudan a resolver problemas relacionados con la gestión del estado.

#### Estado Inconsistente

```
Identifica y corrige problemas de inconsistencia de estado en el componente [nombre], asegurando actualizaciones atómicas y manejo correcto de efectos secundarios.
```

#### Memory Leaks

```
Diagnostica y resuelve memory leaks en el componente [nombre], identificando suscripciones no canceladas, event listeners persistentes y cleanup inadecuado en useEffect.
```

#### Problemas de Contexto

```
Corrige problemas relacionados con el uso de Context en el componente [nombre], optimizando la estructura de providers y consumidores para evitar re-renders innecesarios.
```

#### Estado Global

```
Resuelve problemas en la integración con el estado global (Zustand) en el componente [nombre], asegurando actualizaciones eficientes y manejo correcto de suscripciones.
```

#### Efectos Secundarios

```
Identifica y corrige problemas con efectos secundarios en el componente [nombre], asegurando el orden correcto de ejecución y limpieza apropiada.
```

#### Ciclo de Vida

```
Diagnostica y resuelve problemas relacionados con el ciclo de vida del componente [nombre], asegurando la correcta inicialización y limpieza de recursos.
```

#### Sincronización de Estado

```
Corrige problemas de sincronización de estado entre props y estado local en el componente [nombre], implementando derivación de estado cuando sea apropiado.
```

#### Cache de Estado

```
Resuelve problemas relacionados con el caché de estado en el componente [nombre], optimizando el uso de useMemo y estrategias de memorización.
```

### Problemas de Performance

Estos prompts se centran en resolver problemas de rendimiento.

#### Optimización de Renders

```
Analiza y optimiza el rendimiento de renderizado del componente [nombre], implementando técnicas de memorización y reduciendo la complejidad del árbol de componentes.
```

#### Carga de Datos

```
Mejora el rendimiento en la carga de datos del componente [nombre], optimizando consultas, implementando caché y mejorando estados de carga.
```

#### Manejo de Listas

```
Optimiza el rendimiento de listas en el componente [nombre], implementando virtualización, paginación o infinite scroll según sea necesario.
```

#### Lazy Loading

```
Implementa o corrige el lazy loading en el componente [nombre], optimizando la carga inicial y reduciendo el tamaño del bundle.
```

#### Optimización de Assets

```
Mejora el manejo de assets en el componente [nombre], optimizando la carga de imágenes, fuentes y otros recursos estáticos.
```

#### Event Handlers

```
Optimiza los event handlers en el componente [nombre], implementando debouncing, throttling y cleanup apropiado.
```

#### Computaciones Costosas

```
Identifica y optimiza computaciones costosas en el componente [nombre], implementando memorización y procesamiento diferido cuando sea apropiado.
```

#### Bundle Size

```
Reduce el tamaño del bundle relacionado con el componente [nombre], optimizando importaciones y eliminando código no utilizado.
```

### Problemas de Accesibilidad

Estos prompts ayudan a resolver problemas de accesibilidad.

#### Estructura Semántica

```
Corrige problemas en la estructura semántica del componente [nombre], asegurando el uso apropiado de elementos HTML y roles ARIA.
```

#### Navegación por Teclado

```
Mejora la navegación por teclado en el componente [nombre], implementando manejo de focus y atajos de teclado apropiados.
```

#### Lectores de Pantalla

```
Optimiza el componente [nombre] para lectores de pantalla, asegurando descripciones apropiadas y anuncios de cambios dinámicos.
```

#### Contraste y Color

```
Corrige problemas de contraste y uso de color en el componente [nombre], asegurando conformidad con WCAG.
```

#### Estados Interactivos

```
Mejora la indicación de estados interactivos en el componente [nombre], implementando focus visible y feedback apropiado.
```

#### Mensajes de Error

```
Optimiza la presentación de mensajes de error en el componente [nombre], asegurando que sean claros y accesibles.
```

#### Formularios Accesibles

```
Corrige problemas de accesibilidad en formularios del componente [nombre], implementando labels, validación y feedback apropiados.
```

#### Contenido Dinámico

```
Mejora el manejo de contenido dinámico en el componente [nombre], asegurando actualizaciones accesibles y anuncios apropiados.
```

### Problemas de Mantenibilidad

Estos prompts se centran en mejorar la calidad y mantenibilidad del código.

#### Estructura del Código

```
Mejora la estructura y organización del código en el componente [nombre], aplicando principios SOLID y patrones de diseño apropiados.
```

#### Props y Types

```
Optimiza la definición y validación de props en el componente [nombre], mejorando tipos TypeScript y documentación.
```

#### Separación de Responsabilidades

```
Refactoriza el componente [nombre] para mejorar la separación de responsabilidades, extrayendo lógica compleja y creando subcomponentes cuando sea apropiado.
```

#### Duplicación de Código

```
Identifica y elimina código duplicado en el componente [nombre], creando utilidades y hooks reutilizables.
```

#### Naming y Documentación

```
Mejora el naming y documentación del componente [nombre], incluyendo JSDoc, comentarios y ejemplos de uso.
```

#### Testing

```
Optimiza la testeabilidad del componente [nombre], mejorando la estructura para facilitar pruebas unitarias y de integración.
```

#### Manejo de Errores

```
Mejora el manejo y recuperación de errores en el componente [nombre], implementando boundaries y fallbacks apropiados.
```

#### Configuración y Props

```
Optimiza la configuración y personalización del componente [nombre], mejorando la API pública y opciones de customización.
```
