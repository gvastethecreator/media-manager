# Context Architecture Documentation

Este directorio reúne la documentación detallada del rediseño por contextos explícitos acordado durante la sesión de definición. No reemplaza al glosario (`CONTEXT.md`) ni a los ADRs; los complementa.

## Cómo leer este paquete

- Usa `CONTEXT.md` como **glosario canónico**.
- Usa `CONTEXT-MAP.md` como **mapa rápido de contextos y dependencias**.
- Usa los ADRs en `docs/adr/` para las **decisiones difíciles de revertir**.
- Usa estos documentos para entender:
  - alcance de cada contexto,
  - límites de ownership,
  - batches de migración,
  - y criterios de diseño para no volver a mezclar el modelo.

## Índice

- [`01-migration-principles.md`](./01-migration-principles.md) — principios rectores de la migración y reglas de diseño.
- [`02-platform-system-context.md`](./02-platform-system-context.md) — detalle del contexto `Platform/System`.
- [`03-media-core-context.md`](./03-media-core-context.md) — detalle del contexto `Media Core`.
- [`04-favorite-bridge.md`](./04-favorite-bridge.md) — batch puente para `Favorite` como relación transversal.
- [`05-taxonomy-context.md`](./05-taxonomy-context.md) — detalle del subdominio compartido `Taxonomy`.
- [`06-worldbuilding-context.md`](./06-worldbuilding-context.md) — detalle del contexto `Worldbuilding`.
- [`07-legacy-and-deprecations.md`](./07-legacy-and-deprecations.md) — capacidades fuera del target architecture y deuda a extinguir.
- [`08-semantic-relation-model.md`](./08-semantic-relation-model.md) — contrato operativo inicial del modelo genérico de relaciones semánticas.

## Qué problema resuelve esta documentación

El repositorio actual mezcla varias cosas a la vez:

- dominio central de media,
- organizadores físicos y lógicos,
- worldbuilding,
- clasificación compartida,
- y capacidades operativas transversales.

Eso hace que el árbol físico, las rutas, los servicios y la semántica del producto no siempre apunten en la misma dirección. Este paquete documental fija una arquitectura objetivo más profesional antes de entrar al refactor duro.

## Estado actual del programa

### Ya decidido

- El producto sigue siendo un **monolito**, pero con **fronteras explícitas por contexto**.
- `Media Core` es el núcleo protegido.
- `Taxonomy` es subdominio compartido, no cuarto contexto principal.
- `Worldbuilding Context` depende de `Media Core`; no lo reemplaza.
- La migración se hará por **slices acotados con big bang interno**.
- `Favorite` se modela canónicamente como **relación transversal**.
- `Task` queda fuera del target architecture y entra en zona de deprecación.

### Pendiente de seguir definiendo en la entrevista

Todavía faltan decisiones de contrato y forma interna, por ejemplo:

- shape técnico exacto del registro de `Semantic Relation`,
- shape técnico final de `PropertyAssignment`,
- reglas exactas de placements/source records del `Media Core`,
- y detalles de integración entre artefactos textuales file-backed y su indexación.

## Regla de uso

Si una futura decisión contradice este paquete, debe ocurrir una de estas dos cosas:

1. se corrige la documentación antes o junto con el cambio, o
2. se crea un ADR que explique por qué se movió la frontera.

Si no ocurre ninguna, el repo volverá a hablar en varios dialectos a la vez. Y ya vimos que eso sale caro.
