# Ledger de retiro — Video/Audio/Document/JsonFile/File3D → Asset/SourceFile

Estado: expand-contract activo. El cutover runtime está implementado; ninguna columna legacy está autorizada para retiro.

## Contrato común ya aplicado

La migración `0006_media_specialization_asset_links.sql` añade un `assetId` nullable, único y de identidad exacta a las
cinco tablas. Las filas históricas continúan como `legacy_only`; las nuevas y backfilleadas cumplen
`Entity.id = Entity.assetId = Asset.id`. La metadata específica sigue en su especialización y `Asset` sólo posee
identidad, título, lifecycle y primary source.

Los cinco servicios dedicados ahora comparten el kernel `canonical-media-persistence`:

- create exige una source opaca autorizada y crea `SourceFile + Asset + especialización` atómicamente;
- read compara la proyección común y expone `canonical | legacy_only | diverged` sin fingir equivalencia;
- update sincroniza título, fingerprint, placement y compatibilidad en la misma transacción;
- delete crea tombstone y restore conserva la identidad incluso cuando el archivo físico está ausente;
- autorización, move/rename, viewers/previews, lists y filesystem sync respetan SourceFile y lifecycle;
- el sync marca disponibilidad del source primario; no borra entidades canónicas ni authored relations.

La ingestión usa identidad de ubicación `(rootId, relativePath COLLATE NOCASE)`. Un hash de contenido sólo es fingerprint:
dos paths autorizados con bytes idénticos crean dos Assets distintos, mientras que repetir la misma ubicación es
idempotente. El mapper deriva la source configurada para Image, Video, Audio, Document, JsonFile y File3D antes de entrar
al processor; ningún processor puede aceptar un path físico sin esa prueba.

El filesystem sync exige un `AuthorizedRootRegistry`: autoriza el Folder y, para filas canónicas, resuelve sólo
`Asset.primarySourceFileId -> SourceFile(rootId, relativePath)`. `Entity.path` queda como proyección de compatibilidad y
puede divergir sin alterar la decisión física. Las filas aún legacy sólo se toleran si su path puede revalidarse dentro
del Folder autorizado. Además, una SourceFile resuelta dentro del root debe permanecer físicamente dentro del Folder que
declara la operación; cualquier drift persistido falla cerrado. Los errores de integridad no se convierten en ausencias.

El reindex público disponible es exclusivamente `POST /folders/:id/reindex`: usa el registry ligado a la solicitud,
reautoriza read+index y sincroniza cada Folder físico mediante SourceFile. El global sin scope permanece retirado con 410.
Las opciones legacy `skipMetadata/skipThumbnails` reciben 400 porque la ingesta canónica es completa; el summary ya no
publica contadores de derivados que el orquestador no puede observar con precisión.

Un root offline o un error de scan no autoriza borrar ni saltar el Folder: conserva Asset/SourceFile y aborta. Los Folders
descubiertos se insertan sólo cuando llega su sync; una excepción previa no deja estructura fantasma y los sources de
descendientes físicamente ausentes se marcan `missing` sólo después de completar los scans autorizados.

Entre autorización y uso, FileSync y reindex comprueban también el canal de error propio de `scanFolder`. El reindex
reautoriza read+index con el mismo registry de la operación y escanea la ruta absoluta resuelta; una desaparición en esa
ventana aborta sin convertirla en carpeta vacía ni mutar disponibilidad con evidencia incompleta.

Las estadísticas unificadas de derivados resuelven cada `(rootId, relativePath)` bajo los permisos actuales de la
solicitud; un `rootId` persistido no basta para incluir una fila. Las consultas por hash cargan candidatos deterministas y
filtran autorización antes de seleccionar, porque contenido duplicado ya no implica identidad única.

Las rutas públicas de Document, JSON y File3D dejaron de usar las implementaciones duplicadas del antiguo mega-service y
consumen sus servicios dedicados. Los hooks y clientes tipados de las cinco familias exigen `source {rootId,
relativePath}` y no aceptan `path` como input público. Video y Audio actualizan por PATCH, coherente con sus routers.

## Backfill y reconciliación copy-only

`db:media:backfill` opera exclusivamente sobre una salida nueva y `db:media:reconcile` exige database más roots
explícitos. La verificación física sólo pasa si cada ubicación resuelve a un archivo real cuyo tamaño coincide con
SourceFile y la proyección de compatibilidad:

