# Auditoría integral y plan de recuperación — 2026-07-14

## Veredicto ejecutivo

El proyecto **no está listo para uso confiable, distribución ni producción**. Tampoco está a una ronda de pulido de llegar ahí.
La base contiene trabajo valioso, experiencia de dominio, una UI ambiciosa, servicios reales y decisiones arquitectónicas
razonables; pero la suma actual funciona más como un laboratorio de producto grande que como una aplicación cerrada.

La conclusión dura es esta:

- El camino web construido muestra una pantalla en blanco antes del primer render.
- El camino desktop no compila desde un checkout normal y no tiene un ciclo de vida funcional para su backend.
- La API local expone lectura y mutación arbitraria del sistema de archivos sin autenticación y escucha en toda la red.
- La suite oficial puede borrar la base real, falla 26 pruebas y aun así devuelve código de éxito.
- El gate completo encuentra 588 archivos mal formateados y también devuelve código de éxito.
- La base real tiene 69 tablas sin una sola restricción `FOREIGN KEY` en su DDL.
- La carpeta configurada de migraciones está ignorada por Git; un checkout no contiene el historial que dice usar.
- Hay 1,92 GiB de PNG de emojis aparentemente no consumidos, copiados a cada build.
- La documentación declara repetidamente “100% funcional” cosas que el runtime y los tests contradicen.

No recomiendo reescribir todo. Recomiendo detener expansión y ejecutar una recuperación por dependencias: primero datos y
superficie de ataque; después una base reproducible; luego un único runtime distribuible; recién entonces recuperar los
flujos de producto y completar la arquitectura objetivo.

## Qué se auditó

- Intención de producto: README, PRD, ADR, planes de arquitectura y documentación histórica.
- Inventario: 5.783 archivos versionados; 1.835 archivos TypeScript/JavaScript/Rust y 264.676 líneas en
  `src`, `scripts`, `tests` y `src-tauri`.
- Runtime web, servidor Express/Bun, Tauri, Drizzle/libSQL, rutas, servicios, stores y clientes de API.
- Esquema y base local en modo lectura; no se inspeccionó contenido personal.
- Suite unitaria/coverage sobre una copia aislada de `db.sqlite`, nunca sobre la base original.
- Build frontend, build servidor, lint, TypeScript, check completo, auditoría de dependencias y `cargo check`.
- Preview real en Chrome headless, captura visual, DOM, consola, errores de página y requests fallidos.

Limitaciones honestas:

- No se ejecutó `test:e2e`: reutiliza cualquier proceso en `localhost:5173`; había otra aplicación en ese puerto y el
  comando tampoco aísla `DATABASE_URL`. Ejecutarlo habría producido evidencia falsa o riesgo de pérdida de datos.
- No se hizo un recorrido funcional de una biblioteca real porque la aplicación construida no llega a renderizar.
- No se hizo revisión por un segundo agente: la política de esta sesión prohibía delegar salvo pedido explícito.
- Las cifras de deuda textual (`any`, TODO, legacy) son señales de triage, no defectos individuales confirmados.

## Estado objetivo recuperado de la documentación

La intención original es coherente y todavía defendible:

- Gestor local-first para colecciones multimedia heterogéneas grandes.
- Web local y desktop Tauri sobre un mismo núcleo React + Express + SQLite.
- Indexación incremental por contenido, miniaturas, búsqueda, organización, taxonomía y worldbuilding.
- Modelo canónico `Asset`, archivo de origen separado y una ubicación primaria explícita.
- Relaciones híbridas y favoritos canónicos por perfil.
- Taxonomía respaldada por archivos cuando el texto debe sobrevivir fuera de la base.

Los ADR relevantes son buenos. El problema es que describen un futuro aceptado, no el runtime actual. `Asset` y Primary
Placement siguen esencialmente en documentos/migraciones locales ignoradas, mientras el esquema ejecutable continúa
fragmentado por tipo y conserva ruta, hash, carpeta y favorito en múltiples proyecciones.

## Puntuación de preparación

Escala heurística de 0 a 10; sirve para priorizar, no pretende ser una métrica científica.

