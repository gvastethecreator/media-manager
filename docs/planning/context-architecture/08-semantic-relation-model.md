# Semantic Relation Model

Este documento aterriza el ADR `0005-hybrid-relation-model.md` y baja a contrato operativo las decisiones ya acordadas para la capa genérica de relaciones semánticas.

No sustituye al ADR. El ADR fija el principio híbrido. Este documento fija cómo debe comportarse el modelo genérico para no volver a mezclarse con relaciones estructurales, `Favorite` o `PropertyAssignment`.

## Propósito

El relation model semántico existe para expresar vínculos cross-context entre objetos del dominio cuando ese vínculo:

- aporta significado,
- no es mera clasificación,
- no es una faceta/atributo,
- y tampoco constituye una estructura fundacional como containment u ownership.

## Qué resuelve

Este modelo ayuda a evitar dos extremos igual de dañinos:

- una explosión de tablas y endpoints por cada par posible de objetos,
- o una relación completamente genérica usada para todo, incluso donde el dominio necesita contratos fuertes.

## Qué no debe absorber

### Relaciones estructurales fuertes

La capa genérica no debe reemplazar:

- containment,
- ownership,
- specialization,
- membresías estructurales fuertes,
- ni otras relaciones fundacionales del modelo.

Esas siguen con modelado dedicado.

### `Favorite`

`Favorite` sigue siendo una relación transversal canónica propia. No debe diluirse dentro del relation model genérico.

### `PropertyAssignment`

Si un supuesto “vínculo” en realidad es una faceta o atributo aplicado a un objeto, eso pertenece a `PropertyAssignment`.

Y al revés también:

- si el supuesto “valor” de una property apunta a otro objeto del dominio,
- eso ya no es `PropertyAssignment`,
- sino una relación explícita.

## Contrato canónico acordado hasta ahora

### 1. Es una relación semántica transversal

El modelo genérico se reserva para vínculos semánticos entre objetos del dominio permitidos por la arquitectura.

### 2. Es dirigida por defecto

La relación tiene orientación canónica.

Eso significa que:

- no debe asumirse simetría por comodidad,
- no toda relación tiene la misma lectura desde ambos extremos,
- y la UI/API deben respetar la dirección del vínculo real.

### 3. La simetría es explícita

Si una relación necesita leerse como simétrica, esa simetría se declara de forma explícita.

No se asume por default.

Cuando el role es simétrico, esa simetría también impacta la forma de almacenamiento: la representación canónica debe normalizar los extremos en un orden determinista para impedir que `A ↔ B` y `B ↔ A` se persistan como duplicados invertidos del mismo vínculo.

### 4. Se almacena una sola vez

La representación canónica guarda una sola fila.

La inversa:

- se deriva en queries o UI cuando haga falta,
- no se persiste por defecto como espejo obligatorio,
- y sólo justificaría otra fila si conceptualmente se trata de otra relación distinta.

### 5. `Relation Role` es opcional

No todas las relaciones necesitan un rol semántico rico.

Pero cuando el vínculo lo exige, el modelo puede llevar un `Relation Role` opcional para hacer explícita la lectura del enlace.

Ese `Relation Role` no debe quedar como texto libre por fila. La dirección acordada es un vocabulario pequeño y gobernado, ampliable de forma explícita cuando aparezca una necesidad real.

Además, el seed inicial de ese vocabulario debe arrancar deliberadamente pequeño y con roles semánticamente fuertes. La intención no es cubrir desde el día 1 todas las frases posibles del dominio, sino establecer un núcleo reusable y difícil de malinterpretar.

Ese primer seed debe apoyarse sobre todo en roles relacionales transversales, no en una colección temprana de matices editoriales o narrativos demasiado cargados por contexto. La idea es priorizar verbos que sobrevivan mejor al cruce entre `Media Core`, `Taxonomy` y `Worldbuilding`.

El set mínimo inicial acordado para ese seed es:

- `references`
- `inspired_by`
- `derived_from`
- `variant_of`

La intención es cubrir una base pequeña pero reusable de vínculos semánticos frecuentes sin caer en un comodín vacío ni en un catálogo inflado desde el día 1.

Dentro de ese primer set, `variant_of` se define como rol simétrico. La razón es separar con claridad el parentesco lateral entre variantes de la descendencia u origen histórico, que ya queda mejor expresado por `derived_from`.

