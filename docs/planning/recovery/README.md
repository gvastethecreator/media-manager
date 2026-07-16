# Plan maestro de recuperación de Media Manager

Este programa convierte la [auditoría integral del 14 de julio de 2026](../../audits/AUDITORIA-INTEGRAL-2026-07-14.md)
en trabajo ejecutable. El objetivo no es modernizar por estética: es llevar el producto a un estado seguro, reproducible,
usable y distribuible sin perder el conocimiento de dominio ya implementado.

## Ruta rápida

1. Completar Wave 0: ningún test puede tocar la DB real; ningún gate puede ocultar fallos; la API local queda cerrada.
2. Completar Wave 1: un checkout limpio puede crear, migrar, verificar, respaldar y restaurar la DB.
3. Completar Wave 2: el runtime web-local arranca desde artefactos de producción y muestra UI real.
4. Implementar el modelo canónico y los flujos de producto por vertical slices.
5. Recién entonces endurecer calidad, rendimiento, UX, Tauri y release.

No comenzar una wave si sus criterios de entrada no están verdes. No abrir más de un cambio de datos irreversible a la vez.

## Estado deseado

El proyecto estará en condiciones favorables cuando cumpla simultáneamente:

- `bun run test` crea/usa una DB descartable y jamás acepta `db.sqlite`.
- Todo gate devuelve no-cero cuando encuentra fallos.
- La API escucha sólo en loopback, autentica la sesión local y limita paths a roots registrados.
- Un checkout limpio reconstruye el esquema mediante migraciones versionadas.
- Backup y restore están ensayados, con conteos e integridad comprobados.
- El build web de producción arranca con un comando, renderiza y recupera errores de bootstrap.
- Ingesta, reindex, thumbnails, búsqueda, viewer, organización, favoritos y operaciones de archivos tienen pruebas E2E.
- `Asset`, source y primary placement son fuentes canónicas; proyecciones legacy tienen retiro fechado.
- CI ejecuta gates herméticos, build, preview smoke y E2E crítico.
- Tauri administra su backend/sidecar, data dir, token, health, shutdown y upgrade.
- Los budgets de tamaño, startup, memoria y colecciones grandes están medidos y protegidos.
- Documentación vigente coincide con comportamiento verificado; no usa “100%” sin evidencia enlazada.

## Fuentes de verdad

Orden de autoridad para decisiones y ejecución:

1. Este plan: orden, task IDs, dependencias y estados de recuperación.
2. Auditoría integral: evidencia y severidad del baseline.
3. ADR aceptados: decisiones de arquitectura que continúan vigentes.
4. PRD: intención de producto.
5. `docs/architecture/WORKPLAN.md`: seams parciales ya iniciados.
6. Código, tests y runtime actual: prueba de lo que existe realmente.
7. Documentación histórica: contexto, nunca confirmación automática.

Una contradicción se resuelve con evidencia ejecutable y se registra en este plan o en un ADR, no con otra afirmación
histórica.

## Camino crítico

| Wave | Resultado                 | Entrada                     | Salida mínima                                     | Documento                                   |
| ---- | ------------------------- | --------------------------- | ------------------------------------------------- | ------------------------------------------- |
| 0    | Datos y gates seguros     | Auditoría cerrada           | Tests aislados, gates honestos, API local cerrada | [Wave 0](./00-safety-and-gates.md)          |
| 1    | Persistencia reproducible | Wave 0 verde                | Migraciones, constraints, backup/restore          | [Wave 1](./01-data-and-migrations.md)       |
| 2    | Runtime web-local real    | Waves 0-1 verdes            | Build ejecutable, UI visible, smoke real          | [Wave 2](./02-runtime-and-security.md)      |
| 3    | Modelo y flujos canónicos | Runtime estable             | Asset/favoritos/placement + core flows            | [Waves 3-4](./03-domain-and-core-flows.md)  |
| 4    | Calidad sostenida         | Flujos críticos observables | CI, tests, API única, deps y budgets              | [Waves 5-6](./04-quality-performance-ux.md) |
| 5    | Desktop y release         | Web-local releaseable       | Tauri instalable, upgrade/rollback, release gate  | [Waves 7-8](./05-desktop-release.md)        |