- Seguridad de datos: **1/10**.
- Seguridad de superficie local/red: **1/10**.
- Reproducibilidad de base y migraciones: **1/10**.
- Runtime web distribuible: **1/10**.
- Runtime Tauri distribuible: **1/10**.
- Corrección funcional observable: **3/10**.
- Tests y CI: **1/10**.
- Mantenibilidad: **3/10**.
- Rendimiento de entrega: **2/10**.
- Documentación como fuente de verdad: **2/10**.
- Calidad de la intención arquitectónica: **7/10**.
- Preparación global: **2/10**.

## Hallazgos P0 — bloquean cualquier trabajo de producto

### P0.1 — La suite oficial puede destruir la base real

**Evidencia**

- [`tests/setup.ts`](../../tests/setup.ts) sólo fuerza `NODE_ENV`; no establece ni valida `DATABASE_URL`.
- [`src/lib/drizzle/index.ts`](../../src/lib/drizzle/index.ts) usa `env.DATABASE_URL || 'file:./db.sqlite'` en tests.
- Se contaron **57** sentencias de limpieza como `await db.delete(images)` sin `where` en tests de servicios.
- `bun run test:ci` no crea una base temporal ni rechaza `db.sqlite`.
- La base real pesa 1.042.636.800 bytes. La auditoría copió ese archivo, apuntó `DATABASE_URL` a la copia, verificó que
  sólo la copia cambió y la eliminó al terminar.

**Impacto**

Ejecutar el comando documentado puede vaciar tablas completas de una biblioteca real. No es una posibilidad teórica: la
limpieza destructiva existe y el fallback apunta exactamente al archivo de aplicación.

**Acción exigida**

- Hacer que el proceso de tests cree su propia base temporal desde migraciones/fixtures.
- Abortar si la ruta termina en la base de aplicación o si no contiene una marca explícita de test.
- Eliminar el fallback a `db.sqlite` en entorno test.
- Probar el guard con tests negativos antes de volver a recomendar `bun run test`.

### P0.2 — API de sistema de archivos arbitraria, sin autenticación, expuesta a la LAN

**Evidencia**

- [`src/server/index.ts`](../../src/server/index.ts) escucha en `0.0.0.0`, desactiva el rate limit en desarrollo y no
  implementa autenticación.
- [`src/server/routes/files.effect.ts`](../../src/server/routes/files.effect.ts) expone lectura de directorios/contenido,
  creación, rename, copy y move con rutas entregadas por el request.
- [`src/server/routes/download.effect.ts`](../../src/server/routes/download.effect.ts) lee y entrega cualquier ruta recibida.
- [`src/services/file/file.service.ts`](../../src/services/file/file.service.ts) normaliza y quita traversal inicial, pero no
  exige una raíz aprobada; rutas absolutas de Windows y UNC siguen siendo válidas.
- [`src/server/route-registry.ts`](../../src/server/route-registry.ts) monta endpoints debug y test también fuera de un gate
  de desarrollo. Hay endpoints debug con acciones de limpieza.

**Impacto**

Un proceso o equipo alcanzable en la misma red puede leer archivos, descargarlos y modificar/mover contenido con los
permisos del usuario que ejecuta la app. Para un media manager, eso equivale a exfiltración y pérdida de biblioteca.

**Acción exigida**

- Escuchar en `127.0.0.1` por defecto.
- Usar token de sesión/origen para toda API local.
- Resolver rutas reales y exigir que permanezcan dentro de roots registrados por el usuario.
- Rechazar UNC, device paths, symlinks que escapan y destinos fuera de roots.
- No montar rutas debug/test en producción; separar comandos destructivos detrás de una capacidad explícita.
- Añadir tests adversariales de path traversal, absolute paths, symlinks y requests no autenticados.

### P0.3 — No existe una cadena reproducible de esquema/migraciones

**Evidencia**

- [`drizzle.config.ts`](../../drizzle.config.ts) escribe en `src/lib/drizzle/migrations`.
- [`.gitignore`](../../.gitignore) ignora por completo esa carpeta.
- Git contiene **cero** migraciones en la carpeta configurada. Sólo conserva
  `drizzle/migrations/0002_add_reindex_indexes.sql`, en otra ruta.
