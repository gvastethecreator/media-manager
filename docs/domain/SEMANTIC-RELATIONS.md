# Relaciones semánticas canónicas

Este contrato aterriza ADR-0005 y `docs/planning/context-architecture/08-semantic-relation-model.md`. Las 28 junctions
tipadas siguen siendo la autoridad para estructura fuerte. `SemanticRelation` existe sólo para vínculos semánticos
cross-context; no absorbe containment, ownership, especialización, `Favorite`, `Tag` ni `PropertyAssignment`.

## Persistencia

- `SemanticRelation.id` es identidad estable. Cada fila guarda un único vínculo dirigido: `sourceType/sourceId`,
  `targetType/targetId` y `roleSlug` opcional.
- `roleKey` es una columna técnica gobernada (`roleSlug ?? ''`) que permite unicidad real también cuando el role es
  `NULL`. No es parte del DTO público.
- Una relación sin role sigue siendo dirigida: `A → B` y `B → A` son vínculos distintos y pueden coexistir. Sólo la
  duplicación de la misma orientación viola la identidad lógica desnuda.
- Los tipos iniciales son `asset`, `folder`, `album`, `collection`, `group`, `character`, `place`, `concept`,
  `world_item`, `prompt`, `note` y `wildcard`.
- Los endpoints polimórficos se validan en el servicio y el inventario read-only. Triggers de purga eliminan vínculos
  cuando un endpoint se borra físicamente. Un Asset tombstoned conserva la fila, pero desaparece de lecturas normales.

## Relation Role gobernado

El seed mínimo es global y versionado:

| slug           | forward      | inverse       | dirección | regla adicional                                  |
| -------------- | ------------ | ------------- | --------- | ------------------------------------------------ |
| `references`   | references   | referenced_by | dirigida  | transversal                                      |
| `inspired_by`  | inspired_by  | inspires      | dirigida  | transversal                                      |
| `derived_from` | derived_from | source_for    | dirigida  | transversal y acíclica                           |
| `variant_of`   | variant_of   | variant_of    | simétrica | mismo tipo concreto; incompatible con derivación |

Todo role declara forward, inverse, simetría, self-link, aplicabilidad, deprecación y reemplazo opcional. Un role
deprecado permanece legible; una escritura nueva se normaliza al único reemplazo vigente o se rechaza.

## Invariantes

- Los roles simétricos ordenan extremos por `type/id` usando el mismo orden byte-a-byte `BINARY` de SQLite; el storage
  rechaza la orientación invertida sin depender del locale del proceso.
- La unicidad lógica cubre `source + target + role`, incluido `role = NULL`.
- Una relación desnuda no coexiste con una roleada en la misma orientación. Como el modelo es dirigido por defecto,
  una desnuda `A → B` sí puede coexistir con una roleada `B → A`.
- `variant_of` y `derived_from` no coexisten sobre el mismo par en ninguna orientación.
- `variant_of` entre Assets exige que ambos compartan el `assetType` concreto (`image`, `video`, `audio`, etc.); que
  ambos extremos sean simplemente `asset` no alcanza.
- Ningún role del seed admite self-links.
- Un role simétrico futuro puede admitir self-links sólo declarando `allowSelf`; igualdad de extremos y orden canónico
  son invariantes independientes.
- `derived_from` usa detección recursiva de ciclos en servicio y triggers de insert/update.
- Crear o editar exige extremos existentes y activos. Esa existencia se revalida en cualquier `UPDATE` de la fila,
  incluso si sólo cambia el role o metadata operativa, para impedir reescribir vínculos históricos a Assets tombstoned.
  Las lecturas inversas se derivan; nunca se persiste una fila espejo.

## API

La superficie canónica vive bajo `/api/semantic-relations`:

- `GET /roles`: vocabulario gobernado, incluido historial de deprecación.
- `GET ?entityType=&entityId=&limit=&offset=`: lecturas forward/inverse desde un extremo.
- `POST /`: alta validada y normalizada.
- `GET/PUT/DELETE /:id`: lifecycle por identidad estable.

La autorización se aplica a ambos extremos. Assets requieren acceso `read + index` a su source canónica; Prompt, Note y
Wildcard file-backed requieren que su root siga concedido. Los listados omiten relaciones cuyo extremo opuesto no está
autorizado y no filtran contenido protegido desde SQLite.

## Evidencia ejecutable

- `src/services/relation/semantic-relation.service.test.ts`: seed, inversas, normalización, aplicabilidad, ciclos,
  conflictos, reemplazos y cleanup.
- `scripts/semantic-relation-http.test.ts`: API y autorización cross-root.
- `scripts/db/semantic-relation-schema.test.ts`: invariantes de migración debajo del servicio, contrato exacto del seed,
  upgrade durable `0009 → 0010` y existencia/cleanup real de los 12 tipos de endpoint.
- `scripts/db/orphan-inventory.ts`: endpoints polimórficos source/target y proyecciones operativas reconciliables.
