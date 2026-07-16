# Waves 3–4 — Modelo canónico y recuperación de flujos originales

Resultado: la arquitectura aceptada gobierna datos reales y los flujos de usuario trabajan sobre una sola fuente de verdad.
Requiere runtime y persistencia estables; se ejecuta por vertical slice, nunca como migración global simultánea.

## Wave 3 — Modelo canónico

### MODEL-001 — Vocabulario e invariantes

- [x] Confirmar definitions de Asset, Source File, Placement, Primary Placement, Folder, Album y Collection.
- [x] Resolver identidad: hash, source path, duplicate content, rename/move y múltiples roots.
- [x] Definir qué sobrevive si desaparece un archivo fuente.
- [x] Definir ownership de metadata derivada vs authored.
- [x] Publicar ADR complementario sólo para decisiones no cubiertas por 0004/0006. No hizo falta: 0004/0006 cubren la decisión y el detalle ejecutable quedó en el contexto.

### MODEL-002 — Schema mínimo de Asset

- [x] `Asset` estable, agnóstico al tipo, con lifecycle/status.
- [x] `SourceFile` con root + relative path, identity, stat/hash y disponibilidad.
- [x] `Placement` se materializa como `SourceFile`: organización en `folderId` y primary authority única en
      `Asset.primarySourceFileId`, sin booleano duplicado.
- [x] El schema común no replica metadata media-specific; la conexión de entidades legacy se hace por vertical slice.
- [x] Índices para lookup por source/hash/type/status/placement, incluida unicidad locacional `NOCASE`.

### MODEL-003 — Primera vertical slice

- [x] Elegir imagen como primer tipo por cobertura existente.
- [x] Migrar copia representativa: crear Asset/Source/Placement sin borrar legacy.
- [x] Dual-read controlado con comparación; evitar dual-write indefinido.
- [x] API/DTO/UI de imagen usa IDs canónicos.
- [x] Reconciliación reporta divergencias y no emite señal de retiro.
- [ ] Retirar columnas/paths legacy sólo tras dos checkpoints verdes.

### MODEL-004 — Expandir a video/audio/document/json/file3d

- [x] Repetir migration + reconcile + consumer cutover por tipo.
- [x] Conservar metadata específica sin contaminar Asset.
- [x] Validar thumbnails/viewers y formatos ausentes/corruptos.
- [x] Medir performance de joins y ajustar índices.

Checkpoint aceptado 2026-07-16: las cinco familias usan Asset/SourceFile y lifecycle común; create/update públicos son
source-only; reindex por Folder, viewers, derivados, stats y hash lookup aplican autorización canónica; backfill/reconcile
es copy-only y verifica archivos reales. Evidencia: 18 tests focales, 176 tooling únicos, 666 app tests, TSC/lint/schema/
build/diff verdes, DB real inmutable y revisión independiente `ACCEPT`. El retiro de columnas legacy sigue bloqueado por
los dos checkpoints runtime reales definidos en el ledger.

### FAV-001 — Favoritos canónicos por perfil

- [ ] Tabla/constraint única profile + entity/asset identity.
- [ ] List/toggle/set/unset comparten servicio y semántica idempotente.
- [ ] DTO `isFavorite` se hidrata desde fuente canónica.
- [ ] Corregir consumidores actuales y sus 24 fallas.
- [ ] Retirar facades `/:id/favorite` tras telemetría/migración de clientes.
- [ ] Eliminar proyecciones legacy como autoridad.

### REL-001 — Relaciones híbridas

- [ ] Catálogo de relaciones tipadas y reglas por contexto.
- [ ] Junctions fuertes para relaciones críticas/consultadas.
- [ ] Modelo flexible sólo donde el dominio lo requiere.
- [ ] Constraints, cascades y queries inversas.
- [ ] Migración/reconciliación de junctions existentes.

### TAX-001 — Taxonomía file-backed

- [ ] Delimitar texto file-backed vs metadata DB.
- [ ] Atomic write, encoding, conflict/version y rename/delete.
- [ ] Index/search derivado reconstruible.
- [ ] Recovery si archivo y DB divergen.
- [ ] Tests en roots temporales y compatibilidad Windows.

## Wave 4 — Flujos de producto

Cada flujo debe cubrir success, loading, empty, partial failure, retry, cancellation, restart y copy/layout fit. La evidencia
incluye unit/integration, API y browser cuando el usuario lo ve.

### FLOW-001 — Registrar y administrar media roots

- [ ] Selección de root, permisos y validación.
- [ ] Detección de overlap/nesting/duplicados.
- [ ] Offline/unmounted/network share states.
- [ ] Retiro de root sin borrar assets por accidente.
- [ ] Reasociación cuando cambia letra/path.

### FLOW-002 — Ingesta y file mapping