En cambio, `references` se define como rol dirigido. La lectura “A references B” no implica la recíproca, y tratarlo como simétrico degradaría un vínculo semántico útil en una proximidad demasiado blanda.

También se fija una separación fuerte entre `inspired_by` y `derived_from`. `inspired_by` expresa influencia o referencia creativa/conceptual sin reclamar descendencia fuerte; `derived_from`, en cambio, expresa una transformación, adaptación o descendencia semántica más intensa.

Además, todos los roles de este primer seed deben venir ya con lectura inverse explícita. El seed es lo bastante pequeño como para exigir definiciones completas desde ambos extremos y no dejar inversas implícitas o vagas para más adelante.

Esa exigencia no queda limitada al primer seed. La dirección acordada es que todo `Relation Role` del vocabulario gobernado declare siempre una lectura forward y una lectura inverse explícitas, aunque en algunos casos ambas terminen siendo equivalentes. La intención es impedir que roles futuros nazcan semánticamente incompletos y que la inverse se improvise después en UI o API.

Además, la identidad contractual del role no debe depender de esas frases humanas. Cada `Relation Role` necesita un identificador portable estable en `snake_case`, separado de sus lecturas forward e inverse, para que el vocabulario pueda evolucionar en presentación sin romper referencias ni compatibilidad.

Ese slug portable se trata además como identidad estable y no como copy editable. Si en algún momento necesita cambiar, el movimiento correcto es una migración explícita y no un rename casual como si fuera sólo una etiqueta visible.

Cuando un `Relation Role` declare aplicabilidad restringida por familias o tipos participantes, esa restricción opera como contrato real. Usar el role fuera de ese perímetro se considera inválido y no una simple advertencia documental o de UI.

En particular, la lectura inverse de `derived_from` debe conservar una semántica fuerte de origen. Si el forward expresa descendencia o transformación intensa, la inverse no puede degradarse a una fórmula blanda; debe decir con claridad que el extremo opuesto actúa como fuente u origen de esa derivación.

Además, el vocabulario de roles debe ser global y compartido. Cuando haga falta, se podrá restringir por aplicabilidad según familias o tipos participantes, pero no se dividirá en diccionarios paralelos por contexto.

Cuando un vínculo sea realmente simétrico, esa simetría debe declararse en la definición del role. No es una banderita suelta que cada fila active o desactive arbitrariamente.

Además, cada role debe declarar:

- una lectura canónica forward,
- y una lectura inverse explícita para UI o consultas vistas desde el otro extremo.

Así se evita duplicar relaciones sólo para cambiar la frase con que se presenta el vínculo.

Si una relación no necesita semántica adicional, el role debe quedar ausente. La dirección acordada es no inventar un comodín genérico tipo `related_to` sólo para llenar el campo.

### 6. El perímetro inicial es explícito

Los participantes iniciales permitidos para `Semantic Relation` son:

- `Assets`
- `Organizers`
- `Narrative Entities`
- `Prompt`
- `Note`
- `Wildcard`

Y quedan fuera del perímetro inicial:

- `Tag`
- `Property`
- `Favorite`
- `Task`

La intención es proteger la frontera entre:

- clasificación (`Tag`),
- facetas/atributos (`Property`),
- relación transversal canónica específica (`Favorite`),
- y legacy/operativa (`Task`).

### 7. La relación tiene identidad propia estable

La dirección acordada es que `Semantic Relation` tenga identidad propia estable (`relationId`).

Eso no impide definir unicidad lógica cuando haga falta, pero evita depender sólo de una clave compuesta entre:

- extremo origen,
- extremo destino,
- y rol.

Esta decisión ayuda a:

- editar relaciones sin reconstruirlas artificialmente,
- soportar auditoría o metadata futura,
- y tratar el vínculo como registro operativo estable dentro de API y UI.

### 7.5. El shape inicial se mantiene delgado

La dirección acordada para el registro canónico inicial es una forma mínima centrada en:

- identidad estable de la relación,
- referencia al extremo origen,
- referencia al extremo destino,
- y `Relation Role` cuando aplique.

En esta primera definición, el modelo no incorpora todavía un campo libre de explicación, comentario o nota textual por relación. La intención es evitar que `Semantic Relation` se convierta prematuramente en un mini-documento y mantener claro que el significado principal del vínculo vive en los extremos y en el role.

