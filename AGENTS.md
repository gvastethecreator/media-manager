# AGENTS.md - Image Manager Repository Guide

This guide provides essential information for AI agents working in this repository. Follow these patterns, conventions, and commands to work effectively.

---

## 📋 Project Overview

**Type**: Monolithic client-server application (web + desktop via Electron)
**Purpose**: Intelligent multimedia file management system for large volumes of content
**Tech Stack**: React 19 + Express + Bun + Drizzle ORM + SQLite + Playwright + Electron
**Runtime**: Bun 1.2+ (can use Node.js 20+ as fallback)

**Deployment Options**:

- **Web App**: Full-stack (React + Express) via `bun run dev:full`
- **Desktop App**: Electron supervisor around the Bun web app via `bun run desktop:dev`

---

## 🚀 Essential Commands

### Development

```bash
# Full development (frontend + backend + HMR)
bun run dev:full

# Frontend only (Vite+ dev server)
bun run dev:vite

# Backend only (Express with HMR)
bun run dev:server:hot

# Electron desktop development
bun run desktop:dev
```

### Build

```bash
# Full build (frontend + server)
bun run build

# Frontend build only
bun run build:vite

# Server build only
bun run build:server

# Copy extraResources, hash that tree, then package Windows x64
bun run desktop:package
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
# Operational quality gate
bun run check

# Full repo audit with Vite+
bun run check:full

# Lint and format check
bun run lint
bun run format:check

# Auto-fix issues
bun run lint:fix
bun run format

# Type checking
bun run tsc
```

### Database Operations

```bash
# Drizzle Studio requiere una DB explícita y local
bun run db:studio -- --database .scratch/dev.sqlite

# Inspeccionar una DB explícita sin modificarla
bun run db:check -- --database C:/path/to/media-manager.sqlite

# Aplicar migraciones versionadas a una DB explícita
bun run db:migrate -- --database C:/path/to/media-manager.sqlite
bun run db:schema:export -- --database C:/path/to/media-manager.sqlite --output C:/path/to/schema.sql

# Reset sólo para una DB descartable marcada; el primer comando marca y el segundo hace dry-run
bun run db:mark-disposable -- --database .scratch/dev.sqlite --confirm MARK-DISPOSABLE
bun run db:reset -- --database .scratch/dev.sqlite
bun run db:reset -- --database .scratch/dev.sqlite --confirm RESET-DISPOSABLE

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

### Desktop (Electron)

```bash
# Electron development
bun run desktop:dev

# Build web artifacts, copy extraResources, hash that tree, package Windows x64
bun run desktop:package
```

**Electron Integration**:

- Development window origin: `http://127.0.0.1:5173`
- Production window origin: the local broker on loopback
- Supervisor owns the session token and the `userData/app-data` library
- See `docs/migration/ARCHITECTURE_ADR.md`

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

⚠️ **IMPORTANT**: We intentionally avoid barrel files (`index.ts`) in services and transformers for performance and clarity. Import directly from specific files.
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
</ThemeProvider>;

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
const buttonVariants = cva('base-classes', {
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
});
```

---

## 🗄️ Database Patterns

### Drizzle ORM Usage

**Schema Definition**:

```typescript
export const videos = sqliteTable(
	'Video',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		// ... fields
	},
	(table) => ({
		folderIdIdx: index('Video_folderId_idx').on(table.folderId),
		hashIdx: index('Video_hash_idx').on(table.hash),
	})
);
```

**Queries in Services**:

```typescript
// Basic query
const videos = await db.select().from(videos).where(eq(videos.folderId, folderId));

// With relations
const videosWithCounts = await db
	.select({
		...getTableColumns(videos),
		_count: { albums: sql<number>`count(*)` },
	})
	.from(videos)
	.leftJoin(imageAlbums, eq(videos.id, imageAlbums.videoId))
	.groupBy(videos.id);
```

### Relations Pattern

Many-to-many relationships use junction tables:

```typescript
export const imageTags = sqliteTable(
	'_ImageToTag',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToTag_AB_unique').on(table.A, table.B),
	})
);
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
- File parallelism: `true`; cada archivo clona un template migrado dentro de su worker SQLite
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

### Oxc Configuration

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
# Check operational health
bun run check

# Full repo formatting audit
bun run check:full

# Auto-fix
bun run lint:fix

# Format files
bun run format
```

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
bun run scripts/run-with-log.js test-unit vp test --run --coverage
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
const AsyncComponent = lazy(() => import('./AsyncComponent').then((m) => ({ default: m.AsyncComponent })));
```

