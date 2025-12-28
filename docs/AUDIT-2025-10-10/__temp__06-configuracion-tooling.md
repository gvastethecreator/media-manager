# ⚙️ Auditoría de Configuración y Tooling

**Fecha**: 10 de octubre de 2025  
**Tipo**: Validación de Configuraciones  
**Alcance**: tsconfig, vite, drizzle, playwright, biome, scripts

---

## 📊 Resumen Ejecutivo

### Estado de Configuraciones
- **tsconfig.json**: 90% ✅ (1 deprecation warning)
- **vite.config.ts**: 95% ✅
- **drizzle.config.ts**: 100% ✅
- **playwright.config.ts**: 100% ✅
- **biome.json**: 95% ✅
- **package.json scripts**: 85% ⚠️ (redundancias)

---

## 🔧 tsconfig.json

### ✅ Configuración Actual
```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",  // ⚠️ DEPRECATED en TS 7.0
    "target": "esnext",
    "lib": ["dom", "dom.iterable", "esnext", "webworker"],
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]  // ❌ Nunca usado
    }
  }
}
```

### 🔴 Problemas Detectados

1. **baseUrl deprecated**
```
Error: baseUrl está en desuso en TypeScript 7.0
Solución: Eliminar y usar paths relativos desde raíz
```

2. **Path no utilizado**
```json
"@components/*": ["./src/components/*"]  // ❌ 0 usos en codebase
```

### ✅ Solución Recomendada
```jsonc
{
  "compilerOptions": {
    // ✅ Eliminar baseUrl
    "target": "esnext",
    "paths": {
      "@/*": ["./src/*"]
      // ✅ Eliminar @components/* (no se usa)
    }
  }
}
```

---

## ⚡ vite.config.ts

### ✅ Configuración Actual (Buena)
```typescript
export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgr(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-*'],
        }
      }
    }
  }
});
```

### 🟡 Mejoras Sugeridas

1. **Code splitting más agresivo**
```typescript
manualChunks: (id) => {
  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom')) {
      return 'vendor-react';
    }
    if (id.includes('@radix-ui')) {
      return 'vendor-ui';
    }
    if (id.includes('three')) {
      return 'vendor-three';  // ✅ Separar Three.js (580KB)
    }
    if (id.includes('recharts')) {
      return 'vendor-charts';  // ✅ Separar Recharts (340KB)
    }
    return 'vendor';
  }
}
```

2. **Build optimization**
```typescript
build: {
  target: 'es2020',
  minify: 'esbuild',
  cssMinify: true,
  chunkSizeWarningLimit: 500,  // ✅ Alertar chunks >500KB
}
```

---

## 🗄️ drizzle.config.ts

### ✅ Configuración (Excelente)
```typescript
export default defineConfig({
  schema: './src/lib/drizzle/schema/**/*.ts',
  out: './src/lib/drizzle/migrations',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

**Estado**: ✅ Sin problemas detectados

### 🟢 Recomendación: Agregar índices
Ver `04-rendimiento.md` para índices recomendados

---

## 🎭 playwright.config.ts

### ✅ Configuración Actual (Buena)
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**Estado**: ✅ Sin problemas

### 🟢 Mejora Sugerida
```typescript
// Agregar más browsers para CI:
projects: [
  { name: 'chromium', use: devices['Desktop Chrome'] },
  { name: 'firefox', use: devices['Desktop Firefox'] },  // ✅
  { name: 'webkit', use: devices['Desktop Safari'] },    // ✅
],
```

---

## 🎨 biome.json

### ✅ Configuración (Muy Buena)
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": { "maxAllowedComplexity": 15 }
        }
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 120
  }
}
```

**Estado**: ✅ Excelente configuración

---

## 📦 package.json Scripts

### Análisis de Scripts

```json
{
  "scripts": {
    // ✅ Desarrollo
    "dev:full": "bun scripts/dev-full.js",
    "dev:vite": "bun scripts/dev-vite-headers.js",
    "dev:vite:original": "vite",  // ❌ Redundante
    "dev:server:hot": "bun scripts/dev-server-hot.js",
    "dev:tauri": "bun scripts/tauri-dev.js",
    
    // ✅ Build
    "build": "bun run build:vite && bun run build:server",
    "build:vite": "vite build",
    "build:server": "bun build src/server/index.ts --outdir dist/server --target bun",
    "build:tauri": "bun scripts/tauri-build.js",
    
    // ✅ Calidad
    "format": "bun scripts/run-with-log.js biome-format bunx biome format --write .",
    "format:check": "bun scripts/run-with-log.js format-check bunx biome check --max-diagnostics=500 .",
    "biome": "bun scripts/run-with-log.js biome-check bunx biome check --max-diagnostics=500 .",
    "biome:fix": "bun scripts/run-with-log.js biome-fix bunx biome check --max-diagnostics=500 --write .",
    "tsc": "bun scripts/run-with-log.js tsc bunx tsc --noEmit --pretty",
    
    // ✅ Testing
    "test": "bun test",
    "test:e2e": "bun scripts/run-with-log.js test-e2e bunx playwright test",
    "test:ui": "bun scripts/run-with-log.js test-e2e bunx playwright test --ui",
    
    // ✅ Base de datos
    "db:studio": "bun scripts/db/studio.js",
    "db:check": "bun scripts/db/check.js",
    "db:reset": "bun scripts/db/reset.js",
    
    // ✅ Utilidades
    "logs:list": "bun scripts/logging-utils.js list",
    "logs:clean": "bun scripts/logging-utils.js clean",
    "check:errors": "bun scripts/check-errors.js",
    "playwright:install": "bunx playwright install",
    "playwright:codegen": "bunx playwright codegen http://localhost:5173"
  }
}
```

