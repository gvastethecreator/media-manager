# Wave 2 — Runtime web-local observable y seguro

Resultado: los artefactos construidos forman una aplicación real, arrancan con un comando, renderizan y se recuperan.
Requiere Waves 0 y 1 verdes.

## Paquete 2A — Configuración de ambientes

### RUN-001 — Contrato único de configuración

- [ ] Schema tipado para puertos, DB, roots, data dir, logs, environment y feature flags.
- [ ] Validación fail-fast; no defaults silenciosos peligrosos.
- [ ] Separar build-time, server runtime y browser-public config.
- [ ] Nunca exponer secrets/tokens en bundle.
- [ ] Matriz development/test/production/Tauri documentada y probada.

### RUN-002 — Build de producción genuino

- [x] Scripts establecen `NODE_ENV=production` de forma cross-platform.
- [x] `import.meta.env.DEV`, `__DEV__` y source maps responden al modo real.
- [x] React Grab/React Scan/dev routes no aparecen en dist.
- [ ] Build metadata incluye versión/commit/schema compatible.

## Paquete 2B — Bootstrap y App Shell

### BOOT-001 — Unificar theme context

- [x] Elegir una sola implementación de `ThemeProvider/useTheme`.
- [x] Migrar ThemeSync, Toaster, settings y navegación.
- [x] Eliminar contexto duplicado y tests que permitan importarlo.
- [x] Persistencia de theme con fallback para valores inválidos.

### BOOT-002 — Boundary exterior de bootstrap

- [x] Boundary antes de providers con fallback legible.
- [ ] Capturar errores de config, DB/API health y provider composition.
- [ ] Acciones: reintentar, abrir logs/support bundle, arrancar modo seguro cuando sea válido.
- [x] No dejar root vacío ni loop de reload.

### BOOT-003 — Orden y ownership de providers

- [ ] Documentar grafo mínimo: config → theme/settings → query/cache → files → app/router.
- [x] Evitar providers que consumen un contexto aún no montado.
- [ ] Side effects de bootstrap idempotentes bajo React StrictMode.
- [ ] Tests de composición y un único `AppShell` canónico.

## Paquete 2C — Servidor de producción

### RUN-003 — Componer SPA + API

- [x] El broker local sirve assets versionados y fallback SPA; `/api` y `/uploads` se proxifican al backend interno.
- [x] Cache immutable para hashed assets; no-cache para HTML/config.
- [x] API y UI comparten origen; el token permanece fuera de React y lo inyecta el broker.
- [x] `/uploads` deja de ser escape global y respeta sesión/content policy.
- [x] Script `start` ejecuta artefactos construidos, no Vite preview.

### RUN-004 — Process lifecycle

- [x] Startup ordenado: broker starting → config → DB/migrations → routes → listen → monitors → ready.
- [x] Health `starting/ready/degraded/stopping`, derivado del backend vivo con timeout.
- [x] SIGINT/SIGTERM: cerrar broker/SSE, detener monitors/server y checkpoint/cierre de DB con límite temporal.
- [x] No dejar puertos/processes huérfanos.
- [x] Detectar puerto ocupado y dar error accionable; el smoke usa puertos dinámicos.

### RUN-005 — Observabilidad operativa

- [ ] Structured logs con level/context/correlation ID.
- [ ] Rotación y límites; path dentro de data dir.
- [ ] Redacción de absolute paths y contenido sensible.
- [ ] Support bundle opt-in con config sanitizada, versions, health y últimos errores.
- [ ] Métricas básicas: startup, requests, jobs, DB contention, thumbnail/reindex failures.

## Paquete 2D — Contrato HTTP/SSE

### API-001 — Error envelope único

- [ ] Shape estable: code, message user-safe, correlation ID, retryable y field errors.
- [ ] Mapping central de Effect/domain errors a HTTP.
- [ ] Nunca devolver stack/cause/path sensible en producción.
- [ ] UI diferencia offline, auth, validation, conflict, not found y server error.