- El árbol local ignorado tiene SQL/snapshots que no recibirá un checkout nuevo; el journal local ni siquiera encadena
  todas esas migraciones.
- El SQL local de `Asset` deja comentada la migración de datos, relaciones y FTS.
- El script [`scripts/db/check.js`](../../scripts/db/check.js) busca `dev.db` aunque `.env` apunta a `db.sqlite`, informa
  que la base no existe y termina con código 0.
- La base real contiene 69 tablas; ninguna definición contiene `FOREIGN KEY`.
- El esquema Drizzle contiene cero llamadas `.references(...)`.
- Sólo se encontraron cinco usos de `.transaction(...)` en todo `src`.

**Impacto**

No se puede crear, actualizar, auditar ni restaurar de forma determinista el estado de datos. Las relaciones se sostienen
por convención y pueden quedar huérfanas. Un refactor de modelo o una falla a mitad de operación puede dejar estado mixto.

**Acción exigida**

- Congelar una baseline versionada que reproduzca la base actual desde cero.
- Inventariar huérfanos antes de introducir foreign keys; corregirlos con migraciones idempotentes.
- Añadir FKs y políticas `ON DELETE` dominio por dominio, no en un big bang.
- Normalizar timestamps: hay defaults `CURRENT_TIMESTAMP` sobre columnas declaradas `integer(timestamp_ms)`.
- Convertir operaciones multi-tabla en transacciones.
- Crear `migrate`, `status`, `backup`, `restore` y `check` reales, todos con códigos de salida correctos.

### P0.4 — El build web entrega una pantalla en blanco

**Evidencia dinámica**

- `bun run build:vite` finalizó, pero el preview dejó `<div id="root"></div>` vacío.
- Chrome mostró sólo el control de desarrollo de React Grab sobre una página blanca.
- La consola capturó: `Error: useTheme debe ser usado dentro de un ThemeProvider`.
- Captura: [preview de producción en blanco](./AUDITORIA-INTEGRAL-2026-07-14-preview-blank.png).
- [`src/providers/app-provider.tsx`](../../src/providers/app-provider.tsx) monta el `ThemeProvider` de
  `components/ui/theme-provider`.
- [`src/components/theme-sync.tsx`](../../src/components/theme-sync.tsx) y
  [`src/components/ui/sonner.tsx`](../../src/components/ui/sonner.tsx) consumen el contexto distinto de
  `lib/contexts/theme-context`.
- No hay boundary exterior al árbol de providers, por lo que el error elimina toda la aplicación.
- El build incluyó herramientas de desarrollo; [`vite.config.ts`](../../vite.config.ts) define `NODE_ENV` como
  `development` cuando el comando no lo establece.

**Impacto**

La aplicación web construida no tiene primer render, recuperación ni mensaje al usuario. Un build verde no representa un
producto ejecutable.

**Acción exigida**

- Consolidar un único contrato/provider de tema.
- Colocar un boundary de bootstrap fuera de todos los providers.
- Construir siempre con ambiente de producción explícito y verificar que no se empaqueten React Grab/React Scan.
- Añadir smoke de preview que exija contenido visible, ausencia de `pageerror` y requests API esperados.

### P0.5 — Los gates convierten fallos en éxito

**Evidencia dinámica**

- `bun run test:ci`: 6 archivos fallaron, 42 pasaron; **26 tests fallaron y 586 pasaron**. Duración: 719,18 s.
- El runner avisó que mezcla `vitest@0.1.20` con `@vitest/coverage-v8@4.1.5`, combinación no soportada.
- [`scripts/run-with-log.js`](../../scripts/run-with-log.js) clasifica lint/testing como “tolerante” y ejecuta
  `process.exit(0)` cuando la herramienta devuelve 1.
