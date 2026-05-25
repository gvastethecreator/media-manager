# Media Core Context

`Media Core` es el corazón del producto. Todo el resto puede enriquecerlo, clasificarlo, adornarlo o explotarlo narrativamente, pero el producto deja de ser reconocible si este contexto no tiene un lenguaje estable.

## Propósito

Este contexto define el objeto principal que el producto administra (`Asset`) y las estructuras principales con las que se lo organiza, encuentra, recupera y presenta.

Sus preguntas fundacionales son:

- ¿qué es un `Asset`?
- ¿qué parte de ese objeto es identidad, qué parte es origen físico y qué parte es equivalencia material?
- ¿qué organizadores pertenecen realmente al núcleo?
- ¿qué relaciones son estructurales y cuáles son sólo semánticas alrededor del núcleo?

## Núcleo conceptual acordado

### `Asset` es el objeto canónico del producto

No es sólo una abstracción simpática para unificar nombres. En la arquitectura objetivo debe tener una **raíz persistente común, delgada pero real**.

### `Source File` no es lo mismo que `Asset`

`Source File` expresa el origen físico o durable del contenido. `Asset` expresa el objeto que el producto conoce, organiza y relaciona.

Esa misma frontera aplica a la ubicación física: la pertenencia a `Folder` debe vivir en `Source File` / `Primary Placement`, no en la raíz identitaria del `Asset`.

Y la decisión recién cerrada para el modelo base es no separar todavía ambas capas: `Source File` y `Primary Placement` se tratan como la misma pieza conceptual y estructural mientras no aparezca una necesidad real de placements adicionales explícitos.

### Un `Primary Placement` canónico por `Asset`

La decisión base recién cerrada es simple:

- cada `Asset` tiene un placement/source principal canónico,
- ese placement principal ancla la operación,
- y cualquier copia, mirror o placement adicional sólo existe si se modela explícitamente después.

Esto evita que el corazón del modelo nazca preguntándose en cada operación “cuál de los varios archivos físicos equivalentes manda realmente”.

Si más adelante el producto necesita mirrors, copias o materializaciones adicionales bajo la misma identidad, la dirección acordada es modelarlas como placements secundarios explícitos dentro de la misma capa física. El asset sigue teniendo exactamente un `Primary Placement` y cero o más placements secundarios subordinados; la coexistencia de varias materializaciones no reabre la discusión sobre identidad.

Esos placements secundarios no nacen por coincidencia de fingerprint, path u otros heurísticos débiles. Requieren decisión o modelado explícito para evitar que el modelo trate como “misma cosa” dos materializaciones que el producto todavía no decidió unificar bajo una sola identidad.

### `Asset Identity` no es `path`

Mover un asset no debería matar su identidad.

Del mismo modo, renombrar su título visible, ajustar su copy o cambiar el filename físico no crea otro `Asset` por sí mismo. La identidad contractual del asset vive en su raíz estable; la presentación y el soporte físico pueden cambiar sin colapsar esa identidad.

### `Content Fingerprint` no es identidad

La huella de contenido sirve para equivalencia material, duplicados y detección de cambios; no para decidir si dos registros son el mismo asset en todos los sentidos.

Además, la decisión acordada es que su verdad canónica viva en `Source File` / `Primary Placement`, no en la raíz identitaria del `Asset`, aunque el asset pueda exponer o cachear el fingerprint vigente con fines operativos.

### `Duplicate Candidate` no implica fusión automática

Dos assets pueden compartir fingerprint y seguir siendo distintos.

La decisión adicional acordada es que, si aparece otro archivo físico con el mismo contenido, el comportamiento por defecto es crear otro `Asset` y tratarlo como `Duplicate Candidate`.

Modelarlo como placement secundario del mismo asset requiere una decisión explícita posterior; no debe ocurrir por magia sólo porque coincida la huella.

En otras palabras: un placement secundario del mismo asset sólo es válido cuando el sistema o el usuario modelan explícitamente que ambas materializaciones pertenecen a la misma identidad de producto.

## Forma objetivo del modelo

### Raíz persistente común de `Asset`

La raíz común debe ser delgada. Idealmente concentra sólo lo realmente transversal:

- identidad estable,
- nombre o título visible canónico,
- `assetType` explícito y specialization principal consistente,
- referencia directa al `primaryPlacementId` u origen físico principal,
- timestamps y lifecycle,
- estado operativo mínimo.

