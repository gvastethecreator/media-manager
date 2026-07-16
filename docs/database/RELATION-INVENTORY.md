# Inventario de relaciones conceptuales

`scripts/db/orphan-inventory.ts` mantiene un catálogo ejecutable de 90 relaciones. Desde `0001_relational_integrity`,
las relaciones directas soportadas por SQLite también tienen FK físicas; el catálogo sigue siendo necesario para las
referencias polimórficas, compatibilidad legacy y diagnóstico antes/después de upgrades:

<!-- relation-catalog-counts: total=90 direct=84 composite=1 polymorphic=5 junctions=28 endpoints=56 -->

- 56 extremos de 28 junctions de Group/Image/Video/Album/Character hacia organización, taxonomía y worldbuilding;
- placements `folderId` de siete tablas de archivos hacia `Folder`;
- nueve jerarquías `parentId` de Character/Collection/Concept/Folder/Place/Prompt/Tag/Wildcard/WorldItem;
- doce referencias directas adicionales: siete de Settings/Profile/UploadedImage/FileStats/Favorite, `Image.noteId`,
  el enlace expand-contract `Image.assetId` y cuatro de `Asset`/`SourceFile`/`MediaRoot`;
- una relación compuesta que exige que el primary Source File pertenezca al mismo Asset;
- cinco referencias polimórficas de Favorite/Thumbnail/Metadata/Activity/EntityAggregates.

El inventario abre SQLite en modo read-only y entrega únicamente `count`, `technicalIds`, nombre del contrato y política.
No serializa paths, nombres de medios, metadata ni contenido. Las muestras son hashes técnicos SHA-256 truncados a 24
caracteres. Si falta una tabla o columna declarada, el contrato se reporta como `uninspectable` y el comando falla: una
superficie que no pudo medirse nunca se presenta como cero huérfanos.

Las políticas iniciales son deliberadamente conservadoras:

- `auto-delete-link`: sólo para un junction cuyo extremo ya no existe; se podrá reparar de forma idempotente después de
  generar backup y manifest.
- `quarantine`: settings/favorites sin perfil no se reasignan por inferencia.
- `manual-reconcile`: archivos sin folder y jerarquías rotas necesitan una decisión de placement.

La herramienta no repara nada. La migración versionada sólo borra links huérfanos de junctions marcados
`auto-delete-link`; las filas polimórficas/manuales permanecen visibles para una decisión posterior. Cada FK física usa
una política `ON DELETE/UPDATE` explícita y `db:check` ejecuta `foreign_key_check`.

## Resultado sobre la copia representativa adoptada

El inventario inicial detectó cuatro findings:

- una fila de `_ImageToWorldItem` tiene roto el extremo Image y también el extremo WorldItem;
- 2 filas de `Metadata` no resuelven su target polimórfico;
- 17 filas de `EntityAggregates` no resuelven su target polimórfico.

Durante `0001`, el único link `_ImageToWorldItem` inválido se eliminó de forma idempotente porque ambos extremos habían
desaparecido. El rehearsal posterior a `0002` conserva exactamente dos findings polimórficos: 2 filas de Metadata y 17
de EntityAggregates. No se inventó un target ni se eliminó contenido manual.
