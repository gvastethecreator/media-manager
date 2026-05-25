# Legacy and Deprecations

No todo lo existente en el repositorio merece ser migrado al target architecture. Parte del trabajo profesional consiste justamente en decidir qué se conserva, qué se puentea y qué se deja morir.

## `Task`

`Task` es el caso más claro de capacidad que quedó fuera del target architecture actual.

### Decisión acordada

- no pertenece a `Taxonomy`,
- no forma parte del corazón visible del producto,
- no justifica gobernar el roadmap principal,
- y se considera **legacy interna en deprecación**.

### Lectura estratégica

Puede haber tenido valor histórico o incluso cierta superficie técnica real, pero eso no basta para convertirlo en destino de inversión arquitectónica cuando el producto todavía está aclarando su núcleo.

### Destino preferente

- congelar su expansión,
- no diseñar el sistema alrededor suyo,
- y tratarla como candidata a eliminación.

Sólo debería reabrirse si más adelante aparece una iniciativa explícita y fuerte de `Workflow/Projects` con valor real de producto o de operación.

## Patrones legacy que no deben sobrevivir como doctrina

### 1. Doble verdad de `Favorite`

Tabla transversal más `isFavorite` embebido por entidad no puede sobrevivir como forma canónica del sistema.

### 2. Explosión de relaciones por par

Endpoints y joins hiper-específicos para cada combinación posible de entidades no deberían ser el shape final para vínculos semánticos transversales.

### 3. Organizadores con semántica inflada

- `Folder` no debe mutar a organizer virtual.
- `Album` no debe convertirse en contenedor universal.
- `Collection` no debe competir con `Group` como cluster heterogéneo.
- `Group` no debe volverse bucket absoluto para cualquier cosa del dominio.

### 4. Artefactos compartidos secuestrados por otros contextos

- `Prompt` no debe volver a caer dentro de worldbuilding como pseudo-entidad narrativa.
- `Note` no debe reducirse a comentario pegado a una sola entidad.
- `Wildcard` no debe convertirse en simple subpieza interna de `Prompt`.

### 5. `Asset` como término ornamental

La arquitectura objetivo no puede dejar `Asset` sólo en las docs mientras la estructura real sigue actuando como si el producto no tuviera una unidad canónica común.

## Cómo tratar el legacy durante la migración

## Regla transversal: rename editorial no equivale a cambio de identidad

En la arquitectura objetivo, hay que separar con disciplina dos clases de cambio que en repositorios maduros suelen mezclarse:

- **identidad portable contractual**, y
- **presentación/copy humana mutable**.

La identidad contractual vive en identificadores portables estables como slugs, keys o tokens. La presentación vive en labels visibles, títulos, summaries, lecturas humanas, traducciones, hints visuales o metadata editorial equivalente.

### Qué puede cambiar sin migración semántica

Por defecto, estos cambios pertenecen a presentación/editorial y no crean otra cosa por sí mismos:

- renombrar el label visible de un `Tag`,
- ajustar el título visible de una `Property`,
- refinar el label visible de un valor permitido,
- reescribir las lecturas humanas forward/inverse de un `Relation Role`,
- o editar `title`, `summary`, `category`, `emoji` o `color` de un artefacto file-backed.

Mientras el significado de dominio siga siendo el mismo, esos cambios no deben disparar migraciones semánticas ni crear replacement artificial.

### Qué sí obliga lifecycle explícito

Si cambia materialmente el significado de dominio, ya no estamos ante un retoque editorial. En ese caso corresponde alguna combinación explícita de:

- deprecación,
- replacement único,
- migración de datos,
- o creación de una identidad nueva.

El criterio práctico es simple: si el sistema ya no puede garantizar que el identificador histórico sigue apuntando al mismo concepto, no alcanza con “renombrarlo”.

### Regla de convivencia con legacy

Cuando una identidad queda deprecated:

- puede seguir leyéndose como legado para compatibilidad y migración,
- no debe aceptarse en nuevas escrituras normales,
- su identificador histórico queda reservado,
- y su sucesión semántica no debe quedar ambigua.

### Se tolera temporalmente

- facades de compatibilidad,
- estados desnormalizados claramente marcados como transitorios,
- y adaptadores que sirvan para salir del árbol viejo.

### No se tolera como final state

- contratos duplicados como semántica permanente,
- módulos legacy que siguen recibiendo diseño nuevo sin plan de cierre,
- y conceptos deprecated que siguen influyendo en la forma del target architecture.

## Criterio de eliminación

Una pieza legacy puede considerarse realmente fuera de combate cuando:

- ya no define el lenguaje del producto,
- ya no obliga a sostener contratos canónicos alrededor suyo,
- ya no recibe inversión estructural nueva,
- y existe una ruta clara para apagarla sin desordenar el núcleo.

## Regla práctica

Si en una decisión futura alguien necesita defender una pieza legacy diciendo “mejor no tocarla por ahora” pero al mismo tiempo quiere que el nuevo modelo gire alrededor de esa pieza, eso casi siempre es una señal de recaída.

Se puede respetar el legacy o se puede dejar que gobierne el target architecture. Las dos cosas a la vez casi nunca salen baratas.
