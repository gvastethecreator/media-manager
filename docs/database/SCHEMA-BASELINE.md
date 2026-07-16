# Baseline reproducible de SQLite

## Fuente de verdad

La única cadena canónica es:

1. `src/lib/drizzle/schema/index.ts` declara el modelo vigente.
2. `src/lib/drizzle/migrations/` contiene SQL, journal y snapshot versionados.
3. `src/lib/drizzle/schema-contract.json` fija el fingerprint de los objetos administrados.
4. `scripts/db/migrations.ts` aplica y verifica esa historia.

El DDL sin filas capturado desde la copia histórica se conserva en `docs/database/representative-schema.sql`; fue
generado por `scripts/db/export-schema.ts`, que falla cerrado si encuentra objetos desconocidos y no incluye path fuente.

`drizzle/migrations/` dejó de ser una segunda fuente. Su migración de índices fue absorbida en el schema: los índices
simples necesarios se conservaron y los compuestos `folderId + hash`, junto con `Folder.parentId`, ahora son declarativos.
El plan SQL histórico de `Asset` que estaba ignorado no se adoptó: creaba un modelo incompleto y dejaba la migración de
datos comentada. Fue reemplazado posteriormente por el modelo mínimo versionado `Asset + MediaRoot + SourceFile`, con
invariantes y compatibilidad verificadas sobre bases descartables.

## Inventario reproducible

El contrato vigente contiene 63 tablas administradas, incluidos los junctions, y sus índices declarados. El gate
normaliza el DDL de `sqlite_schema`, calcula SHA-256 por objeto y un fingerprint del conjunto completo. Un objeto esperado
ausente o modificado y cualquier objeto extra no clasificado hacen fallar `db:check`.

La copia representativa verificada de la base histórica contiene 69 tablas. El baseline inicial contenía 58 tablas;
las migraciones posteriores añadieron dos bridges canónicos y las tres tablas del media core. La copia histórica también
contiene extensiones FTS5, tablas legacy de Task y tablas operativas locales. Por eso los conteos no son una equivalencia
directa y no autorizan a adivinar ni a borrar tablas. La clasificación aplicada sobre el backup fue:

- `managed`: objeto presente en el contrato versionado;
- `extension`: `sqlite_*`, historial del runner o tablas auxiliares de FTS5;
- `legacy`: nombres históricos conocidos de Task o del intento no consumado de Asset Root;
- `unknown`: requiere decisión manual y hace fallar el gate.

No se modificó `db.sqlite`. La comparación y adopción se ejecutaron sobre artefactos externos al workspace:

- backup restaurable: 69 tablas, `PRAGMA quick_check = ok`, SHA-256 verificado antes y después;
- drift conocido: DDL/índices históricos de `Favorite` y ocho índices compuestos/de jerarquía ausentes;
- drift permitido sin borrado: Task/junctions legacy y FTS5;
- resultado adoptado: 70 tablas, incluida `__media_manager_migrations`, `integrity_check = ok`, 0 violaciones FK,
  baseline aplicado y 0 objetos administrados faltantes, cambiados o desconocidos;
- conteos de dominio preservados; sólo se eliminan filas de bridges sin ambos owners, con delta calculado antes de migrar.

La copia adoptada es evidencia de compatibilidad, no un reemplazo automático de la base del usuario.

## Migraciones de integridad posteriores al baseline

- `0001_relational_integrity.sql` reconstruye las tablas afectadas con políticas FK explícitas, checks y defaults epoch-ms.
  La directiva del runner desactiva FKs sólo fuera de la transacción de rebuild, las reactiva y ejecuta
  `foreign_key_check` antes de aceptar el resultado. Sólo elimina junctions cuyos dos extremos técnicos ya no existen;
  no repara por inferencia Metadata ni EntityAggregates polimórficos.
- `0002_queue_idempotency.sql` añade `QueueJob.idempotencyKey` y la unicidad `(queue,idempotencyKey)` sin inventar keys
  para filas históricas.
- `0003_epoch_ms_normalization.sql` convierte texto/segundos/reales heredados en todos los campos `timestamp_ms` y aborta
  si queda cualquier valor no nulo que no sea un entero epoch-ms.
- `0004_canonical_asset_source.sql` crea `Asset`, `MediaRoot` y `SourceFile` sin migrar ni borrar filas legacy. Impone
  lifecycle singular, primary source perteneciente al mismo asset, root + relative path, disponibilidad y fingerprints;
  las dos FKs cíclicas son diferidas para que el par Asset/SourceFile nazca atómicamente.
- `0005_image_asset_link.sql` reconstruye sólo `Image` para añadir el enlace expand-contract `assetId`. Copia toda fila
  legacy con `assetId = NULL`, conserva sus junctions, exige unicidad y `Image.id = Image.assetId` cuando se enlaza, y no
  crea Asset/Source por inferencia. El backfill de datos es un comando copy-only separado y requiere roots explícitos.

Drizzle Kit no puede serializar `DEFERRABLE` para SQLite. Por eso el snapshot tipado no declara las dos FKs cíclicas y
la migración SQL versionada las añade como extensión explícita. Esto no queda confiado a una nota: el runner valida el
DDL final dentro de la misma transacción y hace rollback si cualquiera deja de ser `DEFERRABLE INITIALLY DEFERRED`;
también exige que la clave locacional conserve `COLLATE NOCASE`.

