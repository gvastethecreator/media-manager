# Favorite Bridge

`Favorite` no es sólo una feature simpática de UI. En el estado actual del repositorio es también una zona de contradicción importante: existe como tabla transversal y a la vez como flags `isFavorite` repartidos por múltiples tablas y endpoints.

Este documento define por qué `Favorite` merece un batch propio y por qué aparece como puente entre `Media Core` y los contextos restantes.

## Problema actual

Hoy conviven dos ideas distintas de favorito:

- una relación transversal (`Favorite`),
- y un estado embebido por entidad (`isFavorite`).

Eso genera riesgos obvios:

- drift entre dos fuentes de verdad,
- APIs duplicadas,
- cachés inconsistentes,
- y semántica confusa en el dominio.

## Decisión canónica

`Favorite` es una **relación transversal canónica**.

No es una propiedad esencial de `Image`, `Video`, `Album`, `Character` o cualquier otra entidad. Es un marcador que destaca un objeto sin cambiar su identidad ni su tipo.

Además, la lectura recomendada para la arquitectura objetivo es que `Favorite` sea un marcador **scoped al actor o `Operational Profile` activo**, no una propiedad ontológica global del objeto. Si el producto sigue operando en modo local/single-user, ese scope puede colapsarse pragmáticamente al perfil operativo activo único sin mentir sobre la naturaleza relacional del favorito.

## Consecuencia estructural

### Fuente de verdad final

La fuente de verdad final debe vivir en una familia canónica de favoritos/relaciones transversales.

La forma inicial recomendada para esa relación debe mantenerse deliberadamente delgada:

- identidad estable de la relación `Favorite`,
- referencia al actor/perfil dueño del favorito,
- referencia al objeto favorito,
- y `addedAt` como metadata operativa mínima.

Campos como `category`, `notes` o `priority` no forman parte del contrato canónico inicial. Si el producto necesita más adelante favoritos curados, anotados o rankeados, eso debe entrar como extensión explícita o como capacidad vecina, no como inflación silenciosa del marcador base.

La unicidad lógica recomendada es una sola relación activa por par `(actor, target)`; el sistema no debe poder guardar duplicados equivalentes del mismo favorito sólo porque tengan IDs distintos.

Las operaciones canónicas de marcar y desmarcar también deben ser idempotentes. Marcar un target ya favorito no crea una segunda relación activa ni cambia su semántica de dominio; desmarcar un target que ya no está marcado no debe producir una nueva verdad alternativa ni requerir una coreografía especial de compensación.

`Favorite` tampoco introduce en este primer contrato un lifecycle semántico rico propio. Su visibilidad normal sigue la superficie activa del target marcado: si el objeto sale de esa superficie por borrado lógico o tombstone, el favorito deja de mostrarse en consultas normales; si el objeto se restaura, el favorito puede reaparecer sin necesidad de recrearlo; y si el target se purga físicamente, la relación deja de existir como vínculo preservable.

### Qué pasa con `isFavorite`

Los flags embebidos:

- no son la verdad conceptual,
- no deben sobrevivir como contrato principal,
- y sólo pueden tolerarse temporalmente como deuda o cache de transición.

Si sobreviven durante un tiempo, su lectura correcta es proyección derivada o cache de conveniencia. Nunca deben ganar una discusión contra la relación canónica cuando ambas no coincidan.

## API objetivo

### Contrato canónico

El contrato canónico debe vivir bajo una familia de API de favoritos o relaciones transversales.

Ese contrato también debe fijar un perímetro inicial claro. La recomendación actual es admitir como targets favoritos a:

- `Assets`,
- `Organizers`,
- `Narrative Entities`,
- `Prompt`,
- `Note`,
- y `Wildcard`.

En cambio, `Tag`, `Property` y `Task` no deberían entrar en el perímetro inicial de `Favorite`. Si en la UI hace falta “destacar” o “pinear” vocabulario de catálogo, eso pertenece mejor a preferencias operativas o tooling editorial que al marcador canónico de favorito.

### Contratos legacy

Los endpoints por entidad pueden seguir existiendo un tiempo, pero sólo como facades. Eso significa:

- delegan internamente al contrato canónico,
- no definen reglas distintas,
- no persisten por otra vía,
- y no viven como segunda semántica permanente.

## Encaje actual del batch

Después del cierre semántico de `Media Core`, `Taxonomy`, `Worldbuilding` y `Platform/System`, este batch ya no existe para “anticiparse” a definiciones todavía abiertas. Ahora su lugar queda más claro:

- toma una semántica transversal ya acordada,
- la vuelve contrato runtime canónico,
- y elimina la verdad dual que todavía sobrevive en flags y endpoints legacy.

En otras palabras, `Favorite` ya no espera a que otros contextos terminen de definirse. Lo que falta aquí es convergencia operativa y cleanup arquitectónico sobre una base semántica que ya quedó fijada.

## Qué debe incluir el batch

### 1. Canonical relation model

- shape estable de la relación `Favorite`.
- ownership claro.
- contrato de lectura y escritura coherente.
- unicidad lógica por actor y target.
- perímetro explícito de participantes permitidos.

### 2. Facades transicionales

- rutas legacy por entidad que delegan.
- estrategia clara de compatibilidad temporal.

### 3. Remoción del estado dual

- desmontar `isFavorite` como verdad primaria.
- acotar o eliminar dependencias de UI que asumen el flag como canónico.

### 4. Reindexación conceptual del frontend

El frontend debe dejar de pensar “cada entidad tiene su favorito embebido” y pasar a pensar “hay una relación transversal que marca favoritos”.

## Qué no debe pasar

- no convertir `Favorite` en un mega-contenedor genérico para cualquier relación.
- no dejarlo preso de un solo contexto de negocio cuando ya se decidió que es transversal.
- no inflar el marcador base con metadata editorial (`notes`, `priority`, `category`) sin una decisión explícita de producto.
- no sostener indefinidamente tabla transversal más flags locales como contrato dual permanente.

## Criterio de salida del batch

Este batch estará bien resuelto cuando:

- haya una única semántica canónica de favorito,
- las APIs por entidad ya sean compatibilidad y no fuente primaria,
- el frontend deje de depender conceptualmente del flag embebido,
- el scope por actor/perfil y el perímetro de targets estén fijados sin ambigüedad,
- y el modelo pueda crecer sin volver a abrir la discusión de “cuál era la verdad real”.

## Cierre ya acordado para esta fase

La semántica base de `Favorite` ya no debería reabrirse en esta etapa:

- `Favorite` es relación transversal canónica,
- el scope contractual pertenece al actor o `Operational Profile` activo,
- el perímetro inicial de targets ya está fijado,
- `Tag`, `Property` y `Task` quedan fuera del perímetro inicial,
- y `isFavorite` sólo sobrevive como deuda temporal o proyección derivada.

Lo pendiente desde aquí es implementación y desmantelamiento de verdad dual, no redefinición del concepto.