- Por eso el comando oficial informó éxito a pesar de las 26 fallas.
- `bun run check:full` encontró problemas de formato en **588 archivos** y también terminó con código 0.
- Su resumen incluso afirmó “No se encontraron errores de sintaxis o linting”.
- `oxlint` y `tsc` sí pasaron, pero [`oxlint.config.ts`](../../oxlint.config.ts) desactiva exhaustive deps, reglas centrales
  de accesibilidad, ciclos, `no-explicit-any` y `eqeqeq`.
- Coverage exige sólo 50% de statements y no produjo un resultado confiable al fallar la suite.

**Impacto**

Los comandos documentados no pueden proteger una rama, un release o una refactorización. “Verde” significa en varios casos
“la herramienta encontró fallas y el wrapper las ocultó”.

**Acción exigida**

- Preservar exactamente el código de salida de lint, test, format, coverage y build.
- Separar modo exploratorio tolerante de gates obligatorios; los scripts `check`/`test:ci` nunca deben ser tolerantes.
- Alinear versiones de Vitest y coverage.
- Corregir primero la suite de favoritos y eventos; después fijar baseline de cobertura por módulos críticos.

## Hallazgos P1 — impiden recuperar el producto

### P1.1 — Desktop Tauri es una promesa, no un runtime integrado

- `cargo check` falla porque `src-tauri/tauri.conf.json` exige `../dist/server/db.sqlite`, recurso que no existe después del
  build normal del servidor.
- El Rust sólo ofrece health check y data dir. No inicia, supervisa ni detiene un backend/sidecar.
- El frontend usa `/api` relativo; el origen de assets de Tauri no equivale a `localhost:4000`.
- El script de packaging copia JS y base, pero no demuestra un runtime Bun/Node invocable ni un proceso que lo arranque.
- CSP es `null`; `Cargo.toml` conserva metadata genérica (`authors = ["you"]`, licencia/repositorio vacíos).

**Decisión recomendada:** estabilizar primero un runtime web-local de un solo comando. Después empaquetar ese mismo contrato
como sidecar Tauri con puerto, token, data dir, health, shutdown y logs administrados por Rust.

### P1.2 — No existe un camino de producción web completo

- Express sólo sirve uploads y APIs; no sirve `dist` ni fallback SPA.
- `vp preview` sirve frontend, pero no tiene proxy de API.
- No hay script `start` que componga frontend y backend construidos.
- El build exitoso de frontend y servidor son dos artefactos sin un producto que los una.

### P1.3 — La arquitectura objetivo aceptada no está aterrizada

- `Asset`, Source File y Primary Placement aparecen en ADR/planes y migraciones ignoradas, no como raíz canónica en el
  esquema versionado y los flujos operativos.
- Favoritos tienen bridge canónico, proyecciones legacy y fallas activas precisamente en esa convergencia: audio, video,
  document, file3d y JSON.
- El workplan registra seams parciales, pero no tiene un ledger ejecutable que conecte cada ADR con migración, vertical
  slice, compatibilidad, tests y retiro de legado.

### P1.4 — Descargas avanzadas son funcionalidad falsa

- [`src/services/download/download.service.ts`](../../src/services/download/download.service.ts) devuelve el blob original
  cuando se pide ZIP.
- La exportación PDF devuelve una imagen renombrada como `.pdf`.
- El ZIP batch concatena blobs y marca el resultado `application/zip`; el archivo no es un ZIP válido.
- El fallback llama `/api/files/download`, endpoint no montado.
- El ID real devuelto por progress tracking se ignora y las actualizaciones usan otro ID.

No debe haber opciones visibles “ZIP/PDF” hasta que produzcan formatos válidos comprobados por parser; de otro modo deben
retirarse explícitamente.

### P1.5 — Peso y rendimiento de entrega fuera de escala

- `public/emojis`: 3.054 PNG, 2.057.115.825 bytes (1,92 GiB).
- No se encontró consumo runtime de `/emojis/`; los pickers observados usan Unicode o `emoji-picker-react`.
- `dist` resultó en 2.092.203.392 bytes (1,95 GiB) porque Vite copia `public`.
- El build frontend tardó 123,7 s y transformó 4.679 módulos.
- Chunks principales: Three ~1,16 MB minificado, Settings ~811 KB, main ~787 KB, CSS ~468 KB.
- Vite fuerza `optimizeDeps` en development, lo que contribuyó a un arranque atascado en dependency scanning.
- React Doctor puntuó **30/100**.

