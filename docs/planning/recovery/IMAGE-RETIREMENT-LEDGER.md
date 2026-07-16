# Ledger de retiro — Image legacy → Asset/SourceFile

Estado: expand-contract activo; ningún campo legacy autorizado para retiro.

## Contrato legacy y consumidores

La tabla `Image` todavía posee `id`, `name`, `path`, `hash`, `size`, `folderId`, timestamps, favoritos y metadata. Sus IDs
siguen siendo extremos de los junctions de álbumes, colecciones, grupos, taxonomía y worldbuilding. Los consumidores
encontrados incluyen:

- `ImageService` y `/api/images` para CRUD, favoritos, folders, hash y thumbnails;
- relaciones de Album/Collection/Tag y los filtros de autorización de media;
- mapper/reindex, file operations move/rename y generación/lectura de derivados;
- transformers, converter y tipos `ImageBase` que alimentan cards, grids y viewer;
- scripts de adopción, inventario, export, backup/upgrade y fixtures de seguridad.

Eliminar o reinterpretar esas columnas antes de migrar cada consumidor rompería junctions, URLs y recovery. El primer
corte por eso conserva el registro completo y sólo añade `Image.assetId`.

## Adapter de compatibilidad

- Filas históricas: `assetId = NULL`, `canonicalState = legacy_only`, ID público legacy sin falsificar equivalencia.
- Filas nuevas/backfilleadas: `Image.id = Image.assetId = Asset.id`; DTO/API publica Asset Identity y conserva
  `legacyId` únicamente como diagnóstico.
- Dual-read: `projectCanonicalImages` compara Asset/Source con Image y expone `canonical | legacy_only | diverged` más
  `canonicalDivergences`; las métricas de proceso cuentan cada estado.
- Acceso físico: `resolveMediaAssetReference` usa SourceFile y falla con `ROOT_PATH_CONFLICT` si identidad, tipo, título,
  hash, size, folder o path legacy no coinciden. Toda autorización de Image usa esa referencia aunque el DTO conserve
  `path`; un Asset tombstoned queda fuera de las superficies normales.
- Dual-write acotado: create y las mutaciones canónicas actualizan todas las tablas dentro de una transacción; no existe
  una cola eventual que pueda dejar dos verdades indefinidamente.
- Reindex/open-file detection actualiza `Image.hash/size` y `SourceFile.contentHash/byteSize` en la misma transacción.
- Ausencia física: sync marca sólo el `SourceFile` primario observado como `missing`; no borra Image, Asset ni authored
  relations ni sobre-marca fuentes secundarias. Si el archivo reaparece, el mismo sync devuelve el primario a `available`.
- Lifecycle: DELETE normal crea un tombstone `Asset.status = deleted`; restore recupera el estado previo. Purge físico no
  forma parte de este slice ni se disfraza detrás de `force`.
- Proyección pública: el mismo predicado lifecycle excluye tombstones de Folder/preview, Album, Collection, Tag,
  Character, Concept, Place, Prompt, WorldItem, Note, folder-files/stream, thumbnails, búsqueda, stats y navegación.
  Los guards destructivos conservan conteos raw para impedir que una relación authored oculta sea purgada por accidente.
- Contrato público de create: exige `source { rootId, relativePath }`; el path absoluto sólo existe en el comando interno
  resuelto por el servidor.

## Migración y reconciliación

`0005_image_asset_link.sql` sólo expande el schema. `db:image:backfill`:

1. exige source, backup externo, output nuevo y JSON de roots explícitos;
2. valida roots locales, permisos y cada referencia derivada con el mismo contrato que usa el runtime;
3. crea y verifica backup, restaura a staging y migra la salida;
4. preflighta todas las Image y deriva location sólo desde el mapping entregado;
5. inserta MediaRoot/SourceFile/Asset y enlaza Image en un `BEGIN IMMEDIATE` idempotente;
6. reconcilia dentro de la transacción y publica únicamente si los datos quedan consistentes y los paths verificados.

La fuente nunca se modifica. Si falla la copia canónica, el output se elimina y fuente+backup permanecen. Los reportes no
serializan paths de las filas; identifican divergencias por ID técnico.

## Retiro: deliberadamente sin gate ejecutable todavía

`dataConsistent = true` y `pathVerification = verified` describen una copia en un instante; no son una señal de retiro. El
antiguo `--retirement-gate` fue eliminado porque podía quedar verde en el mismo backfill inicial. Antes de que exista un
evaluador de retiro deberán persistirse dos checkpoints runtime posteriores, distintos por ID, tiempo y digest de base,
ambos con la siguiente evidencia:

- reconciliación con `legacyOnly = 0`, `divergent = 0`, `orphanCanonical = 0`, `dataConsistent = true` y
  `pathVerification = verified` sobre la candidata;
- métricas de dual-read con cero `legacy_only` y cero `diverged` durante el corpus/runtime representativo;
- evidencia de cero consumidores legacy autoritativos observados durante una ventana registrada;
- scan de consumidores que demuestre cero lectura/escritura autoritativa de las columnas a retirar;
- junctions y endpoints migrados o adaptados con pruebas de identidad estable;
- backup/restore/rollback repetidos sobre la candidata y segundo checkpoint independiente aceptado;
- commit futuro que enumere exactamente facade, columna, cliente y documentación retirados.

MODEL-003 no crea automáticamente el primer checkpoint: sólo deja preparado el mecanismo de consistencia. MODEL-004 no
elimina deuda de Image y tampoco cuenta como checkpoint por proximidad. `deprecated`, un backfill exitoso o dos ejecuciones
idénticas sin ventanas runtime independientes no autorizan borrar nada.

## Evidencia ejecutable actual

- `scripts/db/image-asset-link-schema.test.ts`: expansión nullable, FK/unicidad/identidad y legacy intacto.
- `scripts/db/migrations.test.ts`: upgrade 0004→0005 con Image y `_ImageToAlbum` preservados.
- `scripts/db/image-asset-reconciliation.test.ts`: backfill/idempotencia, preflight atómico, divergencia, validación runtime
  de roots/referencias, CLI copy-only, fuente byte-idéntica y ausencia deliberada de retirement gate.
- `scripts/authorized-file-mutation.test.ts`: recovery fail-closed si ubicación canónica y legacy divergen.
- `scripts/image-canonical-media-reference.test.ts`: source canónico, move/rename atómico y fail-closed ante divergencia.
- `scripts/image-canonical-http.test.ts`: create opaco, mutación de placement rechazada, tombstone/restore, thumbnails y
  preview SVG lifecycle-aware, sin bypass por path legacy.
- `scripts/image-canonical-root-registry.test.ts`: roots opacos, sync path-free y ausencia de regresión cross-media.
- `src/services/image/__tests__/image.service.effect.test.ts`: create/read/update, fingerprints atómicos,
  disponibilidad multi-source/subtree sin pérdida, tombstone/restore sistémico, batch lifecycle e idempotencia de ubicación.
- `tests/unit/transformers/image.transformer.spec.ts`: Asset Identity hasta el DTO/UI.

La evidencia de una base real backfilleada no existe todavía porque no hay mapping de roots configurado. Esto es una
precondición operativa explícita, no permiso para inferir roots desde paths históricos.

Checkpoint de implementación MODEL-003: revisión independiente `ACCEPT`; Image 61/61; tooling 147/147; Vitest 675/675;
TSC, lint, schema, build y DB real inmutable verdes. El format global sigue rojo por deuda histórica fuera de este slice;
los archivos tocados pasan el formatter del repositorio.