---

## 🧠 Effect-TS Pattern (Advanced)

### Overview

The project is migrating to Effect-TS for functional error handling and composition. See `docs/guides/EFFECT-TS-MIGRATION.md` for complete migration status (22/22 services migrated as of 2025-10-11).

### Effect Service Pattern

```typescript
// 1. Define errors with Data.TaggedError
export class VideoNotFound extends Data.TaggedError('VideoNotFound')<{
	readonly id: string;
}> {}

// 2. Define service interface
export interface VideoServiceInterface {
	readonly getById: (id: string) => Effect.Effect<VideoWithStats, VideoError>;
	readonly getAll: (options?: GetOptions) => Effect.Effect<VideoListResult, VideoError>;
	readonly create: (input: CreateVideoInput) => Effect.Effect<Video, VideoError>;
	readonly update: (id: string, input: UpdateVideoInput) => Effect.Effect<Video, VideoError>;
	readonly delete: (id: string) => Effect.Effect<void, VideoError>;
}

// 3. Create Context.Tag for dependency injection
export class VideoService extends Context.Tag('VideoService')<VideoService, VideoServiceInterface>() {}

// 4. Implement the service
export const make = (): VideoServiceInterface => {
	const getById = (id: string): Effect.Effect<VideoWithStats, VideoError> =>
		Effect.gen(function* () {
			// Access dependencies
			const db = yield* DrizzleService;

			// Query database
			const [video] = yield* Effect.tryPromise({
				try: () => db.select().from(videos).where(eq(videos.id, id)).limit(1),
				catch: (error) => new DatabaseError({ message: String(error), cause: error }),
			});

			if (!video) {
				return yield* Effect.fail(new VideoNotFound({ id }));
			}

			// Transform result
			return yield* Effect.succeed(fromDrizzleVideoWithCounts(video));
		});

	const getAll = (options?: GetOptions): Effect.Effect<VideoListResult, VideoError> =>
		Effect.gen(function* () {
			const db = yield* DrizzleService;

			// Build query
			let query = db.select().from(videos);
			if (options?.search) {
				query = query.where(like(videos.name, `%${options.search}%`));
			}
			if (options?.limit) {
				query = query.limit(options.limit);
			}
			if (options?.offset) {
				query = query.offset(options.offset);
			}

			const results = yield* Effect.tryPromise({
				try: () => query,
				catch: (error) => new DatabaseError({ message: String(error), cause: error }),
			});

			return { videos: results, total: results.length };
		});

	return { getById, getAll /* ... */ };
};

// 5. Create Layer
export const VideoServiceLive = Layer.effect(VideoService, make());
```

### Effect Route Handler Pattern

```typescript
import { Effect } from 'effect';
import express from 'express';
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
import { VideoService, VideoServiceLive } from '@/services/video/video.service.effect';

const router = express.Router();

router.get('/:id', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		// Inject service
		const videoService = yield* VideoService;

		// Call service method
		const video = yield* videoService.getById(id);

		return res.json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

router.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		// Validate input
		const input = yield* Effect.tryPromise({
			try: () => createVideoSchema.parseAsync(req.body),
			catch: (error) => new ValidationError({ message: 'Invalid input', cause: error }),
		});

		const video = yield* videoService.create(input);

		return res.status(201).json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

export default router;
```

### Effect Adapter

The `runEffectForExpress` adapter handles:

- Effect execution
- Error mapping to HTTP status codes
- Response sending
- Logging

```typescript
// src/lib/effect/adapters/express.adapter.ts
export async function runEffectForExpress<R>(effect: Effect.Effect<R, unknown>, res: express.Response): Promise<void> {
	const result = await Effect.runPromise(effect);

	if (result._tag === 'Left') {
		// Error case
		const httpError = errorToHttpStatus(result.left);
		res.status(httpError.status).json({
			error: httpError.message,
			...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
		});
	} else {
		// Success case - result is already sent via res.json()
	}
}
```

### Key Effect Concepts

**Effect.gen**: Generator-based sequencing

```typescript
const effect = Effect.gen(function* () {
	const a = yield* Effect.succeed(1);
	const b = yield* Effect.succeed(2);
	return a + b; // 3
});
```

**Effect.tryPromise**: Convert promises to Effects

```typescript
const result =
	yield *
	Effect.tryPromise({
		try: () => fs.readFile(path),
		catch: (error) => new FileReadError({ path, error }),
	});
```

**Context.Tag**: Dependency injection

