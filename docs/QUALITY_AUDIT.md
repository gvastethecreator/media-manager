# Auditoría de calidad — 2026-08-11

Se aplicaron diez pasadas de calidad al proyecto, registrando evidencia
observable y dejando abiertos únicamente los gates que requieren un runtime
externo o una decisión de distribución.

| Pasada | Alcance | Resultado |
| --- | --- | --- |
| 1. Contrato de runtime | Bun, scripts, build server, Tauri | ✅ Bun explícito confirmado; no migrar a pnpm |
| 2. Dependencias | `bun update --latest`, lock y `bun outdated` | ✅ lock actualizado; `bun outdated` sin filas |
| 3. Tipos | TypeScript 7, Sharp 0.35, TanStack Table 9 | ✅ `bun run tsc` sin errores |
| 4. Lint | Vite+ Oxlint sobre source/tests/config | ✅ `bun run lint` sin errores; quedan warnings de accesibilidad/tests legacy |
| 5. Tests | Unit/integración aislados | ✅ 87 archivos / 825 tests pasaron; el wrapper quedó esperando un handshake de limpieza Windows y se limpió el quarantine de forma segura |
| 6. Build | Vite cliente + servidor Bun | ✅ `bun run build`; cliente y servidor (`7.74 MB`, 2300 módulos) generados |
| 7. UX/accesibilidad | warnings de handlers no interactivos y labels | ⚠️ deuda existente localizada en file-browser/viewer/cards; no se ocultó |
| 8. Arquitectura | frontera de tablas y metadatos Next residual | ✅ adapter TanStack v9 y eliminación de metadata Next sin uso |
| 9. Rendimiento | chunks, polling, caches y residuos de instalación | ✅ se ignoraron árboles `node_modules-*`; build reportó 40% de hooks de plugin (dato para optimización futura) |
| 10. Documentación/repo | README, docs, `.gitignore`, tasks, `.scratch` | ✅ documentación y tasks actualizados; limpieza selectiva preservando evidencia |

## Lectura de resultados

- La base está lista para continuar desarrollo una vez que el test suite y el
  build confirman el runtime de compilación; E2E requiere una ejecución separada
  porque Playwright agotó el timeout de `webServer` (120 s) aunque los puertos
  locales llegaron a abrirse.
- Los warnings de Oxlint no se convirtieron en errores artificialmente: son
  oportunidades UX concretas para `media-thumbnail`, `file-browser` y
  `file-viewer`, además de tests heredados bajo `skills/effect-solutions-main`.
- El soporte de tablas sigue siendo compatible mediante
  `src/lib/tanstack-react-table.ts`, una frontera explícita para retirar la
  API legacy de TanStack en una tarea posterior.

## Gate de salida

No declarar release autónomo de Tauri todavía: faltan empaquetado fuera del
checkout, supervisión del backend con bindings nativos, firma e instalador.