- [ ] Pipeline explícito discover → stat → validate → hash → classify → persist → metadata → thumbnail.
- [ ] Límite de tamaño antes de hash y lectura streaming.
- [ ] Duplicados por content/source con política visible.
- [ ] Unsupported/corrupt/quarantined con reason code.
- [ ] Idempotencia tras crash/retry.
- [ ] Corpus fixture por tipo y archivos adversariales.

### FLOW-003 — Reindex incremental

- [ ] Contrato full vs incremental.
- [ ] Detectar create/change/rename/move/delete sin falsos positives.
- [ ] Hash cache válida y fallback cuando timestamps no son confiables.
- [ ] Checkpoint/restart y progress exacto.
- [ ] No eliminar registros por error temporal de acceso.
- [ ] Benchmarks 1k/10k/100k.

### FLOW-004 — Thumbnails y derivados

- [ ] Servicio único por request/cache/status/error.
- [ ] Quality/size contract y content hash invalidation.
- [ ] Sharp/FFmpeg/Mediabunny ownership claro.
- [ ] Queue bounded, retry/backoff y cancel.
- [ ] Placeholder/error/retry visible.
- [ ] Limpieza segura de derivados huérfanos.

### FLOW-005 — Búsqueda, filtros y navegación

- [ ] Query contract único y validado.
- [ ] FTS compatible con migraciones/backup.
- [ ] Filtros por type/root/folder/taxonomy/favorite/status.
- [ ] Sort estable, pagination/cursor y counts coherentes.
- [ ] Debounce/cancel y URL/state restoration.
- [ ] Performance sobre corpus grandes.

### FLOW-006 — Viewer por tipo

- [ ] Imagen: zoom/pan/color/profile/original availability.
- [ ] Video/audio: streaming/range, metadata, waveform, error codec.
- [ ] PDF/text/JSON: sanitización, límites, encoding y large file fallback.
- [ ] 3D: recursos, dispose, fallback y formato unsupported.
- [ ] Navegación anterior/siguiente conserva query/selection.
- [ ] Missing/offline source recovery.

### FLOW-007 — Organización y metadata

- [ ] Folder/album/collection/group semantics no se solapan silenciosamente.
- [ ] Multi-select/batch con preview, progress, partial failure y retry.
- [ ] Tags/properties/notes/prompts/worldbuilding sobre relaciones canónicas.
- [ ] Optimistic updates con rollback.
- [ ] Profile scoping y favorite consistency.

### FLOW-008 — Operaciones filesystem + undo/redo

- [ ] Copy/move/rename/delete/create sólo mediante root policy.
- [ ] Plan previo con conflicts, overwrite policy y espacio requerido.
- [ ] Journal de intents + compensación FS/DB.
- [ ] Trash/quarantine antes de delete permanente cuando sea posible.
- [ ] Undo valida precondiciones actuales; no pisa cambios externos.
- [ ] Crash injection y recovery en cada fase.

### FLOW-009 — Batch y progress

- [ ] Un modelo de job/status/progress para UI y servidor.
- [ ] Pending/running/paused/completed/failed/cancelled con transiciones válidas.
- [ ] Progress monotónico y total conocido/desconocido.
- [ ] Cancel cooperativo; pause real o retirar opción.
- [ ] Persistence/recovery de jobs largos.

### FLOW-010 — Descargas y export

- [ ] Original usa endpoint real y root/asset authorization.
- [ ] ZIP válido generado por librería mantenida o streaming archive.
- [ ] PDF válido con definición de layout/metadata; si no, retirar opción.
- [ ] Filename/content disposition/Unicode correctos.
- [ ] Batch con progress, cancel, cleanup y espacio insuficiente.
- [ ] Tests abren artefacto con parser independiente.

### FLOW-011 — Settings y profiles

- [ ] Un schema de settings con defaults/version/migration.
- [ ] Validación y recovery de storage corrupto.
- [ ] Scope global vs profile explícito.
- [ ] Settings sin implementación se ocultan o marcan experimental.
- [ ] Export/import sanitizado y compatible.

## Retirement ledger obligatorio

Por cada vertical slice registrar:

- Contrato legacy y consumidores encontrados.
- Adapter de compatibilidad y fecha/condición de retiro.
- Métrica o scan que prueba uso cero.
- Migración/reconciliación de datos.
- Commit que elimina facade/column/client.
- Docs/ADR actualizados.

No se acepta “deprecated” indefinido.

## Waves 3–4 exit gate

- [ ] Asset/source/placement canónicos para todos los media types soportados.
- [ ] Favorite consistency y relations checks verdes.
- [ ] Ingest/reindex/thumbnail/search/viewer/organize/file ops/export tienen E2E crítico.
- [ ] Crash/restart y partial failure probados en jobs y file ops.
- [ ] Proyecciones/clients/endpoints legacy críticos retirados o con fecha y evidencia de uso restante.
- [ ] Corpus 1k/10k pasa budgets definidos; 100k tiene resultado medido y plan si aún no cumple.