## Prioridad operativa

### P0 — detener daño y falsos verdes

- `SAFE-*`: aislamiento de tests, protección de DB, backup verificable.
- `GATE-*`: códigos de salida, toolchain coherente, resultados honestos.
- `SEC-*`: loopback, token local, root allowlist, debug/test routes.
- `BOOT-*`: primer render de producción y boundary de bootstrap.
- `DB-*`: baseline/migraciones suficientes para dejar de copiar la DB real como fixture.

### P1 — recuperar producto y distribución

- `MODEL-*`: Asset, source, placement, favoritos y relaciones.
- `FLOW-*`: ingesta, thumbnails, búsqueda, viewer, organización, file ops, export.
- `API-*`: contratos cliente-servidor únicos y validados.
- `DESKTOP-*`: sidecar y packaging Tauri.
- `CI-*`: checks herméticos y smoke de release.

### P2 — reducir costo de cambio

- `PERF-*`: assets, chunks, startup, virtualización, memoria.
- `UX-*`: estados completos, accesibilidad, responsive y recovery.
- `CODE-*`: hotspots, `any`, barrels, boundaries y legado.
- `DOC-*`: autoridad, runbooks y retiro de afirmaciones obsoletas.

P2 no significa opcional. Significa que hacerlo antes de P0/P1 genera retrabajo o una aplicación pulida que sigue siendo
insegura.

## Contrato de ejecución

Cada task ID debe recorrer este ciclo:

1. Confirmar precondiciones y leer sus archivos/ADR enlazados.
2. Crear una prueba o repro que falle por el motivo esperado.
3. Implementar el cambio mínimo que cierre el riesgo completo.
4. Ejecutar verificación focalizada; suites globales sólo en checkpoint.
5. Probar estados negativos y recuperación, no sólo happy path.
6. Actualizar checkbox, evidencia, riesgos residuales y siguiente task desbloqueada.
7. Commit lógico con el task ID en cuerpo o mensaje cuando aporte trazabilidad.

No se mezclan en un mismo commit:

- cambios de schema y refactors UI no dependientes;
- upgrades masivos y fixes de comportamiento;
- eliminación de legacy y cambio de contrato sin compatibilidad/proof;
- formateo global y lógica.

## Estados del backlog

- `[ ]` pendiente.
- `[~]` en progreso; sólo un paquete crítico por lane.
- `[x]` implementado y verificado con evidencia registrada.
- `[-]` descartado mediante decisión documentada.
- `[!]` bloqueado con causa, tres intentos o decisión externa requerida.

Markdown no interpreta todos estos estados como checkboxes; son convenciones deliberadas para el ledger.

## Lanes y paralelismo permitido

Después de Wave 0 pueden avanzar en paralelo sólo trabajos con ownership separado:

- Lane Datos: migraciones, constraints, backup/restore.
- Lane Runtime: web build, bootstrap, process lifecycle.
- Lane Dominio: modelo canónico y vertical slices.
- Lane Quality: test infrastructure, CI, dependency health.
- Lane Experience: performance, a11y, states, docs.
- Lane Desktop: bloqueada hasta runtime web-local estable.

Toda lane debe rebasarse sobre contratos aceptados; nadie modifica migraciones/schema compartido en paralelo sin lock de
ownership.

## Gates obligatorios por checkpoint

### Checkpoint de código

- Test focalizado que reproduce la falla y queda verde.
- `bun run lint`/`bun run tsc` o sus equivalentes focalizados.
- `git diff --check`.
- Sin cambio accidental en `db.sqlite`, media roots ni archivos de usuario.

### Checkpoint de datos

- Backup antes de migrar.
- Migración sobre copia representativa.
- Conteos pre/post y reconciliación de huérfanos.
- `foreign_key_check`, idempotencia y restore probado.

