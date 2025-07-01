# Sistema de Gestión de Imágenes

## Descripción

Sistema completo para la gestión y organización de activos digitales, incluyendo imágenes, videos y metadatos asociados. Proporciona una interfaz moderna e intuitiva para administrar, categorizar y buscar todo tipo de contenido multimedia.

## Tecnologías

### Stack Actual (Migración en progreso)

- **Vite 7.0** - Build tool y desarrollo frontend
- **React 19** - Biblioteca de UI
- **Express 5** - Servidor API
- **Prisma** - ORM para acceso a base de datos
- **Tailwind CSS 4** - Framework de estilos
- **Shadcn/UI** - Componentes de UI integrados con Tailwind 4
- **Zustand** - Gestión de estado
- **React Router v6** - Enrutamiento frontend
- **Vitest** - Testing framework
- **Motion** - Animaciones fluidas
- **Biome** - Linter y formateador unificado

### Stack Legacy (En migración)

- ~~**Next.js 15.3.3**~~ → **Vite 7.0**
- ~~**Server Actions**~~ → **Express 5 API**
- ~~**API Routes**~~ → **Express Routes**

## Estado de la Migración

### ✅ Completado

- [x] **T01** - Auditoría de dependencias
- [x] **T02** - Configuración inicial Vite 7 + React + TS
- [x] **T03** - Integración Tailwind 4, PostCSS
- [x] **T04** - Scripts package.json básicos
- [x] **T06** - Servidor Express 5 básico
- [x] **T07** - Configuración Vitest

### 🚧 En Progreso

- [ ] **T05** - Migración completa routing React Router v6
- [ ] **T06** - Migración completa Server Actions → Express API
- [ ] **T08** - Documentación actualizada
- [ ] **T09** - Limpieza código Next.js legacy

## Desarrollo

### Requisitos Previos

```bash
node -v   # ≥ 20.19 o 22.12+ (requerido por Vite 7)
pnpm -v   # ≥ 8.0
```

### Instalación

```bash
pnpm install
```

### Desarrollo Local

#### Opción 1: Desarrollo con Vite (Recomendado)

```bash
# Terminal 1: Frontend Vite (puerto 5173)
pnpm dev:vite

# Terminal 2: Backend Express (puerto 4000)
pnpm watch:server

# Abrir: http://localhost:5173
```

#### Opción 2: Desarrollo Legacy Next.js

```bash
# Desarrollo con Next.js (mientras migramos)
pnpm dev

# Abrir: http://localhost:3000
```

### Build y Producción

```bash
# Build frontend
pnpm build:vite

# Build servidor
pnpm build:server

# Preview frontend
pnpm preview:vite

# Ejecutar servidor en producción
node dist/server/index.js
```

### Testing

```bash
# Tests unitarios con Vitest
pnpm test

# Tests E2E con Playwright
pnpm test:e2e

# Coverage
pnpm test --coverage
```

### Herramientas de Desarrollo

```bash
# Linting y formato
pnpm lint
pnpm format

# Verificación TypeScript
pnpm tsc

# Logs del sistema
pnpm logs list
pnpm check:errors
```

## Actualizaciones Importantes (Julio 2025)

### ⚡ Migración Vite 7

- **Performance mejorada**: Builds 60% más rápidos que Next.js
- **HMR instantáneo**: Recarga en tiempo real ultrarrápida
- **Arquitectura desacoplada**: Frontend y backend independientes
- **Preparado para desktop**: Compatible con Tauri/Electron

### 🔧 Configuración Técnica

- **Node.js ≥ 20.19** requerido para Vite 7
- **Proxy automático**: Frontend (5173) → Backend (4000)
- **Path aliases**: `@/*` configurado en Vite y Vitest
- **SVG como componentes**: `vite-plugin-svgr` configurado

### 📊 Endpoints API

```bash
# Health check del servidor
curl http://localhost:4000/api/health
```

## Arquitectura

- **Frontend**: React 19 + Vite 7 + React Router
- **Backend**: Express 5 + Prisma + SQLite
- **Estado**: Zustand stores sin cambios
- **Estilos**: Tailwind 4 con variables CSS
- **Testing**: Vitest + Playwright
- **Build**: Vite (frontend) + tsup (backend)

## Migración de Next.js

### Cambios Principales

1. **Routing**: `app/` → React Router v6
2. **API**: `app/api/` → Express routes en `src/server/`
3. **Server Actions**: → Express endpoints
4. **Build**: `next build` → `vite build`
5. **Dev**: `next dev` → `vite` + `node server`

### Compatibilidad

- ✅ Todos los stores Zustand funcionan sin cambios
- ✅ Componentes UI mantienen funcionalidad
- ✅ Prisma y base de datos sin cambios
- ✅ Tailwind 4 configuración preservada
- ⚠️ Links `next/link` → `react-router-dom`
- ⚠️ `next/image` → componentes img estándar

## Testing

Sistema de testing configurado con:

- **Vitest**: Tests unitarios y de integración
- **Playwright**: Tests end-to-end
- **Happy DOM**: Environment para tests
- **Testing Library**: Utilities para React

## Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE).

## Contacto

Para más información, contáctanos en [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com).