### 8. La unicidad lógica se gobierna aparte

Que exista `relationId` no significa que el sistema pueda guardar el mismo vínculo varias veces.

La dirección acordada es imponer unicidad lógica sobre el triple canónico:

- `source`
- `target`
- `role` (cuando exista)

respetando la dirección del vínculo.

Eso evita:

- ruido semántico en consultas,
- filas duplicadas que dicen lo mismo,
- y falsas diferencias basadas sólo en IDs distintos.

Eso no significa que un mismo par de objetos sólo pueda tener una lectura posible. Pueden coexistir varios roles distintos entre el mismo `source` y `target` siempre que cada uno aporte semántica realmente diferente. Lo que se prohíbe es repetir el mismo significado, no expresar varios significados genuinamente distintos.

En cambio, una relación sin role no debe convivir por defecto con otra relación roleada equivalente sobre el mismo par. El vínculo sin role sólo tiene sentido cuando no hace falta semántica adicional; si el significado ya quedó explicitado por un role, la fila desnuda tendería a introducir ruido más que valor.

La decisión, además, no se queda en convivencia posterior. Si el significado del vínculo encaja claramente en un `Relation Role` existente y aplicable, crear la `Semantic Relation` sin role se considera inválido. La relación desnuda sólo existe cuando de verdad no hace falta un role semántico adicional.

`variant_of`, además, no debe quedar abierto a cualquier combinación de participantes. La dirección acordada es restringirlo a objetos de la misma familia o de familias semánticamente muy cercanas, para preservar la idea de parentesco lateral entre variantes y no degradarlo a una semejanza genérica.

Por ser simétrico, `variant_of` también debe obedecer esa normalización canónica de extremos en storage. La UI o la API pueden presentar el vínculo desde cualquiera de los dos lados, pero la persistencia no debe duplicarlo cambiando sólo la orientación.

Además, `variant_of` y `derived_from` se consideran incompatibles por defecto sobre el mismo par de objetos. La intención es evitar que un mismo vínculo quede modelado simultáneamente como parentesco lateral y como descendencia/transformación fuerte, salvo que una situación excepcional y muy explícita justifique esa coexistencia.

`derived_from`, en cambio, sí puede cruzar familias distintas cuando la derivación fuerte siga siendo semánticamente clara. La intención es permitir transformaciones o adaptaciones intensas entre objetos no idénticos en tipo, sin obligar a encajarlas artificialmente en `references` o `inspired_by`.

Dentro de este primer seed, `references` e `inspired_by` quedan como los roles más ampliamente transversales del perímetro permitido. La intención es que funcionen como puentes semánticos reutilizables entre contextos sin caer en un comodín vacío ni exigir la intensidad específica de `derived_from`.

Además, una `Semantic Relation` entre un objeto y sí mismo se considera inválida por defecto. Sólo debe admitirse cuando un `Relation Role` declare explícitamente que ese tipo de self-link tiene sentido semántico real; de lo contrario, el modelo lo trata como ruido o error de captura.

## Ejemplos razonables para el modelo genérico

- `Asset` relacionado con `Narrative Entity`
- `Prompt` relacionado con `Asset`
- `Note` relacionada con distintos objetos del dominio
- `Group` relacionado con otros objetos cuando el vínculo es semántico y no estructural

## Ejemplos que no deberían caer aquí

- `Folder` conteniendo `Assets`
- `Asset` expresado mediante una especialización concreta
- `Favorite` como marcador transversal canónico
- un valor de `PropertyAssignment` apuntando a otro objeto del dominio

## Consecuencias de diseño

Si el contrato se respeta:

- las APIs pueden converger en operaciones más uniformes para vínculos semánticos,
- la UI puede editar relaciones sin duplicar lógica por cada par de entidades,
- y el modelo evita tanto la explosión de joins como el colapso de significado.

Si el contrato se rompe:

- el sistema volverá a duplicar enlaces en tablas espejo,
- `Property` empezará a competir con el relation model,
- y las relaciones fundacionales terminarán escondidas dentro de una abstracción demasiado blanda.

## Puntos todavía abiertos

La entrevista todavía debe cerrar algunos detalles finos, por ejemplo:

- shape operativo residual del registro canónico (si más adelante aparecen campos adicionales realmente justificados),
- y reglas finales de validación derivadas del catálogo de `Relation Role` en API/UI/storage.