### Checkpoint de UI/runtime

- Build de producción, no sólo dev server.
- Browser smoke: contenido visible, cero `pageerror`, requests esperados.
- Loading, empty, error, retry, cancel/progress y restart cuando correspondan.
- Viewports de desktop compacto y estándar; mobile sólo donde el producto lo soporte.

### Checkpoint de release

- Instalación limpia y upgrade desde versión anterior soportada.
- Migración + rollback/restore ensayados.
- Vulnerabilidades evaluadas; ninguna crítica/alta explotable aceptada sin excepción documentada.
- SBOM/licencias/provenance de assets.
- Artefacto firmado cuando exista canal de distribución.

## Decisiones que requieren aprobación explícita

- Runtime primario: se recomienda web-local primero y Tauri como envoltorio posterior.
- Política de compatibilidad de DB y cuántas versiones anteriores soporta upgrade.
- Roots permitidos y tratamiento de symlinks/UNC/network shares.
- Si export ZIP/PDF se implementa o se retira de UI.
- Qué corpus/volúmenes representan 1k, 10k y 100k assets.
- Licencia y destino de `public/emojis`.
- Plataformas desktop soportadas en el primer release.

Las tareas preparatorias pueden avanzar sin estas decisiones; ninguna implementación irreversible debe asumirlas.

## Indicadores de programa

Actualizar en cada checkpoint:

- P0 abiertos/cerrados.
- Tests fallidos/pasados y duración; código de salida observado.
- Cobertura de módulos críticos, no sólo global.
- Migraciones versionadas y drift contra DB representativa.
- Violaciones FK/huérfanos.
- Vulnerabilidades critical/high/moderate.
- Build time, tamaño de dist, top chunks.
- Startup hasta first meaningful UI.
- Error rate y recovery rate de reindex/thumbnails/file ops.
- E2E críticos verdes.
- Legacy endpoints/clients/proyecciones restantes.
- Claims documentales sin evidencia.

## Orden inmediato aprobado

Checkpoints ya implementados y verificados:

1. `GATE-001`, `SAFE-001`, `SAFE-002`, `GATE-002`: gates honestos y tests aislados.
2. `SEC-001`: Express/Vite sólo loopback por defecto.
3. `SEC-005` parcial: rutas debug/test ausentes de production.
4. `SAFE-003`: inventario, snapshot consistente, manifest, hash, restore y retención verificada fail-closed.
5. `SAFE-004`/`SEC-005`: reset DB limitado a targets descartables marcados y retirado de HTTP/UI; log cleanup fuera de HTTP; mutaciones de
   thumbnails sólo por POST.
6. `BOOT-001` y `RUN-002` parcial: un solo contexto de tema, boundary exterior, build production explícito, root visible
   en Chromium y tooling de desarrollo ausente de `dist`.

El siguiente camino crítico es añadir sesión local autenticada (`SEC-002`) antes de abrir roots filesystem
(`SEC-003`/`SEC-004`), mientras Wave 1 prepara migraciones reproducibles para un reset exclusivamente descartable.

## Definition of Done del programa

El programa termina cuando:

- Todas las tareas P0 y P1 están `[x]` o `[-]` mediante decisión aprobada.
- No hay gates tolerantes bajo nombres de CI/check/release.
- Una instalación limpia y una actualización desde versión soportada pasan el mismo smoke.
- La arquitectura canónica gobierna los flujos críticos y el legado tiene retiro medido.
- Web-local y al menos un target desktop soportado tienen artefactos reproducibles.
- Los flujos originales definidos en PRD tienen evidencia E2E y estados de recuperación.
- Backups/restores y pérdida de proceso durante operaciones largas están probados.
- Performance budgets y accesibilidad tienen gates, no sólo informes.
- La documentación de operación/release coincide con el runtime.

Hasta entonces el estado honesto es “recuperación en curso”, aunque una wave individual esté verde.