Antes de borrar assets hay que confirmar licencia/procedencia y ausencia de consumidores externos. Si son necesarios,
deben salir de Git/build y resolverse mediante un catálogo bajo demanda.

### P1.6 — Dependencias vulnerables y toolchain incoherente

- `bun audit` reportó **57 vulnerabilidades: 2 críticas, 18 altas, 29 moderadas y 8 bajas**.
- Hay vulnerabilidades directas o transitivas relevantes en `vite-plus`, `glob`, `systeminformation`, `undici`,
  `path-to-regexp`, `dompurify`, `ws`, `form-data` y otras.
- `@types/react-router-dom` v5 convive con React Router DOM v7.
- El warning de versiones Vitest/coverage confirma drift del toolchain, no sólo paquetes de runtime.

No se debe ejecutar `bun update --latest` a ciegas. Primero separar toolchain/runtime, actualizar lock en lotes y probar el
camino construido/preview con cada lote.

### P1.7 — Capa cliente fragmentada y contratos muertos

- Se contaron 168 llamadas directas a `fetch`, 322 menciones de `apiClient` y 26 archivos en el directorio de clientes
  legacy/deprecados.
- Hay servicios cliente con endpoints que no están montados y un cliente de folders que apunta a `/api/images`.
- Existen stores, hooks, TanStack Query, clientes class-based y fetch directo sin una única política de errores, cancelación,
  invalidación o tipado de response.

Definir un transporte canónico generado/validado desde schemas compartidos. Retirar endpoints/clients muertos por vertical
slice; no crear otra abstracción paralela.

### P1.8 — E2E y CI no protegen nada

- No existe `.github/workflows`.
- [`playwright.config.ts`](../../playwright.config.ts) fija puerto 5173 y `reuseExistingServer: true`; puede probar otra app.
- No configura DB aislada, fixtures ni teardown seguro.
- Sólo hay 10 archivos E2E y no pueden ejecutarse de forma segura con el contrato actual.

### P1.9 — La documentación perdió autoridad

- En `docs`/README hay 77 menciones de `100%` y 14 de “completamente funcional”.
- File Browser, Settings, viewer, toolbars y migraciones se declaran completos mientras el primer render falla, las
  operaciones ZIP/PDF son placeholders y el modelo aceptado no está migrado.
- Documentos archivados, reportes, planes y fuentes vigentes se mezclan sin un índice de autoridad claro.

La documentación no necesita más volumen; necesita estados verificables: `proposed`, `accepted`, `implemented`, `verified`,
`retired`, con fecha y evidencia.

## Hallazgos P2 — deuda importante, no el primer incendio

- 530 apariciones de `as any`, 173 de `Record<string, any>` y 39 de `z.any()` en código/tests/scripts auditados.
- 29 barrels `index.ts` en transformers contradicen la guía explícita de importar archivos concretos.
- Servicios entre ~750 y 1.200 líneas concentran consulta, transformación, favoritos, logging y compatibilidad legacy.
- `src/lib/drizzle/index.ts` mezcla conexión real, selección de entorno, esquema parcial y un mock de DB browser que puede
  ocultar imports de servidor en cliente.
- Hay doble implementación de contexto de tema, síntoma concreto de duplicación semántica.
- Hay 23 logs temporales versionados en raíz y varios directorios de skills/vendor que amplían el alcance del formatter.
- No hay archivo de licencia del repositorio y no quedó clara la procedencia/licencia de los 1,92 GiB de emojis.
- Rate limit, CSP y comentarios de “Vite inline” muestran configuración de desarrollo filtrada al diseño de producción.

No recomiendo atacar estas cifras globalmente. Deben caer al extraer y cerrar vertical slices de los P0/P1.

## Lo que sí vale la pena preservar

Esta auditoría no concluye que todo sea basura. Sería igual de poco serio.

