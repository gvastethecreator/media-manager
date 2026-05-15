# Worldbuilding Context

`Worldbuilding Context` es opcional respecto del corazón del producto, pero no por eso es trivial. Su trabajo es modelar significado narrativo sin secuestrar la semántica del núcleo multimedia.

## Propósito

Este contexto existe para representar entidades narrativas que pueden relacionarse con media y organizadores sin poseerlos ni redefinirlos.

En otras palabras:

- añade significado,
- no reemplaza el núcleo,
- no convierte el producto en una herramienta narrativa primero y multimedia después.

## Regla cardinal

`Worldbuilding Context` depende de `Media Core`.

No al revés.

Eso implica que:

- las entidades narrativas referencian assets,
- los usan como material de apoyo o representación,
- pero no se convierten en dueñas del core.

## Batch 1: `Narrative Entity` base + relation model

El primer batch no debería empezar creando cuatro especies distintas sin base común. Primero hay que fijar qué comparten.

### `Narrative Entity`

Debe expresar el objeto narrativo genérico que:

- tiene significado diegético o conceptual,
- puede vincularse a `Assets`,
- puede vincularse a ciertos `Organizers`,
- y no define por sí misma el modelo de media.

### Modelo de relación

`Narrative Entity` necesita una forma clara de vincularse a:

- `Assets`
- `Organizers`
- otras `Narrative Entities` cuando haga falta

La arquitectura objetivo favorece un modelo híbrido:

- relaciones estructurales fuertes siguen siendo dedicadas,
- vínculos semánticos cross-context pueden converger hacia una representación genérica con `Relation Role` opcional.

## Batch 2: primeras especializaciones

La secuencia acordada para el segundo batch es:

- `Character`
- `Place`
- `Concept`

Estas tres especializaciones son suficientemente universales como para validar la base sin caer todavía en buckets residuales demasiado pronto.

### `Character`

Persona, agente o identidad narrativa individualizable.

### `Place`

Ubicación narrativa con peso semántico dentro del mundo.

### `Concept`

Idea, principio, categoría o abstracción narrativa relevante para el mundo.

## `World Item`

`World Item` no desaparece, pero no debe entrar como comodín por defecto.

Su papel acordado es:

- entidad residual explícita y controlada,
- para casos que no encajan bien en `Character`, `Place` o `Concept`,
- sin convertirse en el bucket “misc” del worldbuilding.

Por eso entra después.

## Qué no debe pasar

- no modelar worldbuilding como dueño de assets.
- no dejar que `Prompt`, `Note` o `Wildcard` queden absorbidos como si fueran entidades narrativas.
- no usar `World Item` para todo lo que todavía no supimos nombrar.
- no reconstruir dentro de worldbuilding un media model paralelo.

## Relación con `Taxonomy`

`Worldbuilding` consume `Taxonomy`, pero no la posee.

Eso significa que puede usar:

- `Tag`
- `Property`
- `Prompt`
- `Note`
- `Wildcard`

sin convertir esos artefactos en tipos propios del contexto narrativo.

## Señales de mala salud

El contexto está creciendo mal si aparecen patrones como estos:

- entidades narrativas con fields o relaciones que intentan redefinir la identidad del asset,
- worldbuilding decidiendo qué cuenta como organizer del núcleo,
- `Prompt` o `Note` tratados como si fueran worldbuilding-only,
- `World Item` usado como cajón de sastre sistemático.

## Criterio de salida del slice

Este slice estará bien encaminado cuando:

- exista una base clara de `Narrative Entity`,
- `Character`, `Place` y `Concept` validen esa base sin duplicar lógica estructural,
- las relaciones con `Media Core` sean claras pero no invasivas,
- y `World Item` quede reservado para su rol residual controlado.
