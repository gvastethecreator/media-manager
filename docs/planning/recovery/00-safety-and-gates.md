# Wave 0 — Seguridad de datos, gates y superficie local

Resultado: trabajar en el repositorio deja de poner en riesgo la biblioteca real y los comandos vuelven a decir la verdad.
Esta wave bloquea todo cambio de schema, dominio o release.

## Criterios de entrada

- Auditoría integral versionada.
- Árbol conocido y backup manual posible.
- Ninguna suite global se ejecuta hasta completar el guard de DB.

## Paquete 0A — Tests herméticos y gates honestos

### GATE-001 — Propagar códigos de salida reales

- [x] Eliminar tolerancia implícita de `scripts/run-with-log.js` para lint/testing/check.
- [x] Si se conserva un modo exploratorio, exigir flag/env explícito y nombrarlo `tolerant`; nunca usarlo desde CI.
- [x] Corregir mensajes: un exit 1 no puede producir “Script completado exitosamente”.
- [x] Añadir prueba de proceso: comando hijo 0 → wrapper 0; hijo 1 → wrapper 1; señal → no-cero.
- [ ] Confirmar que `bun run test:ci` y `bun run check:full` fallan cuando su herramienta falla.

**Archivos:** `scripts/run-with-log.js`, package scripts, tests del runner.

**Proof:** invocar el wrapper con comandos triviales controlados y registrar `$LASTEXITCODE`.

### SAFE-001 — Guard obligatorio contra la DB real

- [x] En setup de tests exigir `MEDIA_MANAGER_TEST_DB=1` y `DATABASE_URL` explícita.
- [x] Resolver/canonicalizar la ruta antes de aceptar.
- [x] Rechazar `db.sqlite`, `dev.db`, rutas fuera del área temporal y URLs remotas.
- [x] Rechazar DB temporal ausente o sin marker de propiedad del runner.
- [x] Mostrar error con comando seguro, nunca sugerir desactivar el guard.

**Archivos:** `tests/setup.ts`, helper dedicado bajo `tests/safety/`.

**Proof:** ejecución directa sin env aborta antes de importar servicios; DB real conserva tamaño/timestamp/hash.

### SAFE-002 — Runner de DB descartable

- [x] Crear directorio de ejecución único bajo `.scratch/test-dbs/`.
- [x] Mientras no exista baseline de migraciones, copiar `db.sqlite` como puente explícitamente temporal.
- [ ] Copiar/normalizar WAL sólo si se demuestra necesario; preferir snapshot consistente mediante backup API.
- [x] Escribir marker con PID, fuente, hora y versión de schema.
- [x] Exportar `DATABASE_URL`, `NODE_ENV=test` y marker para el child.
- [x] Propagar stdout/stderr, señales y exit code.
- [ ] Limpiar DB, WAL, SHM y marker en `finally`, incluso tras Ctrl+C.
- [ ] Detectar/sanear runs huérfanos sólo dentro del root temporal.
- [ ] Reemplazar la copia por migraciones+fixtures en Wave 1.

**Archivos:** nuevo `scripts/run-tests-isolated.*`, `.gitignore`, package scripts.

**Proof:** child observa una ruta temporal; la copia cambia; original no cambia; directorio temporal desaparece.

### GATE-002 — Conectar scripts oficiales al runner seguro

- [x] `test`, `test:watch`, `test:ci` pasan siempre por aislamiento.
- [x] `test:ci` conserva coverage y código de salida.
- [ ] Los comandos internos para tests puramente unitarios pueden saltar DB sólo con config separada que no importe Drizzle.
- [x] Documentar costo temporal de copiar 1,04 GB y task de retiro en Wave 1.

**Proof:** `bun run test:ci` no puede usar DB real aunque `.env` apunte a ella.

### GATE-003 — Alinear toolchain de tests

- [ ] Identificar por qué Vite+ carga `vitest@0.1.20` con coverage 4.1.5.
- [ ] Elegir una sola familia/versión soportada.
- [ ] Eliminar dependencias duplicadas y regenerar lock de forma controlada.
- [ ] Confirmar reportes coverage text/json/lcov y thresholds.
- [ ] Registrar baseline real por módulo crítico; no subir threshold hasta corregir suite.

**Proof:** no aparece warning de versiones mixtas; coverage termina y su failure rompe el gate.

### GATE-004 — Corregir fallas actuales antes de nueva funcionalidad

- [ ] Repro focalizado de favorites en audio/video/document/file3d/json.
- [ ] Definir fuente canónica y expectativa de proyección en cada service.
- [ ] Corregir 24 fallas de favorites sin reactivar columnas legacy como autoridad.
- [ ] Corregir dos fallas de `events.server.spec.ts`.
- [ ] Ejecutar archivos focalizados; después suite completa una sola vez.

**Proof:** 612/612 o conteo actualizado verde; exit 0 genuino.

## Paquete 0B — Backup y protección operativa

### SAFE-003 — Inventario y backup verificable

