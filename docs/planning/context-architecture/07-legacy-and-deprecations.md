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
