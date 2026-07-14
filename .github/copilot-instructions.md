# 🤖 Instrucciones para Agentes IA (Copilot/Claude)

Este archivo guía a agentes IA (GitHub Copilot, Claude, etc.) para ser productivos inmediatamente en el codebase de **Image Manager**.

---

## 🎯 Visión General del Proyecto

**Image Manager** es un sistema monolítico para gestión inteligente de archivos multimedia con arquitectura React 19 + Express/Bun + Drizzle ORM + SQLite.

### Stack Clave

- **Frontend**: React 19 + TypeScript + Vite+ (Vite + Rolldown) + Zustand + TanStack Query
- **Backend**: Express (Bun runtime) con HMR
- **Database**: Drizzle ORM + SQLite (libsql)
- **Testing**: Vitest + Playwright
- **Desktop**: Tauri 2 (opcional)
- **Linting**: Oxc (Oxlint + Oxfmt) con `Vite+` para checks unificados

### Dominios Principales

- 📂 **Archivos**: Images, Videos, Audios, Documents, JSON, 3D
- 🏷️ **Organización**: Folders, Tags, Albums, Collections, Groups, Favorites
- 🌍 **Worldbuilding**: Characters, Places, Concepts, World Items
- 📊 **Sistema**: Settings, Stats, Activities, Metadata, Thumbnails

---

## 🧠 Behavioral Guidelines para AI Agents

Estas reglas reducen errores comunes de LLMs. Prioriza claridad sobre velocidad.

### 1. **Piensa Antes de Codificar**

❌ **No asumir**. Si hay incertidumbre, surfácila.

- **Declara suposiciones explícitamente** antes de implementar
- Si hay múltiples interpretaciones, presenta opciones (no elijas silenciosamente)
- Si un enfoque más simple existe, menciona que existe
- Si algo es confuso, detente y pregunta en lugar de proceder

**Ejemplo**:

```
Usuario: "Agregar validación"
❌ Mal: Validar silenciosamente e implementar
✅ Bien: "¿Debo validar en route o en transformer? ¿Qué campos?"
```

### 2. **Simplicidad Primero**

**Código mínimo que resuelve el problema. Nada especulativo.**

- ❌ No agregar features no solicitadas
- ❌ No crear abstracciones para código usado una sola vez
- ❌ No añadir "flexibilidad" futura
- ❌ No manejar errores de escenarios imposibles
- ✅ Si escribes 200 líneas que podrían ser 50, reescribe

**Test**: ¿Diría un senior engineer "esto está sobrecomplejo"? Si sí, simplifica.

### 3. **Cambios Quirúrgicos**

**Toca solo lo necesario. Limpia solo lo tuyo.**

Cuando edites código existente:

- ❌ No "mejores" código adyacente no relacionado
- ❌ No refactorices cosas que funcionan
- ✅ Usa el estilo existente, aunque hagas algo diferente
- ✅ Si notas código muerto pre-existente, menciona (no borres)

**Si TUS cambios crean órfanos** (imports/variables sin usar):

- ✅ Elimina solo lo que TUS cambios hicieron innecesario
- ❌ No elimines código muerto pre-existente

**Test**: Cada línea cambiada debe rastrear directamente a lo que el usuario pidió.

### 4. **Ejecución Guiada por Objetivos**

**Define criterios de éxito. Verifica antes de terminar.**

Para cada tarea, transforma en objetivos verificables:

```
Tarea: "Agregar validación"
↓
Objetivo: "Escribir tests para inputs inválidos, luego hacerlos pasar"

Tarea: "Refactorizar X"
↓
Objetivo: "Tests pasen antes y después del refactor"
```

**Para tareas multi-paso**:

```
1. [Paso] → verificar: [cómo confirmar]
2. [Paso] → verificar: [cómo confirmar]
3. [Paso] → verificar: [cómo confirmar]
```

Criterios fuertes = loop independiente. Criterios débiles ("hazlo funcionar") = necesita clarificación constante.

---

## ⚡ Desarrollo: Comandos Esenciales

### Iniciar Desarrollo

```bash
bun run dev:full      # Full stack (frontend + backend + HMR) — más común
bun run dev:vite      # Solo frontend (Vite+ dev server)
bun run dev:server:hot # Solo backend (Express con HMR)
```

### Build & Testing

```bash
bun run build         # Build completo (Vite + server)
bun run test          # Tests unitarios (Vitest)
bun run test:e2e      # Tests E2E (Playwright)
bun run check         # Gate operativo (lint + typecheck)
bun run check:full    # Auditoría completa Vite+ (lint + format repo)
bun run lint          # Lint directo con Oxlint
bun run format        # Formato con Oxfmt
bun run tsc           # Type check
```

