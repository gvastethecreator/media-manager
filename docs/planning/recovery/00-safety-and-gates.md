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

**Estado 2026-07-23:** `bun run check:full` propaga el fallo del formateador correctamente. Tras corregir las
tabulaciones de `.github/workflows/quality.yml`, el gate llega al inventario global y detecta 445 archivos fuera de
formato. Falta comprobar el mismo contrato para `test:ci` y abordar el formateo en paquetes revisables, sin un
autoarreglo masivo sobre trabajo ajeno.

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

- [x] Identificar por qué Vite+ carga `vitest@0.1.20` con coverage 4.1.5.
- [x] Elegir una sola familia/versión soportada: Vite+ 0.1.20 empaqueta Vitest 4.1.5 y `@vitest/coverage-v8` 4.1.5.
- [ ] Migrar los imports heredados de `vitest` a `vite-plus/test`, retirar los aliases legacy y regenerar lock de forma
      controlada. Hay 61 archivos con imports heredados; coordinar los que están en cambios concurrentes.
- [x] Confirmar reportes coverage text/json/html y threshold de statements al 50%.
- [ ] Registrar baseline real por módulo crítico; no subir threshold hasta corregir suite.

**Proof 2026-07-23:** `bun run test:ci` pasó: 808/808 tests, coverage de statements 55,86% (8186/14652), branches
46,21%, functions 55,20% y lines 56,24%; el threshold actual de 50% se cumplió. El warning de versiones mixtas
persiste por los aliases legacy de `vitest`, aunque el package local declara `bundledVersions.vitest = 4.1.5` y su peer
de coverage exige precisamente 4.1.5. No declarar el gate completamente verde hasta retirar esa compatibilidad.

### GATE-004 — Corregir fallas actuales antes de nueva funcionalidad

- [x] Repro focalizado de favorites en audio/video/document/file3d/json.
- [x] Definir fuente canónica y expectativa de proyección en cada service.
- [x] Corregir fallas de favorites sin reactivar columnas legacy como autoridad.
- [x] Corregir fallas de `events.server.spec.ts`.
- [x] Ejecutar archivos focalizados y dos suites completas aisladas.

**Proof:** 808/808 tests pasaron dos veces el 2026-07-23 con exit 0 genuino. Cada corrida creó y eliminó 87 DBs SQLite
aisladas; duraron 374 s y 346 s. La evidencia aplica al checkout y host actuales.

## Paquete 0B — Backup y protección operativa

### SAFE-003 — Inventario y backup verificable

- [x] Comando read-only que informa ruta, tamaño, schema version, table counts y WAL mode.
- [x] Backup consistente mediante `VACUUM INTO`, no `Copy-Item` sobre DB activa.
- [x] Hash del backup y manifest sin contenido personal.
- [x] Restore a directorio temporal con schema y conteos comparados.
- [x] Prohibir destinos de backup dentro del workspace/Git, incluso tras resolver symlinks/junctions.
- [ ] Retention configurable y segura, limitada a artefactos reconocidos por manifest.

**Proof:** restore abre, queries smoke pasan y original permanece intacta.

**Runbook:** [Inventario y backup seguro](../../guides/DATABASE-BACKUP.md).

### SAFE-004 — Separar comandos destructivos

- [x] Bloquear por completo el `db:reset` legacy que borraba DB y migraciones sin confirmación/path explícito.
- [x] Retirar reset de base de datos de API, cliente y UI.
- [ ] Reintroducir reset sólo para DB marcada como disposable, después del baseline reproducible de Wave 1.
- [x] Retirar cleanup de logs de HTTP; conservar `logs:clean` como operación CLI explícita.
- [x] Eliminar aliases GET mutantes de thumbnails y alinear las acciones de producto a POST.
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

- [x] Generar token efímero por arranque mediante CSPRNG.
- [x] Mantener el token dentro del launcher/broker; no exponerlo en bundle, URL ni storage del browser.
- [x] Middleware obligatorio para `/api` y `/uploads`; health mínimo permanece público.
- [x] Rechazar token, origin, host, Fetch Metadata o marker local inválidos.
- [x] Rotar token al reiniciar; no guardarlo en Git/localStorage permanente.

**Proof 2026-07-27:** `bun scripts/run-tooling-tests-isolated.ts scripts/local-session-security.test.ts
scripts/local-app-broker.test.ts` pasó 19/19. Cubre secretos independientes, rotación, 401/403, Host/Origin/Fetch
Metadata, proxy real de API/uploads/SSE y bearer fuera del navegador.

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
- [x] Retirar reset DB, cleanup de logs y aliases GET mutantes de routers funcionales.
- [x] Bloquear reset legacy y mantener limpieza de logs como CLI explícita.
- [ ] Añadir dry-run al cleanup de phantoms/cursed antes de exponer cualquier reemplazo operativo.
- [x] Smoke enumera rutas prohibidas en producción y falla si aparece alguna.

**Proof:** snapshot del route registry por environment.

### SEC-006 — Headers, límites y errores

- [x] CSP de producción explícita desde el broker que sirve el HTML; scripts inline bloqueados y el backend no impone
      una política global sobre contenido autorizado. Pruebas HTTP del broker y smoke de producción cubren el header, el
      worker y el visor PDF.
- [x] Retirar 50 MB global: JSON limitado a 4 MiB, URL-encoded a 64 KiB y respuestas 413 seguras para cuerpos
      excesivos. El broker aplica el mismo techo y el listener limita cabeceras y tiempos.
- [x] Restringir previews de carpeta a thumbnails locales con rutas exactas y data URLs ráster. El SVG de fallback
      vuelve a autorizar cada activo, cuenta sólo activos autorizados, valida el formato desde sus bytes y limita la
      media inline a 512 KiB por thumbnail y 1 MiB total. No emite rutas anidadas; Chromium verificó la tarjeta con
      un thumbnail autorizado en un root temporal.
- [ ] Definir excepciones por ruta sólo si un flujo futuro demuestra que 4 MiB no basta.
- [ ] Rate limits diferenciados o concurrency limits para operaciones costosas.
- [ ] Timeouts/abort para downloads, scans y metadata.
- [x] Errores de límite no incluyen stack/path y devuelven request ID para correlación con logs.
- [ ] Añadir la prueba dedicada de límites a la lista por defecto de `test:tooling` cuando termine el cambio concurrente
      de ese runner; el modo aislado seleccionado ya la ejecuta.

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
