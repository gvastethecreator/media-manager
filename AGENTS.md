# AGENTS.md - Image Manager Repository Guide

This guide provides essential information for AI agents working in this repository. Follow these patterns, conventions, and commands to work effectively.

---

## 📋 Project Overview

**Type**: Monolithic client-server application (web + desktop via Tauri)
**Purpose**: Intelligent multimedia file management system for large volumes of content
**Tech Stack**: React 19 + Express + Bun + Drizzle ORM + SQLite + Playwright + Tauri

---

## 🚀 Essential Commands

### Development

```bash
# Full development (frontend + backend + HMR)
bun run dev:full

# Frontend only (Vite dev server)
bun run dev:vite

# Backend only (Express with HMR)
bun run dev:server:hot

# Tauri desktop development
bun run dev:tauri
```

### Build

```bash
# Full build (frontend + server)
bun run build

# Frontend build only
bun run build:vite

# Server build only
bun run build:server

# Tauri desktop build
bun run build:tauri
```

### Testing

```bash
# Unit tests (Vitest)
bun run test
bun run test:watch  # Watch mode
bun run test:ci    # With coverage

# E2E tests (Playwright)
bun run test:e2e
bun run test:ui          # UI mode
bun run test:e2e:debug   # Debug mode
```

### Code Quality

```bash
# Lint and format check
bun run biome
bun run format:check

# Auto-fix issues
bun run biome:fix
bun run format

# Type checking
bun run tsc
```

### Database Operations

```bash
# Open Drizzle Studio (database GUI)
bun run db:studio

# Check database status
bun run db:check

# Reset database (destructive!)
bun run db:reset

# Migrate entity aggregates
bun run db:migrate:aggregates

# Cleanup operations
bun run db:cleanup-phantoms
bun run db:cleanup-cursed
bun run db:generate-video-thumbnails
```

### Logging & Debugging

```bash
# List logs
bun run logs:list

# Clean logs
bun run logs:clean

# Check errors
bun run check:errors
```

---

## 🏗️ Project Structure

### Core Architecture

```
src/
├── components/          # React components
│   ├── ui/             # Primitives (Button, Input, etc.)
│   ├── views/          # Full page views (one per entity)
│   └── features/       # Complex features (file-browser, etc.)
├── server/             # Express backend
│   ├── routes/         # API route handlers
│   └── middleware/     # HTTP middleware
├── services/           # Domain services (one per entity)
├── transformers/       # DTO/View transformers
├── store/             # Zustand stores (UI state)
├── lib/               # Utilities and shared code
│   ├── drizzle/        # ORM schema and migrations
│   └── logger/         # Logging utilities
├── types/              # TypeScript type definitions
├── config/             # App configuration
├── hooks/              # Custom React hooks
├── providers/          # React Context providers
└── styles/             # Global styles and design tokens
```

### Database Schema Organization

The Drizzle schema is divided by domains:

```
src/lib/drizzle/schema/
├── core/           # Fundamental tables (queueJobs, profiles, settings, thumbnails, activities, fileStats, metadatas, entityAggregates)
├── files/          # Media files (images, videos, audios, uploadedImages, documents, jsonFiles, file3Ds)
├── organization/    # Content organization (folders, albums, collections, groups, favorites, files)
├── taxonomy/        # Classification (tags, properties, wildcards, prompts, notes, tasks)
├── worldbuilding/   # Worldbuilding entities (characters, places, concepts, worldItems)
└── relations/       # Many-to-many relationship tables
```

---

## 🔑 Key Patterns & Conventions

### 1. Service Layer Pattern

Each entity has a dedicated service in `src/services/<entity>/`:

```
src/services/video/
├── video.service.ts         # Main CRUD service
├── video.service.effect.ts  # Effect-TS version (if applicable)
├── video-events.ts          # Event emitters
└── video-errors.effect.ts   # Error handling

⚠️ **IMPORTANT**: We intentionally avoid barrel files (`index.ts`) in services and transformers for performance reasons and Biome best practices. Import directly from specific files.
```