### Database

```bash
bun run db:studio        # Abre Drizzle Studio (GUI)
bun run db:reset         # Bloqueado hasta disponer de migraciones/restore reproducibles
bun run db:check         # Verifica estado
```

### Logs & Debugging

```bash
bun run logs:list     # Lista logs generados
bun run check:errors  # Resume errores compilación/tipos
```

---

## 🏗️ Arquitectura: Flujo de Datos

### Patrón Estándar por Entidad

Cada entidad (Image, Video, Tag, etc.) sigue este flujo:

```
API Request
    ↓
[Route Handler] (src/server/routes/<entity>.ts)
    • Validación con Zod
    • Llamada a servicio
    ↓
[Service Layer] (src/services/<entity>/<entity>.service.ts)
    • CRUD + lógica de negocio
    • Acceso directo a Drizzle
    ↓
[Drizzle ORM] (src/lib/drizzle/schema/...)
    • Consultas SQL
    ↓
[Transformer] (src/transformers/<entity>/transformer.ts)
    • Convierte Drizzle → DTO enriquecido
    • Agrupa estadísticas
    ↓
Response → Store (Zustand) → React Components
```

### Ejemplo Real: Obtener Imágenes por Carpeta

1. **Ruta** (`src/server/routes/images.ts`):

   ```typescript
   router.get('/:folderId/list', async (req, res) => {
   	const images = await imageService.getByFolder(req.params.folderId);
   	const transformed = images.map(fromDrizzleImageWithStats);
   	res.json(transformed);
   });
   ```

2. **Servicio** (`src/services/image/image.service.ts`):

   ```typescript
   export async function getByFolder(folderId: string) {
   	return db.query.images.findMany({
   		where: eq(images.folderId, folderId),
   		with: { tags: true, albums: true },
   	});
   }
   ```

3. **Transformer** (`src/transformers/image/transformer.ts`):

   ```typescript
   export function fromDrizzleImageWithStats(drizzleImage: any) {
     return {
       ...drizzleImage,
       _count: { tags: drizzleImage.tags.length, ... },
       _stats: { ... }
     };
   }
   ```

4. **Frontend** (Hook + Store):
   ```typescript
   const images = useImageStore((s) => s.images);
   useEffect(() => {
   	imageService.getByFolder(folderId).then((data) => setImages(data));
   }, []);
   ```

---

## 🎨 Patrones & Convenciones Críticas

### 1. **Sin Archivos Barrel en Services/Transformers**

❌ **NUNCA** hagas `src/services/<entity>/index.ts` con re-exports.
✅ **Importa directo**: `import { videoService } from '@/services/video/video.service.effect'`

**Razón**: Performance + claridad.

### 2. **Transformers = Punto Único de Enriquecimiento**

- Servicios: retornan datos crudos de Drizzle
- Transformers: agregan `_count`, `_stats`, enumerables, conversiones
- Routes: llaman transformers antes de enviar respuesta

❌ Evitar: Lógica de enriquecimiento dispersa en routes o servicios
✅ Correcto: Toda transformación centralizada en `transformer.ts`

### 3. **Stores Zustand: Fine-Grained, No Mega-Stores**

```typescript
// ✅ Bien: Store específica + selectors
const useImageStore = create<ImageState>()(
  devtools(immer((...) => ({
    images: [] as Image[],
    loadImages: async () => { ... },
  })))
);

export const useImages = () => useImageStore(s => s.images);
export const useLoadImages = () => useImageStore(s => s.loadImages);
```

❌ Evitar: Un mega-store global con todo.

### 4. **TanStack Query Keys: Semánticos**

```typescript
// ✅ Patrón: [entidad, operación, identificador]
const { data } = useQuery({
	queryKey: ['images', 'byFolder', folderId],
	queryFn: () => imageService.getByFolder(folderId),
	staleTime: 5 * 60 * 1000,
});
```

### 5. **Feature Flags para Migraciones Effect-TS**

```typescript
// src/config/features.ts
export const FEATURES = {
  USE_EFFECT_TAGS: true,      // Migrado → effect.ts
  USE_EFFECT_IMAGES: false,   // Aún en .ts clásico
} as const;

// Usar en routes
if (FEATURES.USE_EFFECT_IMAGES) {
  return imageServiceEffect.list(...);
} else {
  return imageService.list(...);
}
```

### 6. **Validación con Zod en Routes**

```typescript
router.post('/', async (req, res) => {
	const input = createImageSchema.parse(req.body);
	const image = await imageService.create(input);
	res.json(fromDrizzleImageWithStats(image));
});
```

---

## 📂 Estructura de Directorios (Resumen)