- [ ] Comando read-only que informa ruta, tamaño, schema version, table counts y WAL mode.
- [ ] Backup consistente con API SQLite/libSQL, no `Copy-Item` sobre DB activa.
- [ ] Hash del backup y manifest sin contenido personal.
- [ ] Restore a directorio temporal con conteos comparados.
- [ ] Retention configurable y prohibición de escribir backups dentro del bundle/Git.

**Proof:** restore abre, queries smoke pasan y original permanece intacta.

### SAFE-004 — Separar comandos destructivos

- [ ] Renombrar/resetear scripts para que `reset` requiera confirmación y path explícito.
- [ ] Bloquear reset sobre DB no marcada como disposable en CI/noninteractive.
- [ ] Separar cleanup funcional de mantenimiento destructivo.
- [ ] Añadir dry-run a cleanup de phantoms/cursed y reporte de IDs/counts.

**Proof:** invocación accidental sobre DB real aborta; dry-run no cambia conteos.

## Paquete 0C — Cerrar API filesystem

### SEC-001 — Loopback por defecto

- [x] Express escucha `127.0.0.1`; override externo requiere flag explícito y warning crítico.
- [x] Vite dev usa loopback salvo caso documentado.
- [x] Health público se limita a estado, timestamp y uptime.
- [x] Tests prueban host por defecto y config inválida.

**Proof:** `Get-NetTCPConnection` muestra sólo loopback.

### SEC-002 — Sesión local autenticada

- [ ] Generar token efímero por arranque mediante CSPRNG.
- [ ] Entregar token al frontend mediante launcher seguro, no log/URL persistente.
- [ ] Middleware obligatorio para `/api`, excepto health mínimo si se necesita.
- [ ] Rechazar origins/hosts inesperados y aplicar protección CSRF apropiada al modelo local.
- [ ] Rotar token al reiniciar; no guardarlo en Git/localStorage permanente.

**Proof:** requests sin token, con token incorrecto y desde origin no permitido → 401/403.

### SEC-003 — Registry de roots autorizados

- [ ] Modelo explícito de media root con ID, realpath y permisos permitidos.
- [ ] Toda ruta API se expresa como root ID + path relativo o asset ID; no absolute path arbitrario.
- [ ] Canonicalizar `.`/`..`, separadores, case Windows y prefijos extendidos.
- [ ] Rechazar UNC/device paths por defecto; decisión explícita si se soportan network shares.
- [ ] Resolver symlinks/junctions y verificar containment después de resolución.
- [ ] Separar permisos read/index/write/delete/export.

**Proof:** matriz adversarial de traversal, absolute, UNC, symlink/junction, case y encoded separators.

### SEC-004 — Migrar endpoints de lectura/mutación

- [ ] `/files/directory`, `/files/content`, `/download` usan root/asset policy.
- [ ] rename/copy/move/create validan source y destination.
- [ ] Operaciones cross-root requieren permiso explícito.
- [ ] Respuestas no filtran rutas absolutas salvo UI local que lo necesite.
- [ ] Logging redacta paths sensibles según nivel.

**Proof:** tests HTTP contra roots temporales; no acceso fuera de fixture.

### SEC-005 — Rutas debug/test sólo en desarrollo explícito

- [x] Route registry separa catálogo production y development.
- [x] No montar `/api/debug`, `/api/debug-entity-types` ni `/api/test-characters` en producción.
- [ ] Retirar de producción cleaners y mantenimiento destructivo todavía expuestos por routers funcionales.
- [ ] Mover maintenance destructivo a CLI/runbook con dry-run.
- [x] Smoke enumera rutas prohibidas en producción y falla si aparece alguna.

**Proof:** snapshot del route registry por environment.

### SEC-006 — Headers, límites y errores

- [ ] CSP de producción explícita; retirar justificación incorrecta de inline Vite.
- [ ] Body limits por endpoint; 50 MB global sólo donde sea necesario.
- [ ] Rate limits diferenciados o concurrency limits para operaciones costosas.
- [ ] Timeouts/abort para downloads, scans y metadata.
- [ ] Errores no incluyen stack/path en producción; correlation ID para logs.

## Orden de commits recomendado

1. `chore: make quality gates preserve exit codes` (`GATE-001`).
2. `test: isolate database-backed test runs` (`SAFE-001`, `SAFE-002`, `GATE-002`).
3. `test: align test runner and restore green baseline` (`GATE-003`, `GATE-004`).
4. `feat: add verified database backup workflow` (`SAFE-003`, `SAFE-004`).
5. `security: bind local services to loopback` (`SEC-001`).
6. `security: require local API sessions and authorized roots` (`SEC-002`–`SEC-004`).
7. `security: remove debug routes from production` (`SEC-005`, `SEC-006`).

## Wave 0 exit gate

- [ ] Test directo sin aislamiento falla antes de tocar DB.
- [ ] Test aislado limpia sus artefactos y propaga código de salida.
- [ ] Suite completa verde o fallas restantes aprobadas/bloqueadas con gate rojo.
- [ ] Backup/restore comprobado.
- [x] Servidores sólo loopback por defecto.
- [ ] API requiere sesión y root policy.
- [x] Rutas debug/test ausentes en production.
- [ ] Ningún P0 de la auditoría permanece sin mitigación verificable.
