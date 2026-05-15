# Migration Principles

Este documento fija las reglas de juego del rediseño por contextos. No describe un contexto concreto; describe cómo debe ejecutarse la transformación del repositorio para que el resultado sea coherente y no una mezcla nueva con nombres más bonitos.

## Objetivo del programa

La meta no es sólo reorganizar carpetas ni mover archivos entre módulos. La meta es alinear cuatro cosas que hoy no siempre coinciden:

- lenguaje del dominio,
- ownership semántico,
- shape de APIs,
- y estructura física del repositorio.

## Principios rectores

### 1. Primero lenguaje, luego estructura

La reorganización física sólo tiene valor si refleja un lenguaje más claro. Por eso el glosario y las decisiones de frontera vienen antes del refactor profundo.

### 2. Contextos explícitos, no capas técnicas disfrazadas

La arquitectura objetivo no debe organizarse sólo por `routes`, `services`, `transformers` y `stores`. Cada contexto necesita:

- propósito reconocible,
- conceptos propios,
- límites de entrada y salida,
- y una razón clara para existir.

### 3. `Media Core` es el núcleo protegido

Cuando haya tensión entre:

- conveniencia operativa,
- worldbuilding,
- o artefactos semánticos compartidos,

la semántica canónica del producto debe proteger primero a `Media Core`.

### 4. APIs canónicas por ownership

Cada capacidad debe converger hacia un contrato canónico alineado con su dueño real. Si una capacidad es transversal, debe tener API transversal propia.

Ejemplo claro: `Favorite`.

No debería quedar repartido como verdad primaria entre endpoints por entidad y además una familia transversal separada. Puede haber facades temporales, pero no doble semántica permanente.

### 5. Slices acotados con big bang interno

La migración no será convivencia flexible infinita ni reescritura de contexto entero en una sola maniobra. La regla acordada es:

- escoger una capacidad bien delimitada,
- migrarla de punta a punta,
- cerrar su nueva semántica,
- y limpiar el legacy relevante en el mismo batch.

Eso evita dos anti-patrones:

- el refactor decorativo que nunca termina,
- y el big bang gigante que rompe demasiado a la vez.

### 6. Relación entre documentación y cambio

El paquete documental tiene tres capas y cada una cumple un rol distinto:

- `CONTEXT.md`: glosario canónico, sin implementación.
- `docs/adr/`: decisiones difíciles de revertir y sorprendentes sin contexto.
- `docs/planning/context-architecture/`: desarrollo operativo y detallado de la arquitectura objetivo.

Si las tres dicen cosas distintas, el repositorio está mintiendo.

## Secuencia acordada

### 1. `Platform/System Context`

- Batch 1: app shell, providers globales, router raíz, ownership del runtime visible.
- Batch 2: enforcement, scaffolding, límites de importación y guardrails para impedir recaídas.

### 2. `Media Core`

- Batch 1: `Asset`, identidad, fingerprint, duplicados, ingesta.
- Batch 2: `Organizer model` (`Folder`, `Album`, `Collection`, `Group`).

### 3. `Favorite` como batch puente

- relación transversal canónica,
- API propia,
- facades legacy por entidad sólo como compatibilidad temporal.

### 4. `Taxonomy`

- Batch 1: `Tag` + `Property`.
- Batch 2: `Prompt` + `Note` + `Wildcard`.

### 5. `Worldbuilding Context`

- Batch 1: `Narrative Entity` base + relación con `Assets` y `Organizers`.
- Batch 2: `Character` + `Place` + `Concept`.
- Después: `World Item` y demás especializaciones residuales.

## Reglas de diseño que no deben romperse

### Canonical first

Cuando exista tensión entre modelo ideal y compatibilidad legacy:

- el target architecture manda,
- la compatibilidad se trata como puente,
- no como nueva fuente canónica de verdad.

### No nuevos híbridos sin nombre claro

Si aparece un concepto que no entra limpiamente en:

- `Media Core`,
- `Taxonomy`,
- `Worldbuilding`,
- o `Platform/System`,

no se debe esconder en cualquier contexto por conveniencia. Primero hay que nombrarlo bien.

### Las relaciones fuertes no se diluyen

El modelo híbrido de relaciones permite vínculos semánticos genéricos, pero no debe comerse:

- containment,
- ownership,
- specialization,
- ni relaciones transversales con semántica propia fuerte como `Favorite`.

## Qué se considera éxito

Una etapa se considera bien hecha cuando logra las cuatro cosas a la vez:

1. el lenguaje queda más preciso,
2. el ownership queda más claro,
3. la API y la estructura física apuntan en la misma dirección,
4. y el legacy de esa capacidad deja de competir como verdad equivalente.

Si sólo se cumple una o dos, no fue migración real: fue cirugía cosmética con buena intención.