```
src/
├── components/
│   ├── ui/              # Primitivos (Button, Input, Dialog, etc.)
│   ├── views/           # Vistas por entidad (ImageView, VideoView, etc.)
│   ├── features/        # Features complejos (FileBrowser, FileViewer)
│   └── cards/           # Tarjetas reutilizables
├── server/
│   ├── routes/          # Handlers Express (una por entidad)
│   ├── middleware/      # Middleware HTTP
│   └── index.ts         # Servidor Express
├── services/            # Lógica de negocio (una carpeta por entidad)
├── transformers/        # DTO enriquecidos (una carpeta por entidad)
├── store/               # Zustand stores (UI state)
├── lib/
│   ├── drizzle/         # ORM schema, relations, migrations
│   ├── logger/          # clientLogger, serverLogger
│   ├── hooks/           # Hooks personalizados
│   └── api/             # Cliente API de cliente
├── types/               # TypeScript type definitions
├── config/              # Configuración (features, constants)
├── hooks/               # React hooks globales
├── providers/           # React Context providers
└── styles/              # CSS + design tokens (Tailwind 4)
```

---

## 🎯 Convenciones de Código

### TypeScript Strict (siempre activo)

- ❌ Evitar `any`, `!` (non-null assertion)
- ✅ Usar type narrowing y refinements
- ✅ `export type` / `import type` para tipos

### Nombres de Variables

- **Services**: `<entity>Service` → `imageService`
- **Transformers**: `fromDrizzle<Entity>WithStats`, `mappers`, `serializers`
- **Stores**: `use<Entity>Store` → `useImageStore`
- **Routes**: `GET /api/<entity>`, `POST /api/<entity>`, etc.

### React/JSX

- ✅ Hooks desde top del componente + dependencias correctas
- ✅ Lazy loading de rutas (Vite lo hace automático)
- ✅ `React.memo()` para optimizar re-renders
- ❌ Evitar ternarios anidados (preferir early returns)
- ❌ Evitar `dangerouslySetInnerHTML` (XSS risk)

### Oxc (Linting/Formatting)

- Indentation: **tabs** (width: 2)
- Semicolons: **sempre**
- Quotes: **single** (`'...'` no `"..."`)
- No `console.log` en producción (allowed en dev/server)

---

## 🗄️ Database: Drizzle ORM Essentials

### Schema Organization

```
src/lib/drizzle/schema/
├── core/           # queueJobs, profiles, settings, thumbnails, etc.
├── files/          # images, videos, audios, documents, json, 3d
├── organization/   # folders, albums, collections, groups, favorites
├── taxonomy/       # tags, properties, prompts, notes, tasks
├── worldbuilding/  # characters, places, concepts, world-items
└── relations.ts    # Relaciones many-to-many
```

### Patrón de Query Común

```typescript
// Con relaciones y conteos
const images = await db
	.select({
		...getTableColumns(images),
		_count: {
			tags: sql<number>`count(distinct ${imageTags.B})`,
		},
	})
	.from(images)
	.leftJoin(imageTags, eq(images.id, imageTags.A))
	.where(eq(images.folderId, folderId))
	.groupBy(images.id);
```

### Migrations

```bash
bunx drizzle-kit generate    # Genera migration
bunx drizzle-kit push        # Aplica migration
bun run db:studio            # GUI para inspeccionar DB
```

---

## 🧪 Testing: Patrones

### Unit Tests (Vitest)

- Ubicación: `src/**/*.{test,spec}.ts` o `tests/unit/`
- Config: `jsdom` environment, `fileParallelism: false` (SQLite)
- Globals enabled (no importar describe/it/expect)

```typescript
import { describe, it, expect } from 'vitest';
import { imageService } from '@/services/image/image.service';

describe('imageService', () => {
	it('should list images by folder', async () => {
		const result = await imageService.getByFolder('folder-1');
		expect(result).toHaveLength(5);
	});
});
```

### E2E Tests (Playwright)

- Ubicación: `tests/e2e/*.spec.ts`
- Base URL: `http://localhost:5173`
- Auto-starts dev server: `bun run dev:full`

```typescript
import { test, expect } from '@playwright/test';

test('should display images grid', async ({ page }) => {
	await page.goto('/images');
	await expect(page.locator('.image-card')).toHaveCount(3);
});
```

---

## 🔑 Puntos Críticos & Anti-Patrones

### ✅ Haz

1. **Acceso a Drizzle solo desde servicios** (no desde routes directamente)
2. **Transformers para toda conversión Drizzle → DTO** enriquecida
3. **Stores Zustand fine-grained**, no mega-stores
4. **Validación Zod en routes** antes de llamar servicios
5. **Feature flags** para migraciones gradualmente
6. **SSE (Server-Sent Events)** para operaciones largas con progreso
7. **Absolute paths** (`@/...`) en imports