**Service Methods Pattern**:
- `list(filters, pagination)` - Query with filters
- `get(id)` - Single entity fetch
- `create(input)` - Create new entity
- `update(id, input)` - Update entity
- `delete(id)` - Delete entity
- Additional domain-specific methods

### 2. Transformer Pattern

Transformers convert Drizzle models to view-ready DTOs in `src/transformers/<entity>/`:

```
src/transformers/video/
├── transformer.ts      # Main transformer functions
├── mappers.ts          # Data mapping helpers
├── serializers.ts      # Serialization logic
├── validators.ts      # Input validation
└── schema.ts          # Zod schemas
```

**Naming Convention**:
- `fromDrizzle<Entity>WithCounts(drizzleEntity)` - Main transformer
- Return type: `<Entity>WithStats` (includes computed stats)

### 3. Route Handler Pattern

Express routes in `src/server/routes/<entity>.ts`:

```typescript
// RESTful pattern
router.get('/', get<Entities>)           // List with filters
router.get('/:id', get<Entity>ById)      // Single entity
router.post('/', create<Entity>)          // Create
router.put('/:id', update<Entity>)       // Update
router.delete('/:id', delete<Entity>)    // Delete

// Specialized routes
router.get('/folder/:id', get<Entities>ByFolder)
router.post('/:id/thumbnail', generateThumbnail)
```

**Route Handler Structure**:
1. Validate input with Zod schemas
2. Call service layer (not Drizzle directly)
3. Transform results with transformers
4. Send response with proper error handling

### 4. Store Pattern (Zustand)

UI state managed in `src/store/` with fine-grained stores:

```typescript
// Pattern: immer + devtools + persist
const use<Store>Base = create<StoreState>()(
  devtools(
    zustandPersist(
      immer((set, get) => ({
        // State
        data: null,
        isLoading: false,
        error: null,

        // Actions
        load: async () => { /* ... */ },
        update: async (data) => { /* ... */ },
      }))
    )
  )
);

// Create selectors for performance
export const use<Store> = createSelectors(use<Store>Base);
```

**Avoid**: Mega-stores (keep stores focused and small)

### 5. TanStack Query Pattern

Server state fetching with semantic keys:

```typescript
// Key pattern: [entity, operation, identifier]
queryKey: ['videos', 'byFolder', folderId]

// Query function pattern
queryFn: () => videosService.getByFolder(folderId)

// Cache configuration
staleTime: 5 * 60 * 1000,  // 5 minutes
```

### 6. Import Path Conventions

**Use absolute paths** (configured in tsconfig.json):

```typescript
// ✅ Correct - Import directly from specific files (no barrel files)
import { videoService } from '@/services/video/video.service.effect';
import { Button } from '@/components/ui/button';
import type { Video } from '@/types/entities/video';

// ❌ Avoid relative deep paths
import { videoService } from '../../../services/video/video.service.effect';
```

Available aliases:
- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`

### 7. Component Architecture

**UI Primitives** (`src/components/ui/`):
- Based on Radix UI
- Styled with Tailwind CSS
- Use `cva` (class-variance-authority) for variants
- Follow shadcn/ui patterns

**Views** (`src/components/views/`):
- One view per entity
- Pattern: `<EntityView>`, `<EntityContentView>`, `<Entity>ContentView>`
- Include proper TypeScript types

**Features** (`src/components/features/`):
- Complex, multi-component features
- Example: file-browser, file-viewer

---

## 🎨 Design System & Styling

### Design Tokens v2.0

El proyecto usa un sistema completo de tokens CSS centralizados:

**Archivos principales:**
- `src/styles/tokens.css` - Tokens semánticos de color (entidades, estados, UI)
- `src/styles/design-tokens.css` - Design tokens v2.0 (paletas, sombras, timing)
- `src/styles/utilities/theme-system.css` - Sistema de themes y transiciones
- `src/styles/utilities/transitions.css` - Transiciones de estado
- `src/styles/utilities/animations.css` - Animaciones keyframes
- `src/styles/utilities/typography.css` - Sistema tipográfico

**Tokens de color disponibles:**
```css
/* Variables de tema (shadcn/ui compatibles) */
--background, --foreground
--card, --card-foreground
--popover, --popover-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring

/* Paletas de design tokens */
--dt-primary-50 a --dt-primary-950
--dt-neutral-50 a --dt-neutral-950
--dt-success-50 a --dt-success-900
--dt-warning-50 a --dt-warning-900
--dt-danger-50 a --dt-danger-900

/* Colores de entidades */
--entity-image, --entity-video, --entity-audio
--entity-folder, --entity-album, --entity-collection
--entity-character, --entity-place, --entity-tag

/* Sombras */
--dt-shadow-0 a --dt-shadow-4
--dt-inset-1, --dt-inset-2

/* Timing */
--dt-duration-instant: 50ms
--dt-duration-fast: 150ms
--dt-duration-normal: 250ms
--dt-duration-slow: 400ms
```

### Sistema de Themes

**14 temas disponibles:**
- `light` - Tema claro por defecto
- `dark` - Tema oscuro por defecto
- `cafe` - Tonos marrones cálidos
- `violeta` - Púrpuras oscuros
- `madera` - Tonos madera neutros
- `nocturno` - Azulado para fatiga visual
- `verde` - Esmeralda oscuro
- `atardecer` - Naranjas y rojos
- `corporativo` - Azul profesional
- `carbon` - Negro carbón
- `teal` - Verde azulado
- `citrico` - Amarillos vibrantes
- `aurora` - Inspirado en auroras boreales
- `neon` - Estilo cyberpunk/neón

**Uso del Theme Provider:**
```tsx
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';

// En App.tsx
<ThemeProvider defaultTheme="system" storageKey="theme">
  {children}
</ThemeProvider>

// En componentes
const { theme, setTheme, themes, resolvedTheme } = useTheme();
setTheme('dark'); // o cualquier tema disponible
```

**Theme Toggle:**
```tsx
import { ThemeToggle } from '@/components/core/theme/theme-toggle';

// O usar directamente desde NavPanelHeader (ya integrado)
```

### Tailwind Configuration

- Framework: Tailwind CSS 4
- CSS variables para theming (OKLCH)
- Animaciones border-pulse para estados activos
- Transiciones fluidas entre themes (300ms)

**Clases de utilidad disponibles:**
```css
/* Bordes */
rounded-dt-xs, rounded-dt-sm, rounded-dt-md, rounded-dt-lg, rounded-dt-xl

/* Sombras */
shadow-dt-0, shadow-dt-1, shadow-dt-2, shadow-dt-3, shadow-dt-4
shadow-dt-inset-1, shadow-dt-inset-2

/* Timing */
duration-dt-instant, duration-dt-fast, duration-dt-normal, duration-dt-slow

/* Timing functions */
ease-dt-default, ease-dt-in, ease-dt-out, ease-dt-bounce
```

### Reglas de Estilo IMPORTANTES

**❌ NUNCA usar colores hardcodeados:**
```tsx
// MAL - No hacer esto
<div style={{ color: '#3b82f6' }} />
<div className="text-[#3b82f6]" />
<div style={{ background: 'rgba(255, 255, 255, 0.3)' }} />
```

**✅ SIEMPRE usar tokens CSS:**
```tsx
// BIEN - Usar variables CSS
<div className="text-primary" />
<div className="bg-dt-primary-500" />
<div style={{ background: 'var(--primary)' }} />

// Para opacidad, usar color-mix
<div style={{ background: 'color-mix(in oklch, var(--primary) 30%, transparent)' }} />
```

### Component Variants

```typescript
const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: '...',
        destructive: '...',
        outline: '...',
        ghost: '...',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3',
        lg: 'h-10 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

---

## 🗄️ Database Patterns

### Drizzle ORM Usage

**Schema Definition**:

```typescript
export const videos = sqliteTable('Video', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  // ... fields
}, (table) => ({
  folderIdIdx: index('Video_folderId_idx').on(table.folderId),
  hashIdx: index('Video_hash_idx').on(table.hash),
}));
```

