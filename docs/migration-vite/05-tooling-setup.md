# T04 – Tooling & Configuración Vite 7

## 1. Instalar Vite y plugin React

```bash
pnpm add -D vite@^7 @vitejs/plugin-react@^4 vite-tsconfig-paths vite-plugin-svgr
```

## 2. Estructura de archivos

```text
/vite.config.ts
/tsconfig.json
/tailwind.config.ts
/postcss.config.cjs
```

## 3. `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' }
  },
  preview: { port: 4173 },
  build: {
    target: 'esnext',
    sourcemap: true
  }
});
```

## 4. Path aliases (tsconfig)

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## 5. Tailwind 4

```bash
pnpm add -D tailwindcss@latest postcss autoprefixer @tailwindcss/postcss
npx tailwindcss init tailwind.config.ts -p
```

Config:

```ts
theme: {
  extend: {}
},
plugins: [require('@tailwindcss/typography')]
```

## 6. tsup para API

```bash
pnpm add -D tsup
```

`tsup.config.ts`:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server/index.ts'],
  sourcemap: true,
  outDir: 'dist/server',
  target: 'node22',
  format: 'esm'
});
```

Agregar script:

```json
"build:server": "tsup"
```

## 7. ESLint + Biome

- **ESLint 9** se mantiene con config existente (`.eslintrc.cjs`).
- **Biome 2** ya configurado. No se requieren cambios.

Agregar script:

```json
"dev:vite": "vite",
"build:vite": "vite build",
"preview:vite": "vite preview",
"watch:server": "tsup --watch --onSuccess \"node dist/server/index.js\""
```

## 8. Husky + Lint‐staged (opcional)

```bash
pnpm add -D husky lint-staged
```

## Validación

- [ ] `pnpm dev:vite` inicia sin errores en 2‒3 s.
- [ ] ESLint y Biome funcionan en HMR.
- [ ] Tailwind genera clases correctamente.
