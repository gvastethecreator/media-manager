# Actualización de dependencias — 2026-08-11

## Resultado

- Se conservó Bun: este proyecto lo necesita para `dev`, scripts operativos,
  `bun build --target bun`, el servidor Express y el flujo Tauri.
- Se ejecutó `bun update --latest` con Bun 1.3.14 en un workspace limpio y se
  trasladó el `bun.lock` resultante al repositorio.
- `bun outdated` no devuelve filas (solo el encabezado), por lo que no queda
  una actualización declarada pendiente en este checkout.
- No se añadió `pnpm-lock.yaml`: migrar este proyecto rompería el contrato
  runtime documentado arriba. La migración Bun→pnpm se aplica únicamente a
  proyectos sin uso operativo explícito de Bun.

## Cambios de alto impacto y valor

| Área | Versión resultante | Cambio relevante / valor | Changelog primario |
| --- | --- | --- | --- |
| React | 19.2.8 | Correcciones y mejoras de concurrencia para el shell UI actual. | [React releases](https://github.com/facebook/react/releases) |
| TypeScript | 7.0.2 | Compilador actual; detectó directivas `@ts-expect-error` obsoletas. | [TypeScript releases](https://github.com/microsoft/TypeScript/releases) |
| Vite / Vite+ | 8.2.1 / 0.2.8 | Build actual; se usa Vite real para `defineConfig` y Vite+ para lint/format. | [Vite releases](https://github.com/vitejs/vite/releases), [Vite+ releases](https://github.com/voidzero-dev/vite-plus/releases) |
| Vitest | 4.1.10 | Runner y coverage actuales; el config conserva el bloque `test`. | [Vitest releases](https://github.com/vitest-dev/vitest/releases) |
| TanStack Table | 9.1.2 | v9 cambia el orden genérico y pinning `left/right`→`start/end`; se encapsuló la API legacy v8 en `src/lib/tanstack-react-table.ts` para una migración segura. | [Table releases](https://github.com/TanStack/table/releases), [v9 RFC](https://github.com/TanStack/table/discussions/5834) |
| Sharp | 0.35.3 | Tipos ESM actuales (`FitEnum`, `Metadata`, `OutputInfo`, `Sharp`) y procesamiento nativo actualizado. | [Sharp releases](https://github.com/lovell/sharp/releases) |
| Node / tipos | `@types/node` 26.2.0 | Tipos alineados con el tooling moderno y Bun. | [Node releases](https://github.com/nodejs/node/releases) |
| React Router | 7.18.2 | Router actual con las rutas existentes sin introducir Next metadata. | [React Router releases](https://github.com/remix-run/react-router/releases) |
| React Three Fiber / Three | 9.7.0 / 0.185.1 | Compatibilidad actual de renderers 3D y tipos; revisar breaking changes antes de cambiar shaders. | [R3F releases](https://github.com/pmndrs/react-three-fiber/releases), [Three releases](https://github.com/mrdoob/three.js/releases) |
| Effect / Drizzle | 3.22.1 / 0.45.2 | Servicios y persistencia con APIs actuales; se conservan migraciones SQLite. | [Effect releases](https://github.com/Effect-TS/effect/releases), [Drizzle releases](https://github.com/drizzle-team/drizzle-orm/releases) |
| Tailwind / Radix | 4.3.3 / paquetes Radix actuales | Tokens y componentes compatibles con el sistema visual existente. | [Tailwind releases](https://github.com/tailwindlabs/tailwindcss/releases), [Radix releases](https://github.com/radix-ui/primitives/releases) |
| Testing Library / Playwright | 7.0.1 / 1.62.1 | Matchers, jsdom y navegador actualizados; se retiró un `@ts-expect-error` ya innecesario. | [jest-dom releases](https://github.com/testing-library/jest-dom/releases), [Playwright releases](https://github.com/microsoft/playwright/releases) |
| Tauri | API 2.11.1 / CLI 2.11.4 | Shell desktop y tooling de compilación actualizados sin cambiar la CSP. | [Tauri releases](https://github.com/tauri-apps/tauri/releases) |

## Inventario directo verificado

Las versiones siguientes son las declaradas en `package.json` y quedaron
resueltas en `bun.lock`. El inventario completo se mantiene aquí para que una
revisión futura pueda comparar sin depender del estado de `node_modules`.

### Runtime (`dependencies`)

```text
@base-ui-components/react ^1.0.0-rc.0; @dnd-kit/core ^6.3.1; @dnd-kit/modifiers ^9.0.0; @dnd-kit/sortable ^10.0.0; @dnd-kit/utilities ^3.2.2
@effect/platform ^0.97.1; @effect/platform-node ^0.108.1; @effect/schema ^0.75.5; @gsap/react ^2.1.2; @headless-tree/core ^1.7.0
@hookform/resolvers ^5.7.1; @libsql/client ^0.17.4; @monaco-editor/react ^4.7.0; @react-three/drei ^10.7.8; @react-three/fiber ^9.7.0
@tanstack/react-query ^5.101.4; @tanstack/react-query-devtools ^5.101.4; @tanstack/react-table ^9.1.2; @tanstack/react-virtual ^3.14.9
@uiw/react-md-editor ^4.1.1; @xyflow/react ^12.11.2; chalk ^6.0.0; chokidar ^5.0.0; class-variance-authority ^0.7.1; clsx ^2.1.1
cmdk ^1.1.1; date-fns ^4.4.0; drizzle-orm ^0.45.2; effect ^3.22.1; embla-carousel-react ^8.6.0; emoji-picker-react ^4.19.1
event-source-polyfill ^1.0.31; exifr ^7.1.3; express ^5.2.1; express-rate-limit ^8.6.2; ffprobe-static ^3.1.0; gsap ^3.15.0
helmet ^8.3.0; immer ^11.1.16; input-otp ^1.4.2; lodash ^4.18.1; lru-cache 11.5.2; lucide-react ^1.31.0; mediabunny ^1.53.0
music-metadata ^11.14.0; nanoid ^6.0.1; next-themes ^0.4.6; p-queue ^9.3.3; png-itxt ^2.0.0; react ^19.2.8; react-colorful ^5.8.0
react-day-picker ^10.0.1; react-dom ^19.2.8; react-hook-form ^7.85.0; react-markdown ^10.1.0; react-pdf ^10.4.1; react-resizable-panels ^4.12.2
react-router-dom ^7.18.2; react-scan ^0.5.7; recharts 3.10.1; remark-gfm ^4.0.1; selecto ^1.26.3; sharp ^0.35.3; sonner ^2.0.8
systeminformation ^5.33.1; tailwind-merge ^3.6.0; tailwindcss ^4.3.3; three ^0.185.1; use-debounce ^10.1.1; vaul ^1.1.2; zod ^4.4.3; zustand ^5.0.14
@radix-ui/*: accordion ^1.2.20; alert-dialog ^1.1.23; aspect-ratio ^1.1.15; avatar ^1.2.6; checkbox ^1.3.11; collapsible ^1.1.20; context-menu ^2.3.7; dialog ^1.1.23; dropdown-menu ^2.1.24; hover-card ^1.1.23; label ^2.1.15; menubar ^1.1.24; navigation-menu ^1.2.22; popover ^1.1.23; progress ^1.1.16; radio-group ^1.4.7; scroll-area ^1.2.18; select ^2.3.7; separator ^1.1.15; slider ^1.4.7; slot ^1.3.3; switch ^1.3.7; tabs ^1.1.21; toggle ^1.1.18; toggle-group ^1.1.19; tooltip ^1.2.16
```

### Tooling (`devDependencies`)

```text
@happy-dom/global-registrator ^20.11.2; @playwright/test ^1.62.1; @tailwindcss/postcss ^4.3.3; @tauri-apps/api ^2.11.1; @tauri-apps/cli ^2.11.4
@testing-library/jest-dom ^7.0.1; @testing-library/react ^16.3.2; @types/cookie-parser ^1.4.10; @types/cors ^2.8.19; @types/event-source-polyfill ^1.0.5
@types/express ^5.0.6; @types/glob ^9.0.0; @types/lodash ^4.17.25; @types/mdx ^2.0.14; @types/mime-types ^3.0.1; @types/node ^26.2.0
@types/react ^19.2.18; @types/react-color ^3.0.13; @types/react-dom ^19.2.4; @types/react-router-dom ^5.3.3; @types/supertest ^7.2.1; @types/systeminformation ^3.54.1; @types/three ^0.185.4
@vitejs/plugin-react ^6.0.5; autoprefixer ^10.5.4; dotenv ^17.4.2; drizzle-kit ^0.31.10; glob ^13.0.6; happy-dom ^20.11.2; jsdom ^30.0.1; node-mocks-http ^1.18.1
oxfmt ^0.63.0; oxlint ^1.78.0; postcss ^8.5.26; react-doctor ^0.9.11; react-grab ^0.1.50; supertest ^7.2.2; tsx ^4.23.12; tw-animate-css ^1.4.0
typescript 7.0.2; ultracite 7.10.2; vite 8.2.1; vite-plugin-svgr ^5.2.0; vite-plus 0.2.8; vitest 4.1.10; @vitest/coverage-v8 ^4.1.10
```

## Verificación reproducible

```bash
bun install --frozen-lockfile
bun outdated
bun run check
bun run tsc
```

La instalación se probó en un workspace limpio con scripts habilitados para
validar los bindings nativos. El checkout usa la misma combinación de
`package.json` y `bun.lock`; `node_modules` y los logs locales no forman parte
del artefacto versionado.
