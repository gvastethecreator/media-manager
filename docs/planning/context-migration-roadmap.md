# Context Migration Roadmap

Hoja de ruta acordada para migrar el repositorio hacia el modelo por contextos explícitos. La ejecución se hará mediante **slices acotados con big bang interno**, no por convivencia flexible indefinida ni por big bang de contexto completo.

## Secuencia acordada

### 1. Platform/System Context

Primero se estabiliza la columna vertebral de la aplicación.

- **Batch 1:** app shell, ownership de providers globales y router raíz.
- **Batch 2:** enforcement y scaffolding de fronteras.

### 2. Media Core

Una vez limpio el shell, se ataca el núcleo real del producto.

- **Batch 1:** modelo canónico de `Asset` + `Asset Identity` + `Content Fingerprint` + `Duplicate Candidate` + reglas de ingesta.
- **Batch 2:** modelo de `Organizer` (`Folder`, `Album`, `Collection`, `Group`) y API base asociada.

### 3. Favorite como batch puente

`Favorite` no debe quedar repartido por entidad como verdad dual.

- **Batch canónico:** relación transversal `Favorite` + API canónica relacional.
- **Compatibilidad temporal:** endpoints por entidad sólo como facades transicionales.
- **Ubicación en la hoja de ruta:** después del fundamento de `Media Core` y antes de cerrar `Taxonomy` / `Worldbuilding`.

### 4. Taxonomy

Con `Media Core` ya firme, se estabiliza el lenguaje compartido.

- **Batch 1:** `Tag` + `Property`.
- **Batch 2:** `Prompt` + `Note` + `Wildcard`.

### 5. Worldbuilding Context

El contexto narrativo entra sobre una base ya ordenada.

- **Batch 1:** `Narrative Entity` base + modelo de relación con `Assets` y `Organizers`.
- **Batch 2:** `Character` + `Place` + `Concept`.
- **Pendiente posterior:** `World Item` y otras especializaciones restantes.

## Decisiones transversales ya fijadas

- `Taxonomy` es subdominio compartido, no cuarto contexto principal.
- `Worldbuilding Context` depende de `Media Core`; no lo redefine.
- `Favorite` es una relación transversal canónica.
- Las APIs canónicas deben alinearse con su contexto dueño; las facades legacy existen sólo como compatibilidad temporal.
- La migración se ejecuta por capacidades coherentes, con cierre fuerte dentro de cada slice.

## Fuera de la arquitectura objetivo

- `Task` queda considerada **legacy interna en deprecación**.
- No forma parte del target architecture actual.
- Su destino preferente es la eliminación, salvo que más adelante aparezca un caso de uso fuerte y explícito para un subcontexto `Workflow/Projects`.