El fingerprint material puede proyectarse o cachearse hacia la raíz cuando convenga, pero no debería volver a convertirse ahí en la fuente semántica de verdad.

La decisión acordada es mantener esos campos de lifecycle y estado operativo sólo en la medida en que sean verdaderamente transversales; el resto del ruido operativo debe quedarse fuera de la raíz común.

Para esta fase, el shape mínimo acordado del root queda acotado a:

- `assetId`,
- `assetType`,
- `title` o nombre visible canónico opcional,
- `primaryPlacementId`,
- `status`,
- `createdAt`,
- `updatedAt`,
- `archivedAt` opcional,
- `deletedAt` opcional.

Por defecto, quedan fuera de esa raíz el `path` físico, la pertenencia a `Folder`, el fingerprint como fuente canónica y cualquier estado o telemetría de colas, thumbnails, reindexado, extracción, transcodificación o sincronización.

También quedó decidido que el `Asset` root puede nacer temprano durante la ingesta, anclando identidad, tipo, placement principal y estado transversal aunque la metadata especializada todavía no esté completa.

En esa misma línea, el nombre o título visible canónico del asset puede ser opcional al inicio. Mientras no exista, la operación puede caer temporalmente al nombre físico sin colapsar ambos conceptos.

Ese fallback operativo no convierte al filename en identidad ni en nombre canónico permanente del asset; sólo evita dejar al objeto sin representación visible mientras la capa editorial todavía no fue completada.

También quedó acordado que el root puede llevar un set pequeño de estados de lifecycle visibles para usuario cuando expresen semántica real del producto (por ejemplo activos o archivados), sin degradarse a un panel de flags técnicos.

El set inicial acordado para ese lifecycle visible es:

- `active`
- `archived`
- `deleted`

Y ese lifecycle se modela como un único `status` canónico, no como varias flags combinables.

Y quedó explícito que flags como `hidden` o `public` no pertenecen a ese lifecycle canónico, porque describen visibilidad o publicación, no el estado de vida del asset como objeto de producto.

También quedó decidido que estados de pipeline como `pending`, `processing`, `completed` o `failed` no pertenecen a ese lifecycle visible. Si existen, deben vivir como processing status separado.

Y cuando ocurran transiciones semánticas reales de lifecycle, la raíz del asset puede guardar timestamps explícitos como `archivedAt` o `deletedAt` para no perder trazabilidad mínima.

La frontera de estado transversal queda así: `Asset` conserva sólo lifecycle visible y estado operativo realmente transversal al objeto de producto. En cambio, jobs, retries, progreso, errores de pipeline y demás concerns de infraestructura pertenecen a servicios o capas operativas adyacentes, no al corazón identitario del asset.

En ese mismo marco, `deleted` quedó definido como borrado lógico o tombstone dentro del lifecycle visible del asset. La eliminación física definitiva del registro o del soporte material pertenece a otra operación, no al significado del estado.

Como consecuencia directa, ese estado `deleted` debe ser restaurable mientras no exista purge físico definitivo.

Y la restauración debe intentar recuperar el último estado no borrado del asset (por ejemplo `archived` si venía de ahí). Si esa información no existe, el fallback es `active`.

### Especializaciones por tipo de medio

Encima o al costado de esa raíz viven las especializaciones:

- `Image`
- `Video`
- `Audio`
- `Document`
- `JsonFile`
- `File3D`
- otras que el producto necesite más adelante

Las especializaciones no deben reabrir la discusión sobre identidad. Sólo agregan metadata, preview y tooling específico.

La regla acordada es que cada `Asset` tenga exactamente una especialización principal a la vez.

## Qué contradice hoy este target

El esquema actual modela la persistencia principalmente por tablas separadas por tipo de medio, con muchos campos transversales repetidos:

- `id`
- `path`
- `hash`
- `folderId`
- timestamps
- flags operativos repetidos

Eso explica por qué el lenguaje del producto empuja hacia `Asset`, pero la estructura real todavía arrastra más bien una familia de tipos vecinos con semántica parcialmente duplicada.

## Organizer model

El segundo gran batch de `Media Core` limpia la capa de organización. Los organizadores no son sinónimos; cada uno tiene un rol canónico distinto.

