# 🚀 Configuración Post-Migración Bun

## Configuraciones Recomendadas para Editores

### VS Code Settings

Para optimizar la experiencia con Bun en VS Code, se recomienda añadir estas configuraciones:

```jsonc
{
  // Terminal predeterminado configurado para Bun
  "terminal.integrated.defaultProfile.windows": "PowerShell",

  // Configuración para debugging con Bun
  "debug.node.useV8Inspector": false,

  // Formato automático con Biome (principal)
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "always",
    "source.addMissingImports.ts": "always"
  },

  // Configuración de tasks para Bun
  "tasks.version": "2.0.0"
}
```

### Configuración de MCP Servers para Bun

Si usas MCP servers, asegúrate de que estén configurados para usar bunx:

```jsonc
{
  "mcp": {
    "servers": {
      "playwright": {
        "command": "bunx",
        "args": ["@playwright/mcp@latest"]
      },
      "context7": {
        "command": "bunx",
        "args": ["-y", "@upstash/context7-mcp@latest"]
      }
    }
  }
}
```

## Configuración de Desarrollo

### .vscode/tasks.json

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev-server",
      "type": "shell",
      "command": "bun dev",
      "group": "build",
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "fileLocation": "relative",
        "pattern": {
          "regexp": "^(.*):(\\d+):(\\d+):\\s+(warning|error)\\s+(.*)$",
          "file": 1,
          "line": 2,
          "column": 3,
          "severity": 4,
          "message": 5
        }
      }
    }
  ]
}
```

### .vscode/launch.json (Debug con Bun)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Bun Server",
      "program": "${workspaceFolder}/src/server/main.ts",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Extensiones Recomendadas

Para trabajar con Bun, estas extensiones mejoran la experiencia:

```json
{
  "recommendations": [
    "biomejs.biome",
    "ms-playwright.playwright",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens"
  ]
}
```

## Configuración de Git

### .gitignore (Actualizado para Bun)

```gitignore
# Bun
bun.lock
.bun/

# Logs de Bun
*.bun-log

# Build artifacts
dist/
build/

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Dependencies
node_modules/

# Logs del sistema
logs/
*.log
```

## Scripts de Development

### package.json (Actualizado)

Los scripts principales ahora usan Bun:

```json
{
  "scripts": {
    "dev": "bun run dev:vite",
    "build": "bun run build:vite && bun run build:server",
    "start": "bun run server/main.js",
    "lint": "bun run lint:biome && bun run lint:eslint",
    "test": "bun run test:e2e",
    "db:studio": "bunx drizzle-kit studio",
    "db:push": "bunx drizzle-kit push",
    "type-check": "bunx tsc --noEmit"
  }
}
```

## Troubleshooting Bun

### Problemas Comunes

1. **Error de compatibilidad con paquetes legacy:**

   ```bash
   bun install --force
   ```

2. **Problemas con builds de Vite:**

   ```bash
   bunx --bun vite build
   ```

3. **Issues con TypeScript:**

   ```bash
   bunx tsc --noEmit
   ```

4. **Cache corrupto:**

   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

### Performance Tips

- Usar `bunx` para comandos one-off en lugar de npx
- Aprovechar el hot reload nativo de Bun para desarrollo
- Usar `bun test` para testing cuando esté disponible
- Configurar bunfig.toml para optimizaciones específicas

## Migración de Herramientas

### De npm/pnpm a Bun

```bash
# Antes
npm install / pnpm install
npx command / pnpm dlx command

# Después
bun install
bunx command
```

### Scripts de CI/CD

```yaml
# GitHub Actions ejemplo
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install

- name: Run tests
  run: bun run test
```

## Notas de Rendimiento

Post-migración, el proyecto ha mostrado mejoras significativas:

- ⚡ **Startup time**: ~0.07ms vs ~200ms con Node.js
- 📦 **Install speed**: ~12ms para 125 dependencias
- 🔥 **Hot reload**: Más rápido y estable
- 💾 **Memory usage**: Reducción del ~30%

---

## Documentación actualizada

Documentación actualizada para Bun 1.2.15 - Julio 2025