```typescript
// Define
export class Database extends Context.Tag('Database')<Database, DB>() {}

// Use in service
const db = yield * Database;

// Provide in Layer
export const DatabaseLive = Layer.effect(Database, makeDb());
```

**Layers**: Compose dependencies

```typescript
const MainLive = Layer.provide(VideoServiceLive, DatabaseLive.pipe(Layer.provide(LoggerService)));
```

---

## 🔄 Operaciones de archivos autorizadas

No existe un ejecutor local de lotes. No aceptes rutas físicas desde el cliente ni anuncies pausa, cancelación o undo
si no controlan una mutación de servidor.

Para mover medios, usa `POST /api/files/assets/move` con una referencia de asset y un `targetFolderId`. Cada asset se
resuelve contra una root autorizada y su reubicación usa journal y compensación. El cliente procesa los assets en orden,
se detiene ante el primer error y muestra el subconjunto confirmado; si hubo cambios, solicita el reindexado del destino.

Un futuro lote debe nacer en el servidor y definir de forma explícita su semántica de cancelación, recuperación y
resultado parcial antes de exponer controles en la interfaz.

### Progress Tracking

Long-running operations use a centralized progress tracking system:

**Service**: `src/services/progress/progress-tracking.service.ts`

**Features**:

- Real-time progress updates
- Operation queuing and priority
- Error handling and retry logic
- Duration estimation

**Usage**:

```typescript
import { progressTrackingService } from '@/services/progress/progress-tracking.service';

const tracker = progressTrackingService.createTracker({
	operationId: 'reindex-folder-123',
	total: 1000,
	label: 'Reindexing folder',
});

// Update progress
tracker.updateProgress(500); // 50% complete

// Mark complete
tracker.complete();

// Handle errors
tracker.error(new Error('Failed to process file'));
```

### Server-Sent Events (SSE)

For real-time progress updates from backend to frontend:

**Route Pattern** (server-side):

```typescript
router.get('/events', (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');

	// Send events
	const sendEvent = (data) => {
		res.write(`data: ${JSON.stringify(data)}\n\n`);
	};

	progressTrackingService.on('progress', (data) => {
		sendEvent({ type: 'progress', data });
	});
});
```

**Client-side**:

```typescript
const eventSource = new EventSource('/api/operations/events');

eventSource.addEventListener('progress', (event) => {
	const data = JSON.parse(event.data);
	console.log('Progress update:', data);
});
```

**Example SSE Endpoints**:

- `/thumbnails/events` - Thumbnail generation progress
- `/reindex/events` - Folder reindexing progress
- `/batch/events` - Batch operation progress

---

## 🖼️ Thumbnail System

### Thumbnail Architecture

**Components**:

- `src/services/thumbnail/thumbnail-events.service.ts` - Event-driven thumbnail generation
- `src/services/media/ffmpeg-thumbnail.service.ts` - Video thumbnails (FFmpeg)
- `src/services/media/mediabunny-thumbnail.service.ts` - Unified thumbnail service
- `src/transformers/thumbnail/` - Thumbnail DTO transformers

**Thumbnail Generation Flow**:

```
Request Thumbnail
    ↓
Check Cache (DB thumbnails table)
    ↓ (not found)
Generate with Sharp/FFmpeg
    ↓
Save to DB (thumbnail blob)
    ↓
Return thumbnail data
```

**API Endpoints**:

```bash
# Get thumbnail
GET /thumbnails/image/:imageId?quality=medium

# Generate thumbnail
POST /thumbnails/generate/:imageId

# Bulk generate
POST /thumbnails/bulk-generate { imageIds: [...], quality: 'medium' }

# Batch processing
POST /thumbnails/batch { requests: [{imageId, quality}, ...] }

# SSE events for progress
GET /thumbnails/events
```

**Thumbnail Quality Levels**:

- `thumbnail` - Small (100x100)
- `small` - Small (200x200)
- `medium` - Medium (400x400)
- `large` - Large (800x800)
- `original` - Original size

**Thumbnail States**:

- `thumbnail` - BLOB data in DB
- `thumbnailError` - Error message if generation failed
- `thumbnailErrorAt` - Timestamp of error
- `thumbnailOptimizedAt` - Timestamp of last optimization

---

## 🔁 Incremental Reindexing System

### Hash-Based Change Detection

**Core Concept**: Files are only reprocessed if their SHA-256 hash changes.

**Key Files**:

- `src/services/folder/reindex/reindex-incremental.service.effect.ts` - Effect-TS implementation
- `src/services/file-changes/file-change-detector.service.effect.ts` - Change detection
- `docs/guides/REINDEX-INCREMENTAL.md` - Full documentation

**How It Works**:

1. Calculate SHA-256 hash of file content
2. Compare with stored hash in database
3. If different → Process file (extract metadata, generate thumbnail)
4. If same → Skip (no changes detected)

**Benefits**:

- 95% time savings on incremental reindex
- Detects file content changes (not just modification time)
- Works with renamed/moved files
- No unnecessary thumbnail regeneration

**API**:

```bash
# Start incremental reindex
POST /folders/:id/reindex { mode: 'incremental' }

# Get reindex progress (SSE)
GET /reindex/events

# Check reindex status
GET /folders/:id/reindex/status
```

**Reindex Modes**:

- `full` - Process all files (slow, initial indexing)
- `incremental` - Only process changed files (fast, subsequent indexing)

---

## 🗂️ File System Integration

### File Entity Mapper

Handles automatic detection and routing of files to correct entity types.

**Service**: `src/services/file-entity-mapper/`

**Architecture**:

- **Core Service** (`core.service.ts`) - Orchestrates the 3-stage pipeline
- **Processors** (`processors/`) - Specialized handlers per file type:
  - `image.processor.ts` - EXIF/IPTC/XMP/AI metadata
  - `video.processor.ts` - ffprobe + animated WebP thumbnails
  - `audio.processor.ts` - ID3 tags + waveform
  - `document.processor.ts` - PDF/MD/TXT parsing
  - `file3d.processor.ts` - GLTF/GLB/OBJ parsing
  - `json.processor.ts` - Validation + preview

**3-Stage Pipeline**:

```
Stage 1: Basic Creation
  - Quick pre-check (stat + extension)
  - Size validation (skip before hash)
  - SHA-256 hash calculation (with LRU cache)
  - Duplicate verification
  - Basic DB record creation

Stage 2: Metadata Extraction
  - Dispatch to specialized processor
  - Extract type-specific metadata

Stage 3: Thumbnail Generation
  - Generate appropriate thumbnail type
```

**Supported File Types**:

| Extension                      | Entity Type | Processor         |
| ------------------------------ | ----------- | ----------------- |
| .jpg, .jpeg, .png, .gif, .webp | Image       | ImageProcessor    |
| .mp4, .mov, .avi, .mkv         | Video       | VideoProcessor    |
| .mp3, .wav, .flac, .ogg        | Audio       | AudioProcessor    |
| .pdf, .doc, .docx, .txt        | Document    | DocumentProcessor |
| .json                          | JSON File   | JsonProcessor     |
| .glb, .gltf, .obj              | 3D File     | File3DProcessor   |

**Usage**:

```typescript
import { FileEntityMapperCore } from '@/services/file-entity-mapper';

const mapper = FileEntityMapperCore.getInstance();

// Process single file
const result = await mapper.createEntityFromFile('/path/to/file.jpg', 'folder-id');
// Returns: { success: true, entityType: 'image', entityId: 'uuid' }

// Process multiple files
const stats = await mapper.processFiles(['/path/to/image1.jpg', '/path/to/video.mp4'], 'folder-id');
// Returns: { totalFiles: 2, successful: 2, failed: 0, ... }
```

---

## 🔄 Undo y redo

No hay undo/redo de filesystem. El anterior historial local no podía garantizar que la base, el journal y los bytes
seguían en el mismo estado, por lo que se retiró. No presentes estos controles hasta que exista una operación de servidor
con compensación durable y una prueba de recuperación.

---

## Desktop (Electron)

The desktop shell is an Electron supervisor. It starts the existing Bun production runtime. The renderer keeps `/api` and never receives Node, `ipcRenderer`, or a generic invoke bridge.

See `docs/migration/` for the ADR, inventory, and data restore protocol.

---

## 🎯 View Architecture

### Entity Card TCG Pattern

All 20 entity views use a unified TCG (Trading Card Game) card pattern.

**Card Features**:

- Holographic effects on hover
- Dynamic gradients by entity type
- Golden glow for favorites
- 3D perspective effects
- Smooth animations (60fps)

**Card Structure**:

```typescript
interface EntityCardProps {
	entity: AnyEntityWithStats;
	onClick: (entity: AnyEntityWithStats) => void;
	onContextMenu?: (event, entity) => void;
	isSelected?: boolean;
}
```

**Available Cards**:

- `EntityCard` - Generic card (search, favorites, mixed views)
- `AlbumCard`, `CollectionCard`, `GroupCard` - Organization entities
- `CharacterCard`, `PlaceCard`, `ConceptCard`, `WorldItemCard` - Worldbuilding
- `ImageCard`, `VideoCard`, `AudioCard`, `DocumentCard` - File types
- `TagCard`, `PromptCard`, `NoteCard`, `PropertyCard` - Taxonomy
- `WildcardCard` - Pattern matching

### View Pattern

All entity views follow a consistent pattern:

```typescript
export function EntityView({}: ViewProps) {
  // 1. Store
  const { entities, isLoading, error, loadEntities } = useEntityStore();

  // 2. Load on mount
  useEffect(() => {
    if (isEmpty(entities)) loadEntities();
  }, []);

  // 3. States
  if (error) return <ErrorState />;
  if (isLoading) return <LoadingScreen />;
  if (isEmpty(entities)) return <EmptyState />;

  // 4. Grid with animations
  return (
    <ScrollArea>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entities.map((entity, index) => (
          <motion.div
            key={entity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <EntityCard entity={entity} onClick={handleClick} />
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

**View Structure**:

```
src/components/views/<entity>/
├── <entity>-view.tsx          # Main view component
├── <entity>-content-view.tsx   # Content layout
├── <entities>-content-view.tsx  # List/grid view
└── README.md                   # View documentation
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

1. **SQLite_BUSY errors** - Los tests usan una base descartable por archivo/worker; no compartir `DATABASE_URL`
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

- **Architecture**: `docs/core/ARCHITECTURE.md` - Complete system architecture
- **Database Schema**: `docs/core/DATABASE-SCHEMA.md` - Detailed schema documentation
- **API Reference**: `docs/core/API-REFERENCE.md` - API endpoints documentation
- **Services Guide**: `docs/core/SERVICES-GUIDE.md` - Service layer patterns
- **Frontend Guide**: `docs/core/FRONTEND-GUIDE.md` - Frontend patterns
- **PRD**: `docs/core/PRD.md` - Product requirements
- **Effect-TS Migration**: `docs/guides/EFFECT-TS-MIGRATION.md` - Effect-TS migration status (100% complete)
- **Reindex Incremental**: `docs/guides/REINDEX-INCREMENTAL.md` - Hash-based reindex system
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

## 🛠️ Common Tasks

### Run Database Migration

```bash
# Generate migration
bunx drizzle-kit generate

# Aplicar migraciones versionadas a una DB explícita
bun run db:migrate -- --database .scratch/dev.sqlite

# Open studio with an explicit local DB
bun run db:studio -- --database .scratch/dev.sqlite
```

### Fix Type Errors

```bash
# Type check
bun run tsc

# Fix de lint/format cuando aplique
bun run lint:fix
bun run format
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

1. Ejecutar `bun run test`; el wrapper crea una SQLite descartable por worker desde las migraciones versionadas.
2. Mantener `fileParallelism: true`; el aislamiento por worker evita compartir el writer de SQLite.
3. Ejecutar `bun run tsc` para ver errores de tipos.

### Build Errors

1. Check all imports use absolute paths
2. Run `bun run lint:fix` for lint issues
3. Check circular dependencies in transformers

### Database Issues

1. Inspeccionar primero: `bun run db:check -- --database <path-explícito>`.
2. Aplicar sólo migraciones versionadas: `bun run db:migrate -- --database <path-explícito>`.
3. Usar Studio sólo con `bun run db:studio -- --database <path-explícito>`.
4. Resetear sólo una DB bajo `.scratch` o temp, marcada y con la confirmación exacta mostrada arriba.

---

## ✨ Quick Reference

|| Task | Command |
||------|---------|
|| Start dev | `bun run dev:full` |
|| Build | `bun run build` |
|| Test unit | `bun run test` |
|| Test E2E | `bun run test:e2e` |
|| Lint | `bun run lint` |
|| Format | `bun run format` |
|| Type check | `bun run tsc` |
|| DB Studio | `bun run db:studio` |
|| Logs | `bun run logs:list` |

---

**Remember**: Always read existing code patterns before implementing new features. The codebase has established patterns for services, transformers, routes, and components that should be followed.

---

## Agent skills

### Issue tracker

GitHub Issues and the linked GitHub Project hold live state. `.scratch/` holds synchronized local mirrors. See `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monolith: root `CONTEXT.md` plus `CONTEXT-MAP.md` and `docs/adr/`. See `docs/agents/domain.md`.