1. exige source, backup externo, output y mapping de roots explícito fuera del repositorio;
2. valida todas las filas y paths con el mismo contrato del runtime antes de escribir;
3. detecta colisiones de ID entre familias, Image o Asset existentes y falla sin cambios parciales;
4. crea `MediaRoot`, `SourceFile`, `Asset` y cada link exacto dentro de `BEGIN IMMEDIATE`;
5. reconcilia por familia y verifica paths sobre un sibling `media-backfill-partial-*`;
6. hace checkpoint del WAL y publica el nombre final de forma atómica y no destructiva sólo después del gate verde;
7. limpia main/WAL/SHM/journal parciales si falla y nunca modifica la source.

```bash
bun run db:media:backfill -- --database C:/tmp/media-manager-copy.sqlite --backup-dir D:/Backups/MediaManager --output C:/tmp/media-manager-media-canonical.sqlite --roots D:/private/media-roots.json --json
bun run db:media:reconcile -- --database C:/tmp/media-manager-media-canonical.sqlite --roots D:/private/media-roots.json
```

La base real no se backfilleó: no existe un mapping de roots suministrado por el operador y está prohibido inferir
ownership desde paths históricos. Toda prueba usa bases descartables creadas desde migraciones.

## Estado por familia

| Familia  | Service/API cutover | Viewer/preview              | Lifecycle                 | FS sync                   | Backfill/reconcile |
| -------- | ------------------- | --------------------------- | ------------------------- | ------------------------- | ------------------ |
| Video    | completo            | thumbnail/reference probado | tombstone/restore probado | missing/available probado | incluido           |
| Audio    | completo            | waveform probado            | tombstone/restore probado | contrato común            | incluido           |
| Document | servicio dedicado   | preview probado             | tombstone/restore probado | contrato común            | incluido           |
| JSON     | servicio dedicado   | preview probado             | tombstone/restore probado | missing/available probado | incluido           |
| File3D   | servicio dedicado   | thumbnail probado           | tombstone/restore probado | contrato común            | incluido           |

## Evidencia y condiciones de retiro

- `media-specialization-asset-link-schema.test.ts`: FK, unicidad e identidad exacta de las cinco tablas.
- `media-specialization-asset-reconciliation.test.ts`: cinco familias, idempotencia, atomicidad, colisiones —incluida
  Image—, divergencia, publicación final tardía, cleanup de sidecars, CLI copy-only y source byte-idéntica.
- `media-specialization-canonical-reference.test.ts`: autorización y move/rename atómico de las cuatro ramas posteriores a
  Video, incluidos fail-closed y tombstones.
- `media-specialization-query-plan.test.ts`: joins por identidad y el orden real `(createdAt, id)` por folder usan
  índices dedicados, sin `TEMP B-TREE FOR ORDER BY`.
- `media-ingestion-canonical.test.ts`: diez archivos físicos, cinco pares de contenido idéntico, producen diez identidades
  canónicas; la ubicación repetida es la única que se considera ya indexada.
- HTTP: Video, Audio, Document, JSON y File3D prueban create opaco, rechazo de raw path, viewer lifecycle y restore con
  archivo ausente. Document decodifica su base64 persistido; JSON/File3D decodifican sus envelopes y los tres sirven SVG
  UTF-8 exacto con CSP y `nosniff`.
- `reindex-canonical-sync.test.ts`: el endpoint público usa el registry de la solicitud, registra `missing`, rechaza flags
  no soportados, falla cerrado y no publica Folders descubiertos tras una excepción.
- `media-hash-authorization.test.ts` y `media-specialization-thumbnail-stats.test.ts`: candidatos duplicados y agregados
  se limitan por SourceFile realmente resoluble/autorizado, no por orden de consulta ni rootId nominal.
- suites dedicadas: conservan metadata específica y los bridges legacy todavía soportados.

Ninguna señal anterior autoriza retirar columnas. Se requieren dos checkpoints runtime independientes con roots reales,
cero `legacyOnly`, `divergent`, `orphanCanonical` e `identityCollisionIds`, path verification, telemetría de cero autoridad
legacy, scan de consumidores, rollback ensayado y un commit que enumere cada columna/facade retirada. Un backfill verde y
su repetición inmediata cuentan como una sola observación, no como dos checkpoints.