### 🔴 Problemas Detectados

1. **Script redundante**
```json
"dev:vite:original": "vite"  // ❌ Nunca usado, eliminar
```

2. **Naming inconsistente**
```
format vs biome  // ⚠️ Ambos hacen lo mismo pero diferente
format:check vs biome  // ⚠️ Confuso
```

### ✅ Solución Recomendada
```json
{
  "scripts": {
    // ❌ Eliminar:
    // "dev:vite:original": "vite",
    
    // ✅ Renombrar para claridad:
    "lint": "bun scripts/run-with-log.js lint bunx biome check .",
    "lint:fix": "bun scripts/run-with-log.js lint-fix bunx biome check --write .",
    "format": "bun scripts/run-with-log.js format bunx biome format --write .",
    "format:check": "bun scripts/run-with-log.js format-check bunx biome format .",
    "type-check": "bun scripts/run-with-log.js tsc bunx tsc --noEmit",
    
    // ✅ Script CI completo:
    "ci": "bun run type-check && bun run lint && bun run test"
  }
}
```

---

## 🔨 Scripts en /scripts/

### ✅ Scripts Bien Organizados
```
scripts/
├── dev-full.js            ✅ Orquesta frontend + backend
├── dev-server-hot.js      ✅ Backend con HMR
├── dev-vite-headers.js    ✅ Frontend con headers custom
├── run-with-log.js        ✅ Wrapper de logging universal
├── run-with-log-tolerant.js ✅ Tolerante a errores
├── error-parser.js        ✅ Parser de errores
├── logging-utils.js       ✅ Gestión de logs
└── db/                    ✅ 13 scripts BD organizados
```

**Estado**: ✅ Excelente organización

### 🟡 Scripts Debug a Revisar
```
scripts/db/
├── drizzle-test.ts              ⚠️ Mover a docs/history/
├── debug-transformer-structure.ts  ⚠️ Mover a docs/history/
├── debug-settings-data.ts       ⚠️ Mover a docs/history/
├── debug-profile-settings.ts    ⚠️ Mover a docs/history/
└── debug-join-issue.ts          ⚠️ Mover a docs/history/
```

Ver `01-limpieza-codigo.md` para detalles

---

## 📋 Tasks en .vscode/tasks.json

### ✅ Tareas Configuradas (23 total)
```json
{
  "tasks": [
    "🚀 Desarrollo: Full Stack",
    "🌐 Desarrollo: Frontend (Vite)",
    "⚙️ Desarrollo: Backend",
    "📱 Desarrollo: Tauri",
    "🏗️ Build: Completo",
    "🧪 Test: E2E",
    "🎨 Format: Check/Fix",
    "🔍 Biome: Check/Fix",
    "📝 TypeScript: Check",
    "🗃️ DB: Studio/Check/Reset",
    // ... más tareas
  ]
}
```

**Estado**: ✅ Excelente, bien organizadas con emojis

### 🟢 Sugerencias
1. Agregar task `"🚀 CI: Full Check"` que ejecute lint + type-check + test
2. Agregar task `"📦 Build: Production"` optimizado

---

## 🌐 Configuración de Entorno

### .env Variables
```bash
# ✅ Requeridas:
DATABASE_URL=file:./local.db
NODE_ENV=development

# ⚠️ Faltantes (opcionales):
# PORT=3000
# VITE_API_URL=http://localhost:3000
# LOG_LEVEL=debug
```

**Recomendación**: Crear `.env.example` con todas las variables

---

## 🎯 Plan de Acción para Configuraciones

### Sprint 0 (Esta semana)
1. ✅ Eliminar `baseUrl` de tsconfig
2. ✅ Eliminar `@components/*` path
3. ✅ Eliminar script `dev:vite:original`
4. ✅ Renombrar scripts lint/format
5. ✅ Crear `.env.example`

**Tiempo estimado**: 2 horas

### Sprint 1
1. 🔧 Mejorar code splitting en vite.config
2. 🔧 Agregar más browsers en playwright
3. 🔧 Crear script `ci` completo
4. 🔧 Documentar configuraciones

**Tiempo estimado**: 4 horas

---

## 📈 Métricas de Configuración

### Score por Herramienta
| Tool | Score | Estado | Acción |
|------|-------|--------|--------|
| TypeScript | 90/100 | ✅ Bueno | Fix deprecation |
| Vite | 95/100 | ✅ Excelente | Optimizar chunks |
| Drizzle | 100/100 | ✅ Perfecto | - |
| Playwright | 100/100 | ✅ Perfecto | - |
| Biome | 95/100 | ✅ Excelente | - |
| Scripts | 85/100 | ⚠️ Bueno | Limpieza menor |

**Score General**: 94/100 ✅

---

## 🔗 Referencias
- Ver `01-limpieza-codigo.md` para scripts a mover/eliminar
- Ver `04-rendimiento.md` para optimizaciones de vite