- El modelo de producto local-first tiene sentido y encaja con el tipo de datos.
- Los ADR muestran comprensión real de los problemas de identidad, ubicación, relaciones y favoritos.
- La separación en servicios/transformers/rutas existe y permite migración incremental.
- TypeScript y el lint enfocado pasan; el build frontend y servidor también compilan.
- 586 tests pasaron incluso bajo una infraestructura defectuosa: hay comportamiento útil que se puede conservar.
- Hay trabajo importante en indexación incremental, miniaturas, Effect, streaming y manejo de entidades.
- El diseño visual/tokens y la amplitud de flujos son activos, una vez que vuelva a existir un runtime observable.

La recuperación debe proteger estas partes. Una reescritura total perdería conocimiento y repetiría años de errores.

## Plan de recuperación recomendado

### Slice 0 — Congelar y proteger datos

Objetivo: volver imposible que una herramienta, test o request borre/exponga la biblioteca por accidente.

- Backup verificado de `db.sqlite` y media roots; documentar restore y ensayarlo sobre copia.
- Base temporal obligatoria para tests, guard de ruta y marca de esquema de test.
- Propagar códigos de salida reales en todos los gates.
- Bind loopback, token de sesión, allowlist de roots y eliminación de rutas debug/test en producción.
- Tests adversariales de rutas y una prueba que demuestre que la base real no cambia.

**Criterio de salida:** test fallido devuelve no-cero; test sin DB aislada aborta; requests sin token/roots son rechazados;
backup se restaura y abre con conteos esperados.

### Slice 1 — Base reproducible y con integridad

Objetivo: poder crear y actualizar el sistema de datos desde un checkout limpio.

- Elegir una única carpeta versionada de migraciones.
- Baseline del esquema real y reconciliación con Drizzle.
- Auditoría/limpieza de huérfanos.
- FKs, `ON DELETE`, timestamps coherentes y transacciones por dominio.
- Comandos `migrate`, `status`, `check`, `backup`, `restore`; eliminar reset destructivo como camino normal.

**Criterio de salida:** una máquina/carpeta limpia crea la misma estructura; `foreign_key_check` es cero; migrar dos veces es
idempotente; rollback/restore está probado.

### Slice 2 — Un runtime web-local realmente distribuible

Objetivo: un comando/artefacto que arranque frontend y backend con el mismo origen y cierre limpiamente.

- Build de producción con `NODE_ENV=production` explícito.
- Unificar el provider de tema y añadir bootstrap error boundary.
- Servir SPA + API desde Express o un launcher único equivalente.
- Configurar data dir, logs, puerto, health y graceful shutdown.
- Smoke Playwright en puerto dinámico, sin servidor reutilizado, DB fixture y cero errores de consola.

**Criterio de salida:** checkout limpio → instalar → migrar → arrancar → dashboard visible → flujo mínimo funciona → restart
conserva datos.

### Slice 3 — Desktop sobre el runtime estable

Objetivo: Tauri administra el backend, no sólo envuelve assets.

- Sidecar/runtime definido y versionado.
- Puerto/token negociados por Tauri, data dir por plataforma, health/restart/shutdown.
- Recursos de bundle mínimos; CSP explícita.
- Installer smoke en una máquina/perfil limpio.

**Criterio de salida:** instalador abre sin herramientas de desarrollo, indexa fixture, reinicia y desinstala sin perder los
datos de usuario.

### Slice 4 — Arquitectura canónica por vertical slice

Objetivo: implementar los ADR sin migración big bang.

- Empezar con un tipo representativo y su flujo completo: `Asset` + source + primary placement + favoritos.
- Migración de datos, lecturas compatibles, reconciliación y retiro medido de proyección legacy.
- Repetir para otros media types sólo después de que la primera slice tenga pruebas y métricas.
- Convertir WORKPLAN en ledger: ADR → esquema → migración → servicio → API → UI → tests → retiro.

**Criterio de salida:** una sola fuente de verdad por concepto; cero divergencias de favoritos/ubicación en reconciliación;
legacy retirado, no sólo marcado deprecated.

### Slice 5 — Flujos originales, uno por uno

Objetivo: recuperar lo que el producto prometía con evidencia de usuario.

Orden recomendado:

1. Registrar root y escanear corpus fixture.
2. Reindex incremental y recuperación tras interrupción.
3. Miniaturas y estados de error/retry.
4. Buscar/filtrar/virtualizar colecciones grandes.
5. Viewer por tipo.
6. Organización, favoritos y metadata.
7. Operaciones de archivo + undo/redo transaccional.
8. Descargas/exportaciones válidas o retiro de opciones falsas.

Cada flujo debe cubrir loading, vacío, error, cancelación, retry, progreso, copy/layout fit y persistencia después de restart.

### Slice 6 — CI, rendimiento, accesibilidad y verdad documental

- CI con install lockfile, migration smoke, test hermético, lint/format/tsc, build, preview smoke y E2E crítico.
- Actualización de dependencias por lotes con audit al final.
- Retirar/mover los assets de emojis después de confirmar procedencia y consumidores.
- Eliminar optimize force, medir startup, budgets de chunks y corpus 1k/10k/100k.
- Reactivar exhaustive deps y reglas a11y por directorios/slices, no con una explosión global sin dueño.
- Índice documental con autoridad y evidencia; archivar afirmaciones históricas engañosas.

**Criterio de salida:** gates fallan cuando deben; build/preview/install son verdes; budgets y smoke visual quedan en CI;
documentación vigente no afirma nada sin prueba enlazada.

## Qué no hacer

- No reescribir todo desde cero.
- No empezar por rebranding, temas, animaciones o nuevos features.
- No “arreglar todos los TODO/any” con una campaña mecánica.
- No ejecutar tests otra vez contra la base real.
- No usar `db:reset` como migración.
- No agregar otra capa genérica de API/servicios; elegir una y retirar las demás por slice.
- No declarar “100%”, “complete” o “production-ready” por conteo de archivos o build verde.
- No empaquetar Tauri hasta que el runtime web-local tenga un smoke real.

## Registro de verificación

- `bun run build:vite`: **PASS técnico**; 123,7 s, 4.679 módulos, warnings de chunks, dist 1,95 GiB.
- Preview del build en Chrome: **FAIL de producto**; root vacío, pantalla blanca, error de contexto de tema.
- `bun run build:server`: **PASS técnico**; 2.263 módulos, bundle de 7,37 MB.
- Backend con copia aislada de DB: **PASS parcial**; health respondió, pero escuchó en `0.0.0.0`.
- `bun run check`: **PASS técnico débil**; 0 lint/TS errors con reglas críticas deshabilitadas.
- `bun run check:full`: **FAIL oculto**; 588 archivos, wrapper devolvió 0.
- `bun run test:ci` con DB aislada: **FAIL oculto**; 26/612 tests, 6/48 archivos; wrapper devolvió 0; 719,18 s.
- `bun run db:check`: **FAIL lógico oculto**; buscó `dev.db`, dijo no encontrada y devolvió 0.
- `bun audit`: **FAIL**; 57 vulnerabilidades (2 critical, 18 high).
- `bun run perf:doctor:score`: **FAIL**; 30/100.
- `cargo check`: **FAIL**; falta `../dist/server/db.sqlite` requerido por recursos Tauri.
- `test:e2e`: **NO EJECUTADO por seguridad/validez**; puerto compartido y DB no aislada.

## Autopsia adversarial

La objeción más fuerte contra este informe es que no se completó un recorrido real con una colección representativa. Es
correcta: hoy no se puede hacerlo de forma segura y válida porque el build no renderiza, E2E puede apuntar a otra app y los
tests pueden destruir la base. Esa ausencia no reduce la severidad; define la primera condición de recuperación. El primer
resultado que debe exigirse no es otra auditoría, sino una slice 0 segura y un smoke web-local reproducible.

El segundo riesgo es que algunas implementaciones “incompletas” tengan consumidores externos no detectados. Por eso el plan
no ordena borrar assets, endpoints o legacy inmediatamente: exige telemetría/inventario, compatibilidad acotada y retiro
probado.

El informe queda cerrado como auditoría. El proyecto queda **no verificado y no apto para release** hasta completar al menos
Slices 0, 1 y 2.
