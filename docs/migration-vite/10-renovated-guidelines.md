# T11 – Directrices Renovadas (Post-Migración)

## Stack final

- **Vite 7** + React 19 + TypeScript 5.5
- **Express 5** (API) / **tRPC 12** optional
- **Vitest 1.4**, **Playwright 1.53**
- **Tailwind CSS 4** (v4.x) + Biome 2
- **Windows first** scripts (pwsh)

## Principios

1. **Framework independence**: Avoid future lock-in.
2. **Universal builds**: Same base code for web + desktop (Tauri/Electron).
3. **Extreme type-safety**: Zod + strict TypeScript.
4. **Total automation**: CI generates Win + Docker artifacts.

## Convenciones

| Capa | Carpeta | Notas |
|------|---------|-------|
| UI React | `src/components` | Componentes funcionales, hooks |
| Routing | `src/router.tsx` | React Router & lazy |
| Estado global | `src/store` | Slices Zustand |
| Servicios | `src/services` | Llamadas fetch/axios |
| API | `src/server/` | Rutas Express & middleware |
| Assets | `src/assets` | Gestionados por Vite |

### Nomenclatura de archivos

- `*.view.tsx` for views.
- `*.slice.ts` for Zustand.
- `*.service.ts` for API calls.

### Orden de imports

1. React/3rd party
2. `@/lib`, `@/services`
3. Local component/ util

## QA & Quality Gates

- Lint & Biome without errors block merge.
- Vitest coverage ≥ 80 %.
- Playwright smoke suite must pass.

## Documentación

- Updated main README with Vite instructions.
- Updated architecture diagram (`docs/architecture.md`).

## Compatibilidad Windows

- Avoid UNIX absolute paths.
- Scripts in PowerShell + Node.

## Roadmap futuros

- Migration to **Bun** when stable Windows support.
- Explore **React Server Components** with Vite SSR plugin.

## Versionado semántico

- Ramas `main` para desarrollo continuo.
- Ramas `release/x.y.z` para versiones estables.
- Etiquetas Git semver (`v1.2.3`).

### Convenciones de testing

- Nombres `*.spec.ts` o `*.spec.tsx`.

### Seguridad

- Aplicar cabeceras OWASP via `helmet` en Express.
- Revisar dependencias con `pnpm audit` en CI.