El rehearsal final de Wave 1 partió de la copia adoptada en versión 1, creó backup+manifest v2, aplicó hasta la versión 4
en outputs nuevos y terminó con `integrity_check=ok`, 0 violaciones FK y 0 drift administrado. Las diferencias fueron
exactamente las diseñadas: el link huérfano `_ImageToWorldItem` pasó de 1 a 0, se crearon vacías `_AlbumToPlace` y
`_CharacterToPlace`, y `__media_manager_migrations` pasó de 1 a 4. Todos los demás conteos se preservaron. Los 2 Metadata
y 17 EntityAggregates polimórficos conocidos siguen preservados y clasificados para reconciliación manual.

El checkpoint de MODEL-002 repitió adopción y upgrade con la historia completa hasta versión 5. Las tres tablas nuevas
nacieron vacías, los conteos legacy se preservaron salvo el link huérfano previamente catalogado y los contratos de
migración, schema e integridad referencial terminaron verdes. La base real no participó de este rehearsal.

MODEL-003 amplió una fixture legacy equivalente de versión 5 a 6 y probó que la fila Image, su ID/path y el junction
`_ImageToAlbum` permanecen exactos con `foreign_key_check = 0`. El CLI de backfill se ejecuta sobre una base descartable:
la fuente queda byte-idéntica, el backup externo se verifica y sólo se publica una salida reconciliada. Sin un mapping de
roots suministrado por el operador, la base real no se backfillea ni se usa para inferir ownership físico.

## Objetos fuera de Drizzle

- FTS5 (`media_fts` y tablas/triggers auxiliares) se crea actualmente en runtime cuando el módulo está disponible. Se
  clasifica como extensión sólo si la virtual table y cada trigger presente coinciden con hashes DDL canónicos; un nombre
  allowlisted con SQL alterado falla el gate. Su migración completa a DDL versionado pertenece al paquete de búsqueda/FTS.
- `src/lib/drizzle/constraints.ts` contiene triggers de compatibilidad que no forman parte del baseline ejecutado. No se
  presentan como constraints activos hasta tener migración y prueba propias.
- La tabla `__media_manager_migrations` pertenece al runner y se excluye del contrato del dominio.

## Comandos seguros

Todos los comandos exigen `DATABASE_URL` o `--database`; no hay fallback implícito a `db.sqlite`.

```bash
bun run db:plan -- --database C:/tmp/media-manager-copy.sqlite
bun run db:status -- --database C:/tmp/media-manager-copy.sqlite
bun run db:migrate -- --database C:/tmp/media-manager-new.sqlite
bun run db:adopt-legacy -- --backup C:/backup/media-manager.sqlite --manifest C:/backup/media-manager.sqlite.manifest.json --output C:/rehearsal/media-manager-adopted.sqlite
bun run db:check -- --database C:/tmp/media-manager-new.sqlite
bun run db:orphans -- --database C:/tmp/media-manager-copy.sqlite
bun run db:upgrade -- --database C:/tmp/media-manager-copy.sqlite --backup-dir D:/Backups/MediaManager --output C:/tmp/media-manager-next.sqlite --root-id library --json
bun run db:image:backfill -- --database C:/tmp/media-manager-copy.sqlite --backup-dir D:/Backups/MediaManager --output C:/tmp/media-manager-image-canonical.sqlite --roots D:/private/media-roots.json --json
bun run db:image:reconcile -- --database C:/tmp/media-manager-image-canonical.sqlite --roots D:/private/media-roots.json
bun run db:schema:export -- --database C:/tmp/media-manager-copy.sqlite --output docs/database/representative-schema.sql
bun run db:schema:check
```

`db:migrate` sólo inicializa una base nueva o comprueba una base ya actual; su preflight readonly exige que
`user_version` coincida exactamente con la cantidad de migraciones registradas y, si ya está current, valida el schema
antes de activar WAL. Una base existente con migraciones pendientes debe usar `db:upgrade`, que conserva origen y backup
y publica un output separado. Una base no vacía sin historial es rechazada por el runner normal. `db:adopt-legacy` es una
ruta separada y fail-closed:
exige un backup con manifest válido, crea un output nuevo fuera del workspace, rechaza objetos desconocidos, favoritos
sin perfil/duplicados y cualquier delta no explicado. Sólo reconstruye el DDL histórico conocido de `Favorite`, crea los
ocho índices aditivos, calcula el conteo esperado tras quitar bridges sin owners y registra el baseline dentro de
`BEGIN IMMEDIATE`. Nunca sobrescribe el backup ni el output.

`media-roots.json` contiene paths físicos y por eso debe permanecer fuera del repositorio. El backfill usa exactamente el
validator runtime de roots/referencias antes de crear backup/output y vuelve a validar cada path derivado. Sin roots,
`db:image:reconcile` sólo informa consistencia estructural con `pathVerification = not_verified`; con roots existentes
puede afirmar `dataConsistent` y `pathVerification = verified`. Esas señales no autorizan retiro: el CLI no posee un
`retirement gate` porque aún faltan checkpoints runtime persistidos y evidencia de uso.
