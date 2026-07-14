# Wave 1 — Persistencia reproducible e integridad

Resultado: un checkout limpio construye el mismo esquema, migra datos representativos sin pérdida y puede restaurarse.
Wave 0 debe estar verde; ninguna tarea escribe sobre la DB original sin backup y ensayo sobre copia.

## Paquete 1A — Baseline y ownership del schema

### DB-001 — Elegir una sola ubicación de migraciones

- [ ] Adoptar `src/lib/drizzle/migrations/` o `drizzle/migrations/`, no ambas.
- [ ] Quitar ignore de la ruta elegida y versionar SQL, journal y snapshots necesarios.
- [ ] Configurar Drizzle, scripts, Tauri y CI contra esa ruta.
- [ ] Eliminar/copiar con historia explícita la migración huérfana `0002_add_reindex_indexes.sql`.
- [ ] Validar nombres y orden monotónico.

### DB-002 — Capturar baseline real

- [ ] Exportar DDL de una copia representativa sin datos personales.
- [ ] Comparar 69 tablas reales contra 41 tablas Drizzle y clasificar: vigente, legacy, FTS/internal, huérfana.
- [ ] Documentar columnas, indexes, triggers y virtual tables que Drizzle no modela.
- [ ] Crear baseline que reproduce una instalación nueva.
- [ ] Crear schema fingerprint estable y gate de drift.

**Proof:** DB vacía creada desde cero coincide con fingerprint esperado.

### DB-003 — Runner de migraciones productivo

- [ ] Implementar `db:migrate`, `db:status`, `db:check` y `db:plan`.
- [ ] Lock para evitar dos migraciones concurrentes.
- [ ] Registro de versión/checksum y rechazo de migraciones modificadas.
- [ ] Transacción por migración cuando SQLite lo permita.
- [ ] Errores con rollback y código no-cero.

### DB-004 — Reemplazar copia de DB en tests

- [ ] Crear DB temporal desde baseline/migraciones.
- [ ] Seeds pequeños deterministas por suite.
- [ ] Fixtures por dominio; no depender del contenido de usuario.
- [ ] Reducir setup de 215 s y environment de 304 s observados.
- [ ] Mantener guard contra DB real incluso después de migrar.

## Paquete 1B — Integridad referencial

### DB-005 — Inventario de relaciones y huérfanos

- [ ] Generar catálogo de relaciones esperadas desde schema/servicios.
- [ ] Queries read-only para huérfanos por junction/FK conceptual.
- [ ] Clasificar repair automático, cuarentena o decisión manual.
- [ ] Guardar sólo conteos/IDs técnicos en reportes; no contenido personal.

### DB-006 — Introducir foreign keys por dominio

- [ ] Activar `PRAGMA foreign_keys=ON` en todas las conexiones y tests.
- [ ] Añadir `.references()` y políticas `ON DELETE/UPDATE` explícitas.
- [ ] Orden: profiles/settings → folders/files/assets → organization → taxonomy → worldbuilding → junctions.
- [ ] Migrar/reconstruir tablas SQLite con backup y reconciliación.
- [ ] Añadir `foreign_key_check` a CI y startup diagnostic.

### DB-007 — Constraints e invariantes

- [ ] Unicidad de paths/identity según root y source.
- [ ] Checks para enums/status, tamaños no negativos y rangos.
- [ ] Unicidad/canonicalización de favorites por profile/type/entity.
- [ ] Primary placement único por asset.
- [ ] Junctions sin duplicados y con índices en ambas direcciones.

### DB-008 — Timestamps y tipos

- [ ] Inventariar `CURRENT_TIMESTAMP` en columnas `integer(timestamp_ms)`.
- [ ] Elegir epoch ms como contrato y migrar defaults/datos.
- [ ] Normalizar timezone/serialización en DTOs.
- [ ] Tests de roundtrip y orden temporal.

## Paquete 1C — Atomicidad y recuperación

### DB-009 — Fronteras transaccionales

- [ ] Mapear operaciones que escriben más de una tabla/FS+DB.
- [ ] Añadir transacciones a favorites, relations, ingest, move/delete, reindex y cleanup.
- [ ] Para FS+DB usar intent log/outbox o compensación; SQLite no puede transaccionar el filesystem.
- [ ] Idempotency keys para jobs reintentables.
- [ ] Tests de falla inyectada en cada paso.

### DB-010 — Backup, restore y upgrade

- [ ] Backup consistente antes de cada upgrade.
- [ ] Manifest con app/schema version, hash y roots referenciados.
- [ ] Restore a path nuevo; nunca sobrescribir sin confirmación.
- [ ] Retention y limpieza segura.
- [ ] Simular corte de proceso durante migración y recuperar.

### DB-011 — WAL, concurrencia y lifecycle

- [ ] Definir WAL mode, busy timeout y pool/connections soportadas.
- [ ] Evitar writers paralelos no coordinados durante indexación.
- [ ] Checkpoint WAL en shutdown/backup cuando corresponda.
- [ ] Métricas de lock contention y `SQLITE_BUSY`.

## Paquete 1D — Retiro de herramientas peligrosas

### DB-012 — Sustituir `db:reset` como workflow normal

- [ ] `db:reset` sólo para disposable DB marcada.
- [ ] Onboarding usa migrate/seed, no push `--force`.
- [ ] Studio apunta a una DB seleccionada explícitamente.
- [ ] Cleanup scripts comparten guard, dry-run, backup y audit log.

### DB-013 — Corregir diagnóstico

- [ ] `db:check` resuelve `DATABASE_URL` real.
- [ ] Verifica apertura, version, migration drift, integrity, FK, WAL y espacio libre.
- [ ] Distingue warning de error y devuelve códigos apropiados.
- [ ] Modo JSON estable para CI/support bundles.

## Wave 1 exit gate

- [ ] Checkout limpio crea DB desde migraciones versionadas.
- [ ] Tests ya no copian `db.sqlite`; usan seeds deterministas.
- [ ] Schema fingerprint y migration checksum verdes.
- [ ] `integrity_check` y `foreign_key_check` verdes sobre fixture y copia representativa.
- [ ] Backup/restore/upgrade/corte de proceso ensayados.
- [ ] Ningún script destructivo opera sin marker, dry-run/confirmación y backup aplicable.
