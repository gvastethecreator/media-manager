# 🚀 Guía de Setup - Image Manager Next

## 📋 Requisitos Previos

1. **Sistema Operativo**
   - Windows 11 (recomendado)
   - WSL2 (opcional, pero recomendado para desarrollo)
   - PowerShell 7+ (recomendado)

2. **Software Base**
   - Node.js 18+ LTS
   - pnpm 8+
   - Git 2.3+
   - VSCode (recomendado)
   - SQLite 3.4+

3. **Extensiones VSCode Recomendadas**
   ```json
   {
     "recommendations": [
       "prisma.prisma",
       "bradlc.vscode-tailwindcss",
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "eamodio.gitlens",
       "formulahendry.auto-rename-tag",
       "christian-kohler.path-intellisense",
       "streetsidesoftware.code-spell-checker",
       "naumovs.color-highlight",
       "ms-vscode.vscode-typescript-next"
     ]
   }
   ```

## 🔧 Paso a Paso

### 1. Preparación del Entorno

```bash
# Verificar versiones
node -v  # debe ser 18+
pnpm -v  # debe ser 8+
git --version
sqlite3 --version

# Crear directorio del proyecto
mkdir image-manager-next
cd image-manager-next

# Inicializar git
git init
git config core.autocrlf false  # Importante en Windows
```

### 2. Crear Proyecto Next.js

```bash
# Crear proyecto con configuración completa
pnpm create next-app . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm

# Configurar .npmrc
echo "auto-install-peers=true
strict-peer-dependencies=false
save-workspace-protocol=rolling
save-prefix=''
engine-strict=true" > .npmrc
```

### 3. Instalar Dependencias

```bash
# Core dependencies
pnpm add @prisma/client @tanstack/react-query zod zustand

# UI dependencies
pnpm add @motionone/dom class-variance-authority clsx tailwind-merge lucide-react
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip

# File system & image processing
pnpm add sharp chokidar exifr

# Development dependencies
pnpm add -D prisma @types/node prettier prettier-plugin-tailwindcss
pnpm add -D @types/sharp @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D eslint-plugin-react-hooks husky lint-staged
```

### 4. Configurar shadcn/ui

```bash
# Instalar CLI y componentes base
pnpm dlx shadcn-ui@latest init

# Instalar componentes necesarios
pnpm dlx shadcn-ui@latest add button card dialog dropdown-menu toast tooltip
```

### 5. Configurar Prisma

```bash
# Inicializar Prisma
pnpm prisma init

# Crear estructura de carpetas para la base de datos
mkdir -p prisma/migrations prisma/seeds
```

**prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Copiar los modelos del archivo BACKEND.md
```

```bash
# Generar cliente y crear base de datos
pnpm prisma generate
pnpm prisma db push

# Crear seed inicial
pnpm prisma db seed
```

### 6. Configurar ESLint y Prettier

**.eslintrc.json**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**.prettierrc**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 7. Configurar Estructura de Carpetas

```bash
# Crear estructura base
mkdir -p src/{components/{core,features,ui},lib/{db,fs},services/{core,features},store,types}

# Crear archivos base
touch src/lib/prisma.ts
touch src/lib/utils.ts
touch src/lib/fs/watcher.ts

# Crear servicios base
touch src/services/core/{fs,cache,watcher}.server.ts
touch src/services/features/{collection,folder,image,profile,tag,favorites,stats}.service.ts

# Crear tipos base
touch src/types/{files,settings,collection,profile}.ts
```

### 8. Configurar Variables de Entorno

**.env**
```env
# Database
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# File System
THUMBNAIL_CACHE_DIR="public/thumbnails"
MAX_CACHE_SIZE="1024" # MB
WATCH_INTERVAL="5000" # ms

# Features
ENABLE_FILE_WATCHING=true
ENABLE_CACHE=true
```

### 9. Configurar Scripts

**package.json**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "prepare": "husky install"
  }
}
```

### 10. Configurar Git Hooks

```bash
# Inicializar husky
pnpm dlx husky-init && pnpm install

# Configurar lint-staged
echo '{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}' > .lintstagedrc.json

# Configurar pre-commit hook
npx husky add .husky/pre-commit "pnpm lint-staged"
```

### 11. Configurar VSCode

**.vscode/settings.json**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

## 🧪 Verificación del Setup

1. **Verificar Estructura**
```bash
tree -L 3 src/
```

2. **Verificar TypeScript**
```bash
pnpm type-check
```

3. **Verificar ESLint**
```bash
pnpm lint
```

4. **Verificar Prisma**
```bash
pnpm db:studio
```

5. **Verificar Next.js**
```bash
pnpm dev
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Error de Prisma**
```bash
# Regenerar cliente Prisma
pnpm prisma generate --force

# Limpiar caché de Prisma
rm -rf node_modules/.prisma
```

2. **Error de Next.js**
```bash
# Limpiar caché de Next.js
rm -rf .next
pnpm dev
```

3. **Error de TypeScript**
```bash
# Limpiar caché de TypeScript
rm -rf node_modules/.cache
pnpm type-check
```

4. **Error de pnpm**
```bash
# Regenerar lock file
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 Notas Importantes

1. **Permisos de Sistema**
   - Asegurarse de tener permisos de escritura en el directorio del proyecto
   - En Windows, ejecutar PowerShell como administrador si es necesario

2. **Rendimiento**
   - Excluir directorios del antivirus (node_modules, .next)
   - Configurar Windows Defender si es necesario

3. **VSCode**
   - Reiniciar VSCode después de instalar extensiones
   - Usar la versión de TypeScript del workspace

4. **Git**
   - Configurar .gitignore adecuadamente
   - No commitear archivos de entorno (.env)
   - No commitear base de datos SQLite

## 🔄 Actualización y Mantenimiento

1. **Actualizar Dependencias**
```bash
# Verificar actualizaciones
pnpm outdated

# Actualizar dependencias
pnpm update
```

2. **Mantenimiento de Base de Datos**
```bash
# Backup
sqlite3 prisma/dev.db ".backup 'backup.db'"

# Verificar integridad
sqlite3 prisma/dev.db "PRAGMA integrity_check;"
```

3. **Limpieza**
```bash
# Limpiar caché
pnpm clean

# Limpiar thumbnails antiguos
rm -rf public/thumbnails/*
```