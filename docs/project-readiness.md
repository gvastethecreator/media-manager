# Estado de preparación — 2026-08-11

## Estado actual

`media-manager` está en estado **desarrollo listo con gates de runtime
pendientes**. El contrato operativo es Bun; la auditoría no lo cambia por
pnpm porque el backend, los scripts y Tauri dependen explícitamente de Bun.

| Gate | Estado | Evidencia |
| --- | --- | --- |
| Dependencias declaradas/lock | ✅ | `package.json` + `bun.lock`; `bun outdated` sin filas |
| Lint | ✅ | `bun run lint` (sin errores; warnings UX heredados documentados) |
| TypeScript | ✅ | `bun run tsc` (0 errores) |
| Check combinado | ✅ | `bun run check` |
| Unit/integración | ✅ | 87 archivos / 825 tests pasaron; cleanup Windows requirió retirar un quarantine residual |
| Build cliente/servidor | ✅ | `bun run build`; cliente Vite y servidor Bun generados |
| E2E | ⚠️ | Playwright agotó `webServer` en 120 s; los puertos llegaron a abrirse, pero no hubo smoke reproducible |
| Tauri instalable | ⚠️ | compilación y CSP existentes; empaquetado/firma aún no demostrados |

## Cambios aplicados

- Actualización de todas las dependencias directas a las versiones actuales y
  regeneración de `bun.lock`.
- Migración de tipos Sharp y TanStack Table v9 sin downgrade.
- Eliminación de metadata Next residual en una ruta Vite/React.
- `.gitignore` cubre logs/transcripts temporales y `tasks.json` ofrece aliases
  cortos con emojis (`🚀 dev`, `🏗️ build`, `🔎 check`, `🧪 test`, `🎭 e2e`, `📦 deps`).
- `.scratch` se limpió de snapshots/browser probes y bases temporales; se
  preservaron `planning`, `research`, `reviews`, `tooling` y `wayfinder` como
  evidencia durable.

## Próximo gate material

Cerrar test suite, build y smoke E2E; luego regenerar el code map y revisar los
warnings UX antes de afirmar una release de escritorio.