**Queries in Services**:

```typescript
// Basic query
const videos = await db
  .select()
  .from(videos)
  .where(eq(videos.folderId, folderId));

// With relations
const videosWithCounts = await db
  .select({
    ...getTableColumns(videos),
    _count: { albums: sql<number>`count(*)` }
  })
  .from(videos)
  .leftJoin(imageAlbums, eq(videos.id, imageAlbums.videoId))
  .groupBy(videos.id);
```

### Relations Pattern

Many-to-many relationships use junction tables:

```typescript
export const imageTags = sqliteTable('_ImageToTag', {
  A: text('A').notNull(), // imageId
  B: text('B').notNull(), // tagId
}, (table) => ({
  AB_unique: uniqueIndex('_ImageToTag_AB_unique').on(table.A, table.B),
}));
```

**Relations must be added to** `src/lib/drizzle/relations.ts`

---

## ✅ Testing Patterns

### Unit Tests (Vitest)

**Location**: `src/**/*.{test,spec}.{ts,tsx}` or `tests/unit/**/*.{test,spec}.{ts,tsx}`

**Pattern**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVideo } from '@/hooks/useVideo';

describe('useVideo', () => {
  beforeEach(() => {
    // Setup mocks, clear state
  });

  it('should fetch video successfully', async () => {
    const { result } = renderHook(() => useVideo('test-id'));

    // Assertions
    expect(result.current.data).toBeDefined();
  });
});
```

**Vitest Configuration**:
- Environment: `jsdom`
- Globals enabled (no need to import describe/it/expect)
- File parallelism: `false` (to avoid SQLITE_BUSY)
- Pool: `forks`
- Isolate: `true`

### E2E Tests (Playwright)

**Location**: `tests/e2e/*.spec.ts`

**Pattern**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Videos Page', () => {
  test('should display videos list', async ({ page }) => {
    await page.goto('http://localhost:5173/videos');
    await expect(page.locator('.video-card')).toHaveCount(3);
  });
});
```

**Playwright Configuration**:
- Base URL: `http://localhost:5173`
- Timeout: 60s default, 10s expectations
- Auto-starts dev server: `bun run dev:full`
- Reuse existing server in development

---

## 🔧 Code Style & Linting

### Biome Configuration

**Formatter**:
- Indent style: Tab
- Indent width: 2
- Line width: 120
- Quote style: Single quotes
- Trailing commas: es5
- Semicolons: Always

**Key Rules**:
- `noForEach`: Error (use for...of or map instead)
- `useTemplate`: Error (use template literals)
- `useConst`: Error (prefer const over let)
- `noConsoleLog`: Off (console.log is allowed)

### Running Lint/Format

```bash
# Check for issues
bun run biome

# Auto-fix
bun run biome:fix

# Format files
bun run format
```

---

## 🎯 Feature Flags

The project uses feature flags for gradual migrations:

```typescript
// src/config/features.ts
export const FEATURES = {
  USE_EFFECT_TAGS: process.env.USE_EFFECT_TAGS !== 'false',
  USE_EFFECT_IMAGES: process.env.USE_EFFECT_IMAGES !== 'false',
  USE_EFFECT_VIDEOS: process.env.USE_EFFECT_VIDEOS !== 'false',
  USE_EFFECT_AUDIOS: process.env.USE_EFFECT_AUDIOS !== 'false',
  USE_EFFECT_FOLDERS: process.env.USE_EFFECT_FOLDERS === 'true',
} as const;
```

**Effect-TS Migration Pattern**:
- Legacy service: `src/services/<entity>/<entity>.service.ts`
- Effect version: `src/services/<entity>/<entity>.service.effect.ts`
- Router chooses based on feature flag

---

## 📝 Logging System

### Client-Side Logging

```typescript
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger.withContext('ComponentName');

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Server-Side Logging

```typescript
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('ServiceName');

logger.info('Processing request');
logger.error('Failed to process', { error: err.message, id });
```

### Script Logging (Run-with-log)

Scripts should be wrapped with logging utilities:

```bash
# Pattern
bun run scripts/run-with-log.js <alias> <command>

# Example
bun run scripts/run-with-log.js test-unit vitest run --coverage
```

Logs are saved in `/logs` directory with ISO timestamps.

---

## ⚡ Performance Patterns

### Virtualization

For large lists (1000+ items), use `@tanstack/react-virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200,
});
```

### Lazy Loading

```typescript
// React lazy loading
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Image lazy loading
<img loading="lazy" src={thumbnailUrl} alt={name} />
```

### Code Splitting

Routes are automatically split by Vite. For manual splits:

```typescript
const AsyncComponent = lazy(() =>
  import('./AsyncComponent').then(m => ({ default: m.AsyncComponent }))
);
```

---

## 🚨 Gotchas & Anti-Patterns

### ❌ Avoid

1. **Direct Drizzle access in routes** - Always use service layer
2. **Mega-stores** - Keep Zustand stores focused
3. **Deep relative imports** - Use absolute paths (`@/...`)
4. **Duplicate type definitions** - Import from `src/types/` or Drizzle schemas
5. **Heavy processing in routes** - Keep route handlers thin, move logic to services
6. **Mixing concerns** - Don't put fetch/transform/render in one component
7. **Direct filesystem access** - Use existing filesystem utilities
8. **Duplicate stats logic** - Centralize in services
9. **Heavy dependencies** - Don't add new deps when util exists
10. **Ignoring tests** - All tests must pass before committing

### ⚠️ Known Issues

1. **SQLite_BUSY errors** - File parallelism disabled in Vitest (`fileParallelism: false`)
2. **Header size limits** - Server configured to accept large headers (32KB max)
3. **Bun compatibility** - Some Node.js modules don't work with Bun, use Bun-compatible alternatives

### ✅ Best Practices

1. **Transformers for DTOs** - Enrich data in transformers, not services or components
2. **Semantic query keys** - Use descriptive keys for TanStack Query cache
3. **Fine-grained stores** - One store per concern, not one big store
4. **Type-first development** - Define types before implementation
5. **Error boundaries** - Wrap components with error boundaries
6. **Loading states** - Show loading indicators for async operations
7. **Progress feedback** - Use SSE for long-running operations (reindex, batch ops)
8. **SSE for streaming** - Reuse existing SSE pattern for progress updates

---

## 📦 Adding a New Entity

**Checklist for adding a new entity type**:

1. **Database Schema** (`src/lib/drizzle/schema/<domain>/`)
   - Create table with proper fields and indexes
   - Add to `schema/index.ts`
   - Add relations to `relations.ts` if needed

2. **Service Layer** (`src/services/<entity>/`)
   - Create service with CRUD methods
   - Implement `list`, `get`, `create`, `update`, `delete`
   - Add domain-specific methods

3. **Transformer** (`src/transformers/<entity>/`)
   - Create `transformer.ts` with `fromDrizzle<Entity>WithCounts`
   - Add `mappers.ts`, `serializers.ts`, `validators.ts`
   - Create `schema.ts` with Zod schemas

4. **API Routes** (`src/server/routes/`)
   - Create RESTful endpoints
   - Validate input with Zod
   - Call service layer
   - Transform responses

5. **Types** (`src/types/entities/<entity>/`)
   - Define TypeScript types
   - Create guards if needed

6. **Store** (`src/store/entities/<entity>/`)
   - Create Zustand store if UI state needed
   - Follow immer + devtools pattern

7. **Components** (`src/components/views/<entity>/`)
   - Create view component
   - Create content view component
   - Follow existing patterns

8. **Tests**
   - Add unit tests for service
   - Add unit tests for transformer
   - Add E2E tests for basic CRUD

---

## 🔍 Search & Debugging

### Finding Code

```bash
# Find service files
find src/services -type f -name "*.service.ts"

# Find routes
find src/server/routes -type f -name "*.ts"

# Find transformers
find src/transformers -type f -name "transformer.ts"
```

### Debugging Tips

1. **Server logs**: Check terminal where `bun run dev:server:hot` is running
2. **Client logs**: Browser DevTools Console
3. **Database**: Use `bun run db:studio` to inspect data
4. **Network**: Check DevTools Network tab for API calls
5. **Performance**: Use React DevTools Profiler, React Scan (installed)

---

## 📚 Documentation References

- **Architecture**: `docs/ARCHITECTURE.md` - Complete system architecture
- **Database Schema**: `docs/DATABASE-SCHEMA.md` - Detailed schema documentation
- **API Reference**: `docs/API-REFERENCE.md` - API endpoints documentation
- **Services Guide**: `docs/SERVICES-GUIDE.md` - Service layer patterns
- **Frontend Guide**: `docs/FRONTEND-GUIDE.md` - Frontend patterns
- **PRD**: `docs/PRD.md` - Product requirements
- **Existing Rules**: `.github/copilot-instructions.md` - Development rules (Spanish)

---

## 🌐 Environment Variables

### Required

```bash
# Database
DATABASE_URL=file:./db.sqlite

# Server
API_PORT=4000
NODE_ENV=development

# Uploads
UPLOADS_DIR=public/uploads
```

### Optional (Feature Flags)

```bash
# Effect-TS features (default: true)
USE_EFFECT_TAGS=true
USE_EFFECT_IMAGES=true
USE_EFFECT_VIDEOS=true
USE_EFFECT_AUDIOS=true

# Future features (default: false)
USE_EFFECT_FOLDERS=false
```

---

## 🛠️ Common Tasks

### Run Database Migration

```bash
# Generate migration
bunx drizzle-kit generate

# Apply migration
bunx drizzle-kit push

# Open studio
bun run db:studio
```

### Fix Type Errors

```bash
# Type check
bun run tsc

# Fix with Biome (some type issues)
bun run biome:fix
```

### Rebuild After Dependency Changes

```bash
# Clear cache
rm -rf node_modules/.vite

# Reinstall
bun install

# Restart dev server
bun run dev:full
```

---

## ⚠️ Critical Rules (from `.github/copilot-instructions.md`)

**In Spanish - translated summary**:

1. **Follow MANDATORY TASK protocols strictly**
2. **Keep responses in Spanish** (for Spanish-speaking users)
3. **Create TODO list before ANY action**
4. **Mark tasks as COMPLETE when done**
5. **Validate before continuing**
6. **NEVER accept failing tests** - all tests must pass
7. **Small, typed, consistent changes**
8. **Search context FIRST before creating TODO**

**STOP EXECUTION IF**:
- No TODO created before action
- No context searched first
- Tasks not marked complete
- Implementation not validated

---

## 📞 Troubleshooting

### Server Won't Start

1. Check if port 4000 is in use: `lsof -i :4000` (Mac/Linux) or `netstat -ano | findstr :4000` (Windows)
2. Check `.env` file exists and has required vars
3. Clear cache: `rm -rf node_modules/.bun && bun install`

### Tests Failing

1. Check `fileParallelism: false` in `vitest.config.ts` (to avoid SQLITE_BUSY)
2. Clear test cache: `rm -rf node_modules/.vitest`
3. Run `bun run tsc` to check for type errors

### Build Errors

1. Check all imports use absolute paths
2. Run `bun run biome:fix` for lint issues
3. Check circular dependencies in transformers

### Database Issues

1. Reset database: `bun run db:reset` (destructive!)
2. Check migrations: `bunx drizzle-kit push`
3. Inspect with studio: `bun run db:studio`

---

## ✨ Quick Reference

| Task | Command |
|------|---------|
| Start dev | `bun run dev:full` |
| Build | `bun run build` |
| Test unit | `bun run test` |
| Test E2E | `bun run test:e2e` |
| Lint | `bun run biome` |
| Format | `bun run format` |
| Type check | `bun run tsc` |
| DB Studio | `bun run db:studio` |
| Logs | `bun run logs:list` |

---

**Remember**: Always read existing code patterns before implementing new features. The codebase has established patterns for services, transformers, routes, and components that should be followed.
