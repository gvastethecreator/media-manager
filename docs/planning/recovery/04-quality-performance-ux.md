# Waves 5–6 — Calidad sostenida, rendimiento y experiencia

Resultado: el proyecto puede seguir cambiando sin recaer. Estas tareas se integran durante Waves 2–4, pero su gate final
se cierra cuando los flujos críticos ya son observables.

## Wave 5 — Arquitectura de calidad

### API-010 — Transporte cliente canónico

- [ ] Inventariar 168 `fetch`, clientes legacy, hooks y `apiClient`.
- [ ] Elegir transporte único con base URL/session/error/cancel/timeout.
- [ ] Compartir schemas request/response o generar contratos.
- [ ] Query keys y cache invalidation semánticas.
- [ ] Migrar por vertical slice y eliminar cliente anterior al cerrar cada una.
- [ ] Gate que detecta imports desde directorios retirados.

### TEST-001 — Pirámide y ownership

- [ ] Unit: lógica pura, guards, transforms, path policy.
- [ ] Integration: servicios + DB migrada + roots temporales.
- [ ] API: Express real con auth/root policy.
- [ ] E2E: sólo flujos críticos desde build/launcher real.
- [ ] Contract: schemas cliente-servidor y migrations.
- [ ] Performance: corpus/benchmarks fuera de la suite rápida.

Cada test debe declarar si usa DB, FS, red, browser o binaries externos. Suites DB no corren paralelas hasta demostrar
aislamiento suficiente.

### TEST-002 — Fixtures deterministas

- [ ] Factories sin IDs/timestamps globales frágiles.
- [ ] Media fixtures pequeñas por formato y casos corruptos.
- [ ] Fixture generator para corpus grande sin versionar GB.
- [ ] Golden files sólo cuando semánticamente estables.
- [ ] Cleanup scoped por run IDs, nunca `delete(table)` global.

### TEST-003 — Coverage útil

- [ ] Thresholds de statements/branches/functions/lines.
- [ ] Threshold por módulos críticos: path policy, migrations, file ops, reindex, favorites.
- [ ] Excluir generated/vendor con criterio explícito.
- [ ] Mutation/fault tests focalizados para invariantes de datos.
- [ ] Coverage trend visible; no perseguir 100% global.

### CI-001 — Workflow base

- [ ] Install con lockfile frozen y caches versionadas.
- [ ] Migration/schema smoke.
- [ ] Lint, format, tsc y unit/integration herméticos.
- [ ] Build frontend/server y preview smoke.
- [ ] Upload logs/traces sólo en failure y sin datos personales.
- [ ] Concurrency/cancel de runs obsoletos.

### CI-002 — E2E/release workflows

- [ ] E2E crítico en puertos dinámicos y DB/root temporales.
- [ ] Matrix de Windows obligatoria; otras plataformas según decisión.
- [ ] Nightly para corpus grande, dependency audit y Tauri packaging.
- [ ] Branch protection exige gates reales.

### DEP-001 — Dependencias y supply chain

- [ ] Clasificar 57 vulnerabilidades por reachability/runtime/dev.
- [ ] Resolver critical/high primero en lotes pequeños.
- [ ] Alinear Vite+/Vitest/coverage/React Router types.
- [ ] Eliminar paquetes duplicados/no usados con build/test por lote.
- [ ] Licenses/SBOM y política de excepciones con expiry.
- [ ] Dependabot/Renovate sólo después de gates confiables.

### CODE-001 — Boundaries y hotspots

- [ ] Public APIs por contexto; no direct DB desde rutas/UI.
- [ ] Separar queries, commands, transforms y orchestration en servicios >750 líneas cuando la slice los toca.
- [ ] Retirar mock browser de Drizzle y bloquear imports server-only en client.
- [ ] Reducir `any` en boundaries y datos externos primero.
- [ ] Eliminar 29 transformer barrels gradualmente; gate de imports nuevos.
- [ ] Detectar ciclos y reactivar rule por directorio.

### CODE-002 — Feature flags y legado

- [ ] Registro tipado con owner, default, fecha y condición de retiro.
- [ ] No flags permanentes para dos arquitecturas completas.
- [ ] Tests de ambos paths sólo durante migración.
- [ ] Retiro en la misma wave que cumple criterio.

## Wave 6 — Rendimiento, UX y documentación

### PERF-001 — Eliminar payload estático huérfano