### ❌ Evita

1. ❌ Acceso directo a Drizzle desde routes
2. ❌ Archivos barrel (`index.ts`) en `services/` y `transformers/`
3. ❌ Lógica dispersa de enriquecimiento (no centralizada)
4. ❌ Mega-stores Zustand
5. ❌ `console.log` en código de producción del navegador (usar logger)
6. ❌ Colores hardcodeados (usar CSS tokens: `--dt-primary-500`)
7. ❌ Tests sin `fileParallelism: false` (causa SQLITE_BUSY)
8. ❌ Ignorar tipos TypeScript (usar refinements en lugar de `!` o `as`)

---

## 🎨 Design System: Tokens CSS

### Uso de Variables

✅ **Siempre usar tokens**:

```tsx
<div className="text-dt-primary-500 bg-card shadow-dt-2" />
<div style={{ background: 'var(--primary)' }} />
```

❌ **Nunca hardcodear colores**:

```tsx
<div style={{ color: '#3b82f6' }} />          // ❌
<div className="text-[#3b82f6]" />            // ❌
<div style={{ background: 'rgba(255,255,255,0.3)' }} /> // ❌
```

### Paletas Disponibles

```css
/* Design tokens v2.0 */
--dt-primary-50 a --dt-primary-950
--dt-neutral-50 a --dt-neutral-950
--dt-success-50 a --dt-success-900
--dt-warning-50 a --dt-warning-900
--dt-danger-50 a --dt-danger-900

/* Colores de entidades */
--entity-image, --entity-video, --entity-audio
--entity-folder, --entity-album, --entity-tag

/* Sombras */
--dt-shadow-0, --dt-shadow-1, --dt-shadow-2, --dt-shadow-3, --dt-shadow-4

/* Timing */
--dt-duration-instant: 50ms
--dt-duration-fast: 150ms
--dt-duration-normal: 250ms
--dt-duration-slow: 400ms
```

### 14 Temas Disponibles

`light`, `dark`, `cafe`, `violeta`, `madera`, `nocturno`, `verde`, `atardecer`, `corporativo`, `carbon`, `teal`, `citrico`, `aurora`, `neon`

---

## 📚 Documentación Importante

- **AGENTS.md** (este proyecto) — Guía técnica detallada
- **src/services/README.md** — Patrones de servicios
- **src/transformers/README.md** — Enriquecimiento de DTOs
- **src/components/views/README.md** — Patrón de vistas
- **content/docs/** — Guías arquitectónicas (markdown)

---

## 🚀 Workflow Recomendado para AI Agents

### Antes de implementar cualquier cambio:

1. **Buscar contexto** (semantic search) en patterns existentes
2. **Crear TODO list** (si es multi-paso)
3. **Implementar cambios** (aplicar patrones encontrados)
4. **Validar**: `bun run tsc && bun run check && bun run test`
5. **Marcar tasks completadas** en TODO

### Ejemplo:

```
TODO:
1. ✅ Entender patrón de servicio (búsqueda)
2. ⏳ Crear nuevo servicio (en progreso)
3. ⬜ Crear transformer
4. ⬜ Crear route handler
5. ⬜ Tests unitarios
```

---

## ⚠️ Gotchas & Troubleshooting

### `SQLITE_BUSY` en tests

- ✅ Solución: `fileParallelism: false` en `vitest.config.ts`

### Port 4000 en uso

```bash
# Windows
netstat -ano | findstr :4000 | findstr LISTENING

# Mac/Linux
lsof -i :4000
```

### Build size large

- Vite chunking automático: 28+ chunks
- Lazy loading en rutas: verificar `router.tsx`

### Types not found

- ✅ Imports con `@/types/entities/<entity>/index.ts`
- Verificar tsconfig.json paths

---

## 📞 Preguntas Frecuentes

**P: ¿Dónde agregar una nueva entidad?**
R: Schema → Service → Transformer → Route → Store → Component

**P: ¿Por qué no hay `index.ts` en services/?**
R: Performance + claridad. Importa directo de `service.ts`.

**P: ¿Cómo debuguear una query lenta?**
R: `bun run db:studio` + inspector Network en DevTools

**P: ¿Feature flags para gradualmente migrar a Effect-TS?**
R: `src/config/features.ts` + `FEATURES.USE_EFFECT_<ENTITY>`

---

**Última actualización**: 30 enero 2026
**Responsable**: AI Agents (Copilot/Claude)
**Stack**: React 19 + Express/Bun + Drizzle + SQLite
