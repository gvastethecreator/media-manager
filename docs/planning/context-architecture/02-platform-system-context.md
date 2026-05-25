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

## Términos canónicos del contexto

### `App Shell`

La composición raíz visible del runtime. Su trabajo es ensamblar:

- router raíz,
- layout base,
- boundaries visibles,
- y capacidades globales de experiencia.

No existe para decidir qué es un `Asset`, qué significa un `Favorite` o cuál es la semántica de `Tag` y `Property`.

### `Global Provider`

Un `Global Provider` es un mecanismo de composición del runtime, no un owner semántico del dominio.

Puede exponer capacidades como:

- theme,
- feedback,
- query/cache,
- transitions,
- settings,
- accesibilidad,
- y otros servicios visibles globalmente.

Pero si un provider empieza a decidir semántica canónica de negocio, el sistema ya perdió la frontera.

### `Operational Profile`

El contexto necesita distinguir el perfil operativo activo de cualquier identidad de negocio o narrativa.

`Operational Profile` nombra la superficie activa que scopa:

- settings,
- preferencias de experiencia,
- defaults operativos,
- y otros comportamientos del runtime ligados al usuario o instalación activa.

No es una `Narrative Entity`, no es un rol del dominio y no forma parte de `Taxonomy`.

### `Platform Process`

`Platform/System` sí puede orquestar workflows transversales que actúan sobre el dominio sin adueñarse de su significado.

Ejemplos canónicos:

- reindexado,
- generación de thumbnails,
- sincronización,
- colas,
- logging/observabilidad,
- monitores de salud,
- y cache operacional.

La regla es simple: un `Platform Process` puede tocar `Assets`, `Organizers` u otros objetos del dominio, pero no redefinir su identidad ni su lifecycle canónico.

## Fronteras semánticas ya acordadas

- `Platform/System` posee shell, runtime y operación transversal; no posee la semántica central de `Media Core`, `Worldbuilding` ni `Taxonomy`.
- Los settings de plataforma ajustan comportamiento del sistema y experiencia del runtime; no reemplazan `Property`, `Tag` ni metadata de negocio.
- Un `Operational Profile` puede scopear defaults, preferencias y marcadores operativos del actor/perfil activo, pero no convierte ese perfil en entidad de worldbuilding ni en taxonomía.
- Un `Platform Process` puede producir progreso, telemetría, errores, caches o artefactos operativos derivados sin transformar esos outputs en la verdad semántica del dominio.
- Cuando reindexado o thumbnails afecten `Assets`, siguen actuando como procesos de soporte; el asset no queda definido por el estado interno del pipeline.

## Qué no pertenece aquí

- semántica canónica de `Asset`.
- ownership de `Folder`, `Album`, `Collection` o `Group`.
- definición de `Prompt`, `Note`, `Wildcard`, `Tag` o `Property`.
- definición de `Character`, `Place`, `Concept` o `World Item`.

Si `Platform/System` empieza a modelar esas cosas, deja de ser soporte y vuelve a devorar el dominio.

## Contradicciones actuales que justifican el batch

Durante la exploración aparecieron señales claras de ownership difuso:

- `App.tsx` y `src/providers/app-provider.tsx` duplican o reparten responsabilidades de shell, providers globales y feedback runtime.
- `router.tsx` concentra la topología principal del runtime, pero convive con un árbol todavía organizado más por vistas/capas técnicas que por contextos.
- settings y perfiles aparecen repartidos entre stores cliente, servicios servidor y tablas de persistencia sin un lenguaje de plataforma suficientemente explícito.
- reindexado, monitoreo, logs, SSE y UI operativa viven repartidos entre `services`, `lib`, `server/routes` y `components/settings`, señal de una capacidad transversal real todavía sin hogar arquitectónico claro.
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
- con un `App Shell` único y nombrado,
- y con `Global Providers` reducidos a composición de capacidades transversales.

## Batch 2: enforcement + scaffolding

Una vez estabilizado el shell, el contexto debe impedir que el repositorio vuelva a mezclarse silenciosamente.

### Esto incluye

- estructura física alineada con contextos.
- reglas de importación o convenciones equivalentes.
- plantillas para que el código nuevo nazca del lado correcto.
- guardrails para que las facades transitorias no se vuelvan permanentes.

### Objetivo real

No se trata de “poner policía” por gusto. Se trata de evitar que el repositorio siga diciendo que migra mientras el código nuevo continúa naciendo en el árbol viejo.

## Cierres internos ya acordados para esta fase

Dentro de `Platform/System Context`, la base semántica que ya no debería reabrirse es esta:

- existe un único `App Shell` canónico, aunque hoy el runtime todavía lo exprese de forma repartida,
- los providers globales son composición de capacidades transversales y no ownership semántico,
- settings/perfiles operativos pertenecen a plataforma y no a `Worldbuilding` ni a `Taxonomy`,
- reindexado, thumbnails, logging, health checks, colas y procesos análogos pertenecen a la familia `Platform Process`,
- y la deuda actual es principalmente de distribución/ownership técnico, no de significado base del contexto.

Lo que queda abierto después de este cierre no es “qué significa `Platform/System`”, sino cómo consolidar físicamente ese ownership sin romper el runtime actual.

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
