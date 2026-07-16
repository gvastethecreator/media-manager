# Wave 1 — Persistencia reproducible e integridad

Resultado: un checkout limpio construye el mismo esquema, migra datos representativos sin pérdida y puede restaurarse.
Wave 0 debe estar verde; ninguna tarea escribe sobre la DB original sin backup y ensayo sobre copia.

## Paquete 1A — Baseline y ownership del schema

### DB-001 — Elegir una sola ubicación de migraciones

- [x] Adoptar `src/lib/drizzle/migrations/` o `drizzle/migrations/`, no ambas.
- [x] Quitar ignore de la ruta elegida y versionar SQL, journal y snapshots necesarios.
- [x] Configurar Drizzle, scripts, Tauri y CI contra esa ruta.
- [x] Eliminar/copiar con historia explícita la migración huérfana `0002_add_reindex_indexes.sql`.
- [x] Validar nombres y orden monotónico.

### DB-002 — Capturar baseline real

- [x] Exportar DDL de una copia representativa sin datos personales.
- [x] Comparar 69 tablas reales contra 41 tablas Drizzle y clasificar: vigente, legacy, FTS/internal, huérfana.
- [x] Documentar columnas, indexes, triggers y virtual tables que Drizzle no modela.
- [x] Crear baseline que reproduce una instalación nueva.
- [x] Crear schema fingerprint estable y gate de drift.

**Proof:** DB vacía creada desde cero coincide con fingerprint esperado.

### DB-003 — Runner de migraciones productivo

- [x] Implementar `db:migrate`, `db:status`, `db:check` y `db:plan`.
- [x] Lock para evitar dos migraciones concurrentes.
- [x] Registro de versión/checksum y rechazo de migraciones modificadas.
- [x] Transacción por migración cuando SQLite lo permita.
- [x] Errores con rollback y código no-cero.

### DB-004 — Reemplazar copia de DB en tests

- [x] Crear DB temporal desde baseline/migraciones.
- [x] Seeds pequeños deterministas por suite.
- [x] Fixtures por dominio; no depender del contenido de usuario.
- [x] Reducir setup de 215 s y environment de 304 s observados.
- [x] Mantener guard contra DB real incluso después de migrar.

## Paquete 1B — Integridad referencial

### DB-005 — Inventario de relaciones y huérfanos

- [x] Generar catálogo de relaciones esperadas desde schema/servicios.
- [x] Queries read-only para huérfanos por junction/FK conceptual.
- [x] Clasificar repair automático, cuarentena o decisión manual.
- [x] Guardar sólo conteos/IDs técnicos en reportes; no contenido personal.

### DB-006 — Introducir foreign keys por dominio

- [x] Activar `PRAGMA foreign_keys=ON` en todas las conexiones y tests.
- [x] Añadir `.references()` y políticas `ON DELETE/UPDATE` explícitas.
- [x] Orden: profiles/settings → folders/files/assets → organization → taxonomy → worldbuilding → junctions.
- [x] Migrar/reconstruir tablas SQLite con backup y reconciliación.
- [x] Añadir `foreign_key_check` a CI y startup diagnostic.

### DB-007 — Constraints e invariantes

- [x] Unicidad de paths/identity según root y source.
- [x] Checks para enums/status, tamaños no negativos y rangos.
- [x] Unicidad/canonicalización de favorites por profile/type/entity.
- [x] Primary placement único por asset (modelo actual: un `folderId` escalar por tabla media; Asset convergente sigue en Wave 2).
- [x] Junctions sin duplicados y con índices en ambas direcciones.

### DB-008 — Timestamps y tipos

- [x] Inventariar `CURRENT_TIMESTAMP` en columnas `integer(timestamp_ms)`.
- [x] Elegir epoch ms como contrato y migrar defaults/datos.
- [x] Normalizar timezone/serialización en DTOs.
- [x] Tests de roundtrip y orden temporal.

## Paquete 1C — Atomicidad y recuperación

### DB-009 — Fronteras transaccionales

- [x] Mapear operaciones que escriben más de una tabla/FS+DB.
- [x] Añadir transacciones a favorites, relations, ingest, move/delete, reindex y cleanup.
- [x] Para FS+DB usar intent log/outbox o compensación; SQLite no puede transaccionar el filesystem.
- [x] Idempotency keys para jobs reintentables.
- [x] Tests de falla inyectada en cada paso.

### DB-010 — Backup, restore y upgrade

- [x] Backup consistente antes de cada upgrade.
- [x] Manifest con app/schema version, hash y roots referenciados.
- [x] Restore a path nuevo; nunca sobrescribir sin confirmación.
- [x] Retention y limpieza segura.
- [x] Simular corte de proceso durante migración y recuperar.

### DB-011 — WAL, concurrencia y lifecycle

- [x] Definir WAL mode, busy timeout y pool/connections soportadas.
- [x] Evitar writers paralelos no coordinados durante indexación.
- [x] Checkpoint WAL en shutdown/backup cuando corresponda.
- [x] Métricas de lock contention y `SQLITE_BUSY`.

## Paquete 1D — Retiro de herramientas peligrosas

### DB-012 — Sustituir `db:reset` como workflow normal

- [x] `db:reset` sólo para disposable DB marcada.
- [x] Onboarding usa migrate/seed, no push `--force`.
- [x] Studio apunta a una DB seleccionada explícitamente.
- [x] Cleanup scripts comparten guard, dry-run, backup y audit log.

### DB-013 — Corregir diagnóstico

- [x] `db:check` resuelve `DATABASE_URL` real.
- [x] Verifica apertura, version, migration drift, integrity, FK, WAL y espacio libre.
- [x] Distingue warning de error y devuelve códigos apropiados.
- [x] Modo JSON estable para CI/support bundles.

## Wave 1 exit gate

- [x] Checkout limpio crea DB desde migraciones versionadas.
- [x] Tests ya no copian `db.sqlite`; usan seeds deterministas.
- [x] Schema fingerprint y migration checksum verdes.
- [x] `integrity_check` y `foreign_key_check` verdes sobre fixture y copia representativa.
- [x] Backup/restore/upgrade/corte de proceso ensayados.
- [x] Ningún script destructivo opera sin marker, dry-run/confirmación y backup aplicable.

**Proof:** `docs/database/RECOVERY-AND-UPGRADE.md`, `docs/database/TRANSACTION-BOUNDARIES.md`, tooling DB, pruebas
focalizadas de atomicidad y upgrade representativo 2→3 sin diferencias de conteo salvo la fila de historial.