- [ ] Confirmar consumidores y licencia/provenance de 3.054 PNG.
- [ ] Si no se usan, quitar del build y considerar limpieza Git/LFS separada.
- [ ] Si se usan, catálogo on-demand/cache fuera del bundle.
- [ ] Budget de `public` y dist en CI.

### PERF-002 — Startup y dependency optimizer

- [ ] Retirar `optimizeDeps.force` permanente.
- [ ] Medir cold/warm dev startup y production startup.
- [ ] Lazy init de servicios/binaries no críticos.
- [ ] Perf marks desde process start hasta meaningful UI.

### PERF-003 — Bundle y carga UI

- [ ] Analizar main/settings/three/CSS top chunks.
- [ ] Split por ruta/capability; Three/viewers sólo al abrir.
- [ ] Evitar imports dinámicos anulados por imports estáticos.
- [ ] Tree-shake icon packs/editors/dev tools.
- [ ] Budgets iniciales basados en baseline mejorado y reducción incremental.

### PERF-004 — Colecciones grandes

- [ ] Virtualización consistente en grids/lists/tables.
- [ ] Stable keys/selectors; evitar mega-store rerenders.
- [ ] Pagination/cursor y thumbnails lazy.
- [ ] Memory profiling 1k/10k/100k.
- [ ] Interaction budgets para scroll, search y selection batch.

### PERF-005 — Backend jobs e I/O

- [ ] Streaming hash/download/metadata donde aplique.
- [ ] Concurrency configurable según CPU/disk.
- [ ] Cache con invalidation observable.
- [ ] Benchmarks por tipo/size y slow-operation logs.

### UX-001 — App shell y navegación

- [ ] Jerarquía clara, rutas/restoration y focus management.
- [ ] Compact desktop sin overflow accidental.
- [ ] Navegación funciona con keyboard y screen reader landmarks.
- [ ] Error/offline/degraded modes accesibles.

### UX-002 — Estados completos por flujo

- [ ] Loading y skeleton sin layout shift.
- [ ] Empty state con siguiente acción real.
- [ ] Error específico, retry y soporte/correlation ID.
- [ ] Progress/cancel/pause honestos.
- [ ] Partial success y conflict resolution.
- [ ] Undo feedback y expiración visible.

### UX-003 — Accesibilidad

- [ ] Reactivar reglas a11y por módulos y corregir baseline.
- [ ] Nombres/roles/estados; keyboard completo; focus visible.
- [ ] Contraste en 14 themes y reduced motion.
- [ ] Media captions/transcripts cuando el contenido los provea.
- [ ] Axe + pruebas manuales de flujos críticos.

### UX-004 — Design system

- [ ] Eliminar colors/spacing fuera de tokens al tocar componentes.
- [ ] Reducir primitives duplicados.
- [ ] Estados disabled/loading/destructive consistentes.
- [ ] Density/scale probadas en textos largos y traducción.
- [ ] Visual regression de shell, grids, dialogs, settings y viewers.

### DOC-001 — Autoridad documental

- [ ] Índice único: vigente, propuesto, histórico, retirado.
- [ ] Estados `proposed/accepted/implemented/verified/retired` con fecha/evidencia.
- [ ] Archivar o corregir 77 claims `100%` y 14 “completamente funcional”.
- [ ] ADRs enlazan commits/migrations/tests de implementación.
- [ ] WORKPLAN enlaza este programa y deja de duplicar estados.

### DOC-002 — Runbooks

- [ ] Setup limpio, dev, tests seguros, build/start.
- [ ] DB migrate/backup/restore/recovery.
- [ ] Reindex/thumbnail/file-op incident response.
- [ ] Tauri build/sign/release.
- [ ] Support bundle y privacy handling.

### DOC-003 — Higiene de repositorio

- [ ] Ignorar scratch/logs generados y retirar `.tmp-*` versionados con decisión.
- [ ] Separar vendor/skills del formatter o justificar ownership.
- [ ] LICENSE, third-party notices y asset provenance.
- [ ] Definir qué artefactos/logs nunca se versionan.

## Waves 5–6 exit gate

- [ ] CI protege rama y falla ante issues reales.
- [ ] Critical/high dependencies resueltas o excepción temporal aprobada.
- [ ] API client legacy y barrels/hotspots críticos reducidos según ledger.
- [ ] Dist/public/chunks/startup cumplen budgets.
- [ ] Flujos críticos pasan a11y y visual regression.
- [ ] Documentación vigente enlaza evidencia y runbooks ensayados.