### API-002 — Cancelación, timeouts y backpressure

- [ ] AbortSignal desde UI hasta I/O donde sea posible.
- [ ] Timeouts por metadata/download/search/jobs.
- [ ] Límites de concurrencia para scans/thumbnails/reindex.
- [ ] 429/503 con retry hints.

### API-003 — SSE confiable

- [ ] Event IDs, heartbeat, reconnect y replay limitado.
- [ ] Cleanup de listeners al cerrar conexión.
- [ ] Scope de eventos por sesión/profile/job.
- [ ] Progreso monotónico y terminal state único.
- [ ] Fallback polling sólo si se necesita.

## Paquete 2E — Smoke real

### E2E-001 — Preview smoke hermético

- [x] Puerto dinámico y `reuseExistingServer: false`.
- [x] DB fixture migrada y media root temporal con cleanup desde el primer paso fallable.
- [x] Arrancar artefactos de producción.
- [x] Exigir root visible, heading/main, health/API y cero `pageerror`/console errors.
- [x] Captura/trace sólo en failure; teardown prueba puertos libres y puerto interno ocupado.

### E2E-002 — Bootstrap failure states

- [ ] Config inválida.
- [ ] DB locked/corrupt fixture.
- [ ] Migración fallida.
- [ ] API no disponible y recuperación posterior.
- [ ] Theme/settings corruptos.

## Wave 2 exit gate

- [x] `build` + `start` abre UI desde artefactos de producción.
- [x] No hay tooling de desarrollo en dist.
- [x] Cero error de consola en dashboard smoke.
- [ ] Bootstrap failures muestran recovery UI.
- [x] Shutdown limpia conexiones, monitors, DB y puertos.
- [x] Same-origin API/session/root policy funciona de punta a punta.

## Evidencia del checkpoint BOOT-001/RUN-002

- `scripts/build-vite.ts` fuerza `NODE_ENV=production`; `vite.config.ts` conserva fallback correcto para invocación directa.
- 25 contratos de tooling/seguridad y 2 pruebas de `ThemeProvider` verdes.
- `bun run tsc`, lint focalizado y build Vite+ de producción verdes.
- Inspección de `dist/assets/*.js`: sin `react-grab` ni `react-scan`; `package.json` ya no se incrusta en el cliente.
- Smoke Chromium a `1440x900`: HTTP 200, root visible, tema `light`, sin fallback, sin `pageerror` y sin overflow horizontal.
- El preview estático aislado devolvía 502 porque Express no formaba parte de ese proceso; el broker full-stack descrito a
  continuación reemplazó esa superficie y cerró `E2E-001`.

## Evidencia del checkpoint RUN-003/RUN-004/E2E-001

- `scripts/start-production.ts` es el owner único del broker público y backend interno; ambos escuchan sólo en loopback.
- `/health` público refleja startup, degradación/recuperación real del backend y shutdown sin exponer el bearer.
- `playwright.production.config.ts` + `scripts/run-production-smoke.ts` migran una DB temporal, registran un root temporal,
  reservan puertos dinámicos, ejecutan `dist` y eliminan el entorno aun si falla la inicialización.
- Chromium a `1440x900`: landmark `main`, heading Dashboard, API same-origin, cache/fallback correctos, sin overflow,
  `pageerror` ni console errors. Captura observada en el plan durable local.
- El teardown libera ambos puertos; una segunda ejecución con el puerto backend ocupado exige salida no-cero,
  diagnóstico accionable y retiro del broker dentro de un deadline.
- Broker focal: 5 tests / 31 assertions. Tooling aislado: 123 tests / 622 assertions. TSC, lint y build verdes.
- Revisión adversarial Sol/xhigh: `ACCEPT`, sin P0/P1/P2 después de reparar health vivo, cleanup temprano y deadlines.
