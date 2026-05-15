# Platform/System Context

`Platform/System Context` no existe para redefinir el producto. Existe para soportarlo. Es la capa que sostiene el runtime, el shell de la aplicación y las capacidades operativas transversales sin adueñarse del significado de `Asset`, `Organizer`, `Narrative Entity` o `Taxonomy`.

## Propósito

Este contexto concentra las responsabilidades de plataforma que hoy aparecen repartidas entre providers, shell de UI, rutas operativas, utilidades del servidor y servicios transversales.

Debe responder a preguntas como:

- ¿quién compone el shell principal de la app?
- ¿quién define providers globales y boundaries visibles?
- ¿dónde viven settings, observabilidad, colas, feedback, cache y runtime concerns?
- ¿cómo se evita que un contexto de negocio termine manejando infraestructura por accidente?

## Qué sí pertenece aquí

### Shell y composición global

- `App.tsx` como composición de alto nivel.
- ownership del router raíz.
- provider composition global.
- boundaries visibles del runtime.

### Capacidades operativas transversales

- settings y perfiles operativos.
- eventing/queue/activity.
- observabilidad y logging transversal.
- cache/query/feedback de alcance global.
- thumbnails, reindexado y procesos operativos cuando su semántica es de plataforma y no de media pura.

### Enforcement

- reglas de importación entre contextos.
- scaffolding de módulos por contexto.
- plantillas y convenciones para no recaer en mezcla por capas técnicas.

## Qué no pertenece aquí

- semántica canónica de `Asset`.
- ownership de `Folder`, `Album`, `Collection` o `Group`.
- definición de `Prompt`, `Note`, `Wildcard`, `Tag` o `Property`.
- definición de `Character`, `Place`, `Concept` o `World Item`.

Si `Platform/System` empieza a modelar esas cosas, deja de ser soporte y vuelve a devorar el dominio.

## Contradicciones actuales que justifican el batch

Durante la exploración aparecieron señales claras de ownership difuso:

- `App.tsx` y `src/providers/app-provider.tsx` duplican o reparten responsabilidades de shell.
- varios concerns globales viven mezclados con decisiones de producto.
- el repo todavía refleja más una organización por capas técnicas que por contexto.

Mientras eso siga así, cualquier migración posterior corre el riesgo de nacer sobre un shell ambiguo.

## Batch 1: app shell + provider ownership + router raíz

Este batch debe fijar una sola respuesta para:

- quién compone el shell,
- dónde se registran providers globales,
- dónde terminan las preocupaciones de layout/runtime,
- y cómo se expresa el root navigation model.

### Resultado esperado

- una composición principal reconocible,
- sin duplicación conceptual entre shell y provider bundle,
- con ownership explícito del runtime visible.

## Batch 2: enforcement + scaffolding

Una vez estabilizado el shell, el contexto debe impedir que el repositorio vuelva a mezclarse silenciosamente.

### Esto incluye

- estructura física alineada con contextos.
- reglas de importación o convenciones equivalentes.
- plantillas para que el código nuevo nazca del lado correcto.
- guardrails para que las facades transitorias no se vuelvan permanentes.

### Objetivo real

No se trata de “poner policía” por gusto. Se trata de evitar que el repositorio siga diciendo que migra mientras el código nuevo continúa naciendo en el árbol viejo.

## Señales de mala salud

`Platform/System Context` está creciendo mal si empiezan a aparecer patrones como estos:

- rutas operativas definiendo semántica del dominio.
- providers globales que ya toman decisiones sobre qué es un `Asset` o qué significa `Favorite`.
- servicios transversales con conocimiento específico de `Worldbuilding` o `Taxonomy`.
- features enteras de producto escondidas bajo el paraguas de “system” porque nadie quiso nombrarlas mejor.

## Relación con los demás contextos

- Sirve a `Media Core`, pero no lo redefine.
- Sirve a `Worldbuilding`, pero no lo absorbe.
- Sirve a `Taxonomy`, pero no la convierte en concern de infraestructura.

Es el contexto que debe permitir que los demás existan con menos fricción, no el contexto que gana todas las discusiones por estar en el root del árbol.

## Criterio de salida del slice

El slice `Platform/System` se considera bien resuelto cuando:

- el shell tiene dueño claro,
- los providers globales ya no están conceptualmente duplicados,
- el runtime raíz dejó de mezclar semántica de negocio,
- y el repositorio ya tiene mecanismo real para proteger fronteras futuras.
