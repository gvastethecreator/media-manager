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

También implica que la identidad narrativa no puede colapsarse en un asset “principal” como si fueran la misma cosa. Un `Character`, `Place`, `Concept` o `World Item` puede tener cero, uno o varios assets relacionados; ninguno de esos assets agota por sí mismo la identidad de la entidad narrativa.

## Batch 1: `Narrative Entity` base + relation model

El primer batch no debería empezar creando cuatro especies distintas sin base común. Primero hay que fijar qué comparten.

### `Narrative Entity`

Debe expresar el objeto narrativo genérico que:

- tiene significado diegético o conceptual,
- puede vincularse a `Assets`,
- puede vincularse a ciertos `Organizers`,
- y no define por sí misma el modelo de media.

Si el producto necesita destacar un asset canónico para una entidad narrativa, eso debe modelarse como relación o selección explícita dentro del contexto, no como ownership silencioso del asset ni como redefinición de su identidad en `Media Core`.

### Modelo de relación

`Narrative Entity` necesita una forma clara de vincularse a:

- `Assets`
- `Organizers`
- otras `Narrative Entities` cuando haga falta

Los vínculos a `Organizers` deben leerse como relaciones semánticas de uso, pertenencia editorial o contexto narrativo, no como permiso para que `Worldbuilding` redefina la semántica estructural de `Folder`, `Album`, `Collection` o `Group`.

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

También significa que `Worldbuilding` no debe abrir taxonomías locales paralelas para “sus” personajes, lugares o conceptos cuando el lenguaje compartido ya puede expresarse con `Tag`, `Property` y sus restricciones de aplicabilidad.

## Señales de mala salud

El contexto está creciendo mal si aparecen patrones como estos:

- entidades narrativas con fields o relaciones que intentan redefinir la identidad del asset,
- worldbuilding decidiendo qué cuenta como organizer del núcleo,
- cada entidad narrativa tratada como si debiera tener exactamente un asset “verdadero”,
- `Prompt` o `Note` tratados como si fueran worldbuilding-only,
- taxonomías locales de worldbuilding que duplican o compiten con `Tag` y `Property`,
- `World Item` usado como cajón de sastre sistemático.

## Criterio de salida del slice

Este slice estará bien encaminado cuando:

- exista una base clara de `Narrative Entity`,
- `Character`, `Place` y `Concept` validen esa base sin duplicar lógica estructural,
- las relaciones con `Media Core` sean claras pero no invasivas,
- la identidad narrativa permanezca separada de los assets que la representan,
- y `World Item` quede reservado para su rol residual controlado.
