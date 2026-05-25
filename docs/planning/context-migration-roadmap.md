# Context Migration Roadmap

Hoja de ruta acordada para migrar el repositorio hacia el modelo por contextos explícitos. La ejecución se hará mediante **slices acotados con big bang interno**, no por convivencia flexible indefinida ni por big bang de contexto completo.

La base semántica principal de `Platform/System`, `Media Core`, `Favorite`, `Taxonomy` y `Worldbuilding` ya quedó suficientemente cerrada en documentación. Desde este punto, la hoja de ruta debe leerse sobre todo como **orden de convergencia runtime y enforcement**, no como una lista de conceptos todavía sin definir.

## Secuencia acordada

### 1. Platform/System Context

Primero se estabiliza la columna vertebral de la aplicación para que los slices siguientes no nazcan otra vez sobre un shell ambiguo.

- **Batch 1:** consolidar `App Shell`, ownership de providers globales y router raíz.
- **Batch 2:** enforcement y scaffolding de fronteras.
- **Resultado esperado:** un `Platform/System` que ya no sea bucket difuso, sino owner claro de runtime, composición global y procesos transversales.

### 2. Media Core

Una vez estabilizado el shell, se aterriza el núcleo real del producto en contratos ejecutables y migraciones concretas.

- **Batch 1:** modelo canónico de `Asset` + root mínimo + `Primary Placement` + placements secundarios explícitos + reglas de ingesta.
- **Batch 2:** modelo de `Organizer` (`Folder`, `Album`, `Collection`, `Group`) y API base asociada.
- **Resultado esperado:** una raíz común de asset real y utilizable, sin seguir delegando identidad y lifecycle a la dispersión legacy por tipo.

### 3. Favorite como batch puente

`Favorite` no debe seguir repartido por entidad como verdad dual.

- **Batch canónico:** relación transversal `Favorite` + API canónica relacional.
- **Compatibilidad temporal:** endpoints por entidad sólo como facades transicionales.
- **Ubicación en la hoja de ruta actual:** después del fundamento operativo de `Platform/System` y del root de `Media Core`, para desmontar cuanto antes `isFavorite` como pseudoverdad semántica.

### 4. Taxonomy

Con `Media Core` y `Favorite` ya encaminados en runtime, se baja el lenguaje compartido a enforcement, persistencia y sincronización reales.

- **Batch 1:** `Tag` + `Property`.
- **Batch 2:** `Prompt` + `Note` + `Wildcard`.
- **Resultado esperado:** contratos compartidos aplicados de verdad en API/UI/storage, especialmente en identidad portable, lifecycle y artefactos file-backed.

### 5. Worldbuilding Context

El contexto narrativo entra sobre una base ya ordenada y sin necesidad de reabrir la semántica central.

- **Batch 1:** `Narrative Entity` base + modelo de relación con `Assets` y `Organizers`.
- **Batch 2:** `Character` + `Place` + `Concept`.
- **Pendiente posterior:** `World Item` y otras especializaciones restantes.
- **Resultado esperado:** worldbuilding acoplado al núcleo por relaciones claras, no por ownership encubierto de assets.

## Decisiones transversales ya fijadas

- La base semántica gruesa del paquete ya está cerrada; lo siguiente es enforcement y convergencia operativa.
- `Taxonomy` es subdominio compartido, no cuarto contexto principal.
- `Worldbuilding Context` depende de `Media Core`; no lo redefine.
- `Favorite` es una relación transversal canónica scoped al actor o perfil operativo activo.
- `Platform/System Context` posee shell/runtime/procesos transversales y no la semántica del dominio.
- Las APIs canónicas deben alinearse con su contexto dueño; las facades legacy existen sólo como compatibilidad temporal.
- La migración se ejecuta por capacidades coherentes, con cierre fuerte dentro de cada slice.

## Fuera de la arquitectura objetivo

- `Task` queda considerada **legacy interna en deprecación**.
- No forma parte del target architecture actual.
- Su destino preferente es la eliminación, salvo que más adelante aparezca un caso de uso fuerte y explícito para un subcontexto `Workflow/Projects`.