### `Folder`

- estrictamente físico,
- filesystem-backed,
- no debe mutar en organizer virtual.

Lo virtual ya tiene otros nombres en el modelo.

### `Album`

- organizador editorial/visual,
- pensado para curaduría o galería,
- con membresía directa restringida a `Assets`.

No debe crecer hasta volverse contenedor universal del dominio.

### `Collection`

- organizador temático o funcional,
- centrado principalmente en `Assets`,
- no equivalente a `Album` ni a `Group`.

### `Group`

- organizador heterogéneo y transversal,
- puede reunir `Assets`, `Organizers` y `Narrative Entities`,
- no debe convertirse en bucket universal para artefactos de `Taxonomy`.

## Relaciones dentro del núcleo

`Media Core` necesita distinguir con cuidado entre dos tipos de vínculo:

### Relaciones estructurales fuertes

- `Folder` contiene assets.
- `Asset` se expresa mediante especializaciones.
- el origen físico de un asset pertenece a la capa de `Source File` / placement, con un placement principal canónico en el modelo base.

En la práctica, eso significa también que la ubicación física en `Folder` pertenece a esa misma capa de placement, no al `Asset` como objeto de producto.

Estas relaciones no deberían diluirse en un modelo genérico.

### Relaciones semánticas alrededor del núcleo

- assets vinculados a prompts,
- assets vinculados a narrative entities,
- assets agrupados transversalmente por constructs externos.

Estas sí pueden convivir mejor con un modelo genérico de relaciones, siempre que el ownership siga claro.

En ese mismo marco, que otro contexto marque un asset como destacado, representativo o preferido no reescribe la identidad del asset ni su placement principal. Esa preferencia vive en la relación o selección del contexto consumidor, no en la definición estructural del núcleo.

## Batch 1: modelo canónico de `Asset`

Este batch es el corazón técnico del programa.

### Debe cerrar

- separación entre `Asset Identity` y `Content Fingerprint`,
- criterio de duplicados,
- papel de `Source File`,
- estrategia de ingesta,
- y consecuencia estructural de `Asset Specialization`.

La ruta acordada para converger sin fabricar un monstruo intermedio es ejecutar el modelo canónico de `Asset` como slice acotado, alineado con el ADR `0003`: raíz común de asset + placement principal + una familia de especialización por vez, usando fachadas transicionales sólo mientras cada slice se cierra completo. La dirección explícita es evitar una megaestructura de convivencia indefinida entre todas las tablas legacy y el modelo canónico nuevo.

### No debería dejar pendiente

- una doble semántica donde `Asset` exista sólo en docs y las tablas sigan mintiendo sin plan de convergencia,
- ni una implementación donde `path` siga funcionando como identidad de facto por debajo de la mesa.

## Batch 2: organizer model

Con el asset model resuelto, recién ahí conviene limpiar la capa de organizers. Hacerlo al revés dejaría a `Folder`, `Album`, `Collection` y `Group` apoyados sobre una unidad principal todavía ambigua.

## Cierres internos ya acordados para esta fase

Dentro de `Media Core`, la base semántica ya no deja estos puntos abiertos:

- en el modelo base, `Source File` y `Primary Placement` no se separan; la separación sólo aparece si el producto necesita placements secundarios explícitos,
- los placements secundarios viven en la misma capa física como materializaciones adicionales explícitas bajo una sola identidad de asset,
- la raíz común de `Asset` ya tiene un shape mínimo acotado y no absorbe por defecto concerns de infraestructura,
- la migración desde tablas por tipo converge por slices acotados del modelo canónico y no mediante una megaestructura intermedia indefinida,
- y el estado verdaderamente transversal del asset queda separado de jobs, pipelines y telemetría operativa adyacente.

Quedan abiertas, en cambio, sólo decisiones de ejecución técnica fina y orden de implementación, no la semántica base del contexto.

## Criterio de salida del slice

`Media Core` estará realmente encaminado cuando ocurra todo esto a la vez:

- `Asset` tenga semántica y consecuencia estructural reales,
- duplicados e identidad ya no dependan del mismo campo con otro nombre,
- los organizers dejen de competir entre sí por significado,
- los títulos visibles y preferencias externas no se confundan con identidad del asset,
- y los demás contextos puedan referenciar el núcleo sin redefinirlo.
