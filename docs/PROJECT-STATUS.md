# Estado Actual del Proyecto - Image Manager
**Fecha:** 10 de octubre de 2025  
**Branch:** new  
**Stack:** React 19 + Express + Bun + Drizzle ORM + SQLite/Turso + Tauri

---

## 🎯 Resumen Ejecutivo

Proyecto de gestión de imágenes y media con arquitectura full-stack moderna. Backend Express con servicios de dominio, ORM Drizzle sobre SQLite, frontend React 19 con TanStack Query, y aplicación desktop Tauri opcional.

**Estado:** ✅ Fase de optimización completada (Oct 2-10, 2025)

---

## 📊 Métricas de Rendimiento

### Optimizaciones Aplicadas (Oct 2-10, 2025)

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|---------|
| **N+1 Queries** | 41 | 5 | -88% |
| **Cards Memoizados** | 0/21 | 21/21 | 100% |
| **Errores TypeScript** | 27 | 0 | 100% |
| **Rutas Lazy** | 0/28 | 28/28 | 100% |
| **Índices DB** | 0 | 23 | +23 |
| **Code Splitting** | No | 20+ chunks | ✓ |

### Estructura de Servicios

```
src/services/
├── image/          → CRUD + stats + favoritos + relations
├── video/          → Similar a image
├── audio/          → Similar a image  
├── document/       → Similar a image
├── folder/         → Árbol + stats + jerarquía
├── album/          → Colecciones + media
├── group/          → Agrupación conceptual
├── collection/     → Organización de items
├── favorite/       → Gestión favoritos cross-entity
├── tag/            → Tags + relaciones + conteos
├── character/      → Entidad worldbuilding
├── place/          → Entidad worldbuilding
├── concept/        → Entidad worldbuilding
├── note/           → Notas + relaciones
├── prompt/         → Prompts AI
├── worldItem/      → Items worldbuilding
├── file3d/         → Archivos 3D
└── stats/          → Agregaciones y métricas centralizadas
```

---

## 🗄️ Arquitectura de Base de Datos

### Schema Principal (Drizzle)

**Content Domain** (`schema/content/`)
- `images`, `videos`, `audios`, `documents` → Media files
- `folders` → Árbol jerárquico con relaciones
- Índices: `idx_images_path`, `idx_images_folder_id`, `idx_folders_parent_id`, etc.

**Organization Domain** (`schema/organization/`)
- `albums`, `groups`, `collections` → Agrupación de contenido
- `favorites` → Sistema de favoritos polimórfico
- Índices: `idx_albums_folder_id`, `idx_favorites_entity`, etc.

**Taxonomy Domain** (`schema/taxonomy/`)
- `tags`, `tag_relations` → Sistema de etiquetado
- Índices: `idx_tags_name`, `idx_tag_relations_composite`

**Worldbuilding Domain** (`schema/worldbuilding/`)
- `characters`, `places`, `concepts`, `world_items` → Entidades narrativas
- Índices por nombre y relaciones

**Note System** (`schema/notes/`)
- `notes`, `note_relations` → Sistema de notas con relaciones polimórficas

**Media 3D** (`schema/media3d/`)
- `files_3d` → Modelos 3D y assets relacionados

**Full-Text Search** (`schema/fts5/`)
- `images_fts`, `folders_fts`, `tags_fts`, etc. → Búsqueda de texto completo
- Triggers automáticos para mantener sincronización

### Índices Clave

```sql
-- Performance crítico
CREATE INDEX idx_images_folder_id ON images(folder_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_tag_relations_composite ON tag_relations(entity_type, entity_id);
CREATE INDEX idx_favorites_user_entity ON favorites(user_id, entity_type, entity_id);

-- FTS5 (23 índices en total)
-- Ver src/lib/drizzle/migrations/ para lista completa
```

---

## 🔧 Scripts Disponibles

### Desarrollo
```bash
bun run dev:full          # Frontend + Backend (unified)
bun run dev:vite          # Solo frontend (puerto 5173)
bun run dev:server:hot    # Solo backend con HMR (puerto 3000)
bun run dev:tauri         # Aplicación desktop
```

### Build
```bash
bun run build             # Build completo
bun run build:vite        # Build frontend
bun run build:server      # Build backend
bun run build:tauri       # Build desktop
```

### Testing & Quality
```bash
bun run test:e2e          # Tests E2E Playwright
bun run test:ui           # Playwright UI mode
bun run biome             # Lint con Biome
bun run biome:fix         # Fix automático
bun run format            # Format con Biome
bun run format:check      # Check formato
bun run tsc               # TypeScript check
```

### Base de Datos
```bash
bun run db:studio         # Drizzle Studio (UI)
bun run db:push           # Push schema a DB
bun run db:migrate        # Run migrations
bun run db:seed           # Seed data abstracto
bun run db:reset          # Reset completo
bun run db:check          # Validar schema
```

### Utilidades
```bash
bun run logs:list         # Listar logs
bun run logs:clean        # Limpiar logs antiguos
bun run check:errors      # Resumen de errores
bun run playwright:install # Instalar Playwright
bun run playwright:codegen # Code generation
```

### Scripts Operativos (`scripts/`)

**Desarrollo:**
- `dev-full.js` - Orquesta frontend + backend concurrentemente
- `dev-server-hot.js` - Backend con HMR usando Bun
- `dev-vite-headers.js` - Frontend con headers personalizados
- `tauri-dev.js` - Desarrollo Tauri
- `tauri-build.js` - Build Tauri

**Base de Datos:**
- `scripts/db/seed-all.ts` - Seed principal (solo datos abstractos)
- `migrate-entity-aggregates.js` - Migración de agregados

**Mantenimiento:**
- `check-errors.js` - Parsea logs y reporta errores
- `error-parser.js` - Utilidad de parsing de errores
- `cleanup-logs.js` - Limpia logs antiguos
- `cleanup-repo.js` - Limpieza completa del repo
- `generate-video-thumbnails.js` - Genera thumbnails de videos

**Utilidades Logging:**
- `logging-utils.js` - Utilidades de logging centralizado
- `run-with-log.js` - Wrapper con logging
- `run-with-log-tolerant.js` - Wrapper tolerante a errores

**Testing:**
- `setup-test-files.js` - Setup de archivos de prueba

---

## 🏗️ Patrones de Código

### 1. Servicios de Dominio

```typescript
// src/services/<entidad>/<entidad>.service.ts
export class EntityService {
  async list(options: ListOptions) { /* ... */ }
  async get(id: number) { /* ... */ }
  async create(data: CreateDTO) { /* ... */ }
  async update(id: number, data: UpdateDTO) { /* ... */ }
  async delete(id: number) { /* ... */ }
  
  // Métodos específicos de dominio
  async getStats() { /* ... */ }
  async getRelationships(id: number) { /* ... */ }
}
```

**Regla:** No acceder a Drizzle fuera de servicios. Los controladores consumen servicios.

### 2. Transformers

```typescript
// src/transformers/<entidad>/
export const toEntityView = (raw: DBEntity): EntityView => { /* ... */ }
export const toEntityStats = (raw: DBEntity): EntityStats => { /* ... */ }
```

**Regla:** Centralizar lógica de enriquecimiento y serialización.

### 3. Rutas Express

```typescript
// src/server/routes/<entidad>.routes.ts
router.get('/', async (req, res) => {
  const items = await entityService.list(req.query);
  res.json(items);
});
```

**Regla:** Handlers finos, sin lógica de negocio pesada.

### 4. Componentes React

```typescript
// src/components/<dominio>/<Componente>Card.tsx
export const EntityCard = memo(({ entity }: Props) => {
  // Render
});

// src/components/<dominio>/index.ts
export { EntityCard as MemoizedEntityCard };
```

**Regla:** Todos los cards memoizados. Export como `MemoizedXCard`.

### 5. Estado UI

```typescript
// src/stores/<dominio>.store.ts
export const useEntityStore = create<State>((set) => ({
  // State fino, no mega-store
}));
```

**Regla:** Stores finos por dominio. TanStack Query para server state.

### 6. Queries (TanStack)

```typescript
// src/hooks/use-entity-query.ts
export const useEntityQuery = (id: number) => {
  return useQuery({
    queryKey: ['entities', 'byId', id],
    queryFn: () => fetchEntity(id),
  });
};
```

**Regla:** Keys semánticos, invalidación precisa.

---

## 📁 Estructura de Proyecto

```
src/
├── components/          → Componentes React organizados por dominio
│   ├── common/         → Componentes compartidos
│   ├── layout/         → Layout y navegación
│   ├── media/          → Cards de media (Image, Video, Audio, Document)
│   ├── organization/   → Cards de organización (Album, Group, Collection)
│   ├── taxonomy/       → Cards de taxonomía (Tag)
│   ├── worldbuilding/  → Cards de worldbuilding (Character, Place, Concept)
│   └── ui/             → Componentes UI base (shadcn/ui)
│
├── server/             → Backend Express
│   ├── routes/         → Definición de rutas
│   ├── middleware/     → Middleware personalizado
│   └── index.ts        → Entry point del servidor
│
├── services/           → Lógica de negocio (ver arriba)
│
├── lib/                → Utilidades y configuración
│   ├── drizzle/        → Schema, migrations, seeds
│   ├── filesystem/     → Operaciones de archivos
│   ├── logger/         → Sistema de logging
│   ├── image/          → Procesamiento de imágenes
│   └── events/         → Sistema de eventos (SSE)
│
├── transformers/       → DTOs y serializadores
│
├── stores/             → Estado global (Zustand)
│
├── hooks/              → Custom hooks
│
├── types/              → Tipos TypeScript compartidos
│
├── utils/              → Utilidades generales
│
└── config/             → Configuración de aplicación
```

---

## 🚀 Flujo de Desarrollo

### Añadir Nueva Entidad

1. **Schema** (`src/lib/drizzle/schema/<dominio>/`)
   ```typescript
   export const newEntity = sqliteTable('new_entity', {
     id: integer('id').primaryKey({ autoIncrement: true }),
     name: text('name').notNull(),
     // ...
   });
   ```

2. **Relaciones** (`src/lib/drizzle/relations.ts`)
   ```typescript
   export const newEntityRelations = relations(newEntity, ({ one, many }) => ({
     // ...
   }));
   ```

3. **Servicio** (`src/services/newEntity/newEntity.service.ts`)
   ```typescript
   export class NewEntityService {
     async list() { /* ... */ }
     // CRUD completo
   }
   ```

4. **Transformers** (`src/transformers/newEntity/`)
   ```typescript
   export const toNewEntityView = (raw: DBNewEntity) => ({ /* ... */ });
   ```

5. **Rutas** (`src/server/routes/newEntity.routes.ts`)
   ```typescript
   router.get('/', async (req, res) => {
     const items = await newEntityService.list();
     res.json(items);
   });
   ```

6. **Store/Query** (si necesita UI reactiva)
   ```typescript
   export const useNewEntityQuery = () => useQuery({ /* ... */ });
   ```

7. **Tests E2E** (`tests/e2e/newEntity.spec.ts`)
   ```typescript
   test('should create new entity', async ({ page }) => { /* ... */ });
   ```

---

## 🧪 Testing

### E2E Coverage (Playwright)

**Passing Tests:**
- ✅ FTS5 Search (5 tests)

**Failing Tests (Preexistentes):**
- ❌ Context Menu Performance (3 tests)
- ❌ File Browser Views (6 tests)
- ❌ Folder Preview (1 test)
- ❌ Reindex Settings (1 test)

**Status:** Las optimizaciones no introdujeron nuevas regresiones. Tests fallidos son preexistentes y están documentados.

---

## 📝 Documentación Vigente

### Activos
- ✅ `docs/audit-2025-10-10/` - Auditoría completa de optimización
- ✅ `docs/correcciones-2025-10-10.md` - Registro de correcciones
- ✅ `docs/drizzle-aggregates-guidelines.md` - Guía de agregados
- ✅ `docs/fts5-plan.md` - Plan FTS5
- ✅ `docs/LOGGING-SYSTEM-GUIDE.md` - Guía de logging
- ✅ `docs/estado-actual-proyecto.md` - Este documento

### Archivos Raíz
- ✅ `CONTEXT_MENU_GUIDE.md` - Guía de menús contextuales
- ✅ `design.md` - Diseño general
- ✅ `requirements.md` - Requerimientos
- ✅ `README.md` - Documentación principal

### Obsoletos (Eliminados Oct 10, 2025)
- ~~`REFACTOR-*` (10 archivos)~~ - Análisis antiguos consolidados aquí
- ~~`PLAN-MINIMO-DISRUPTIVO.md`~~ - Plan ejecutado
- ~~`migracion-drizzle-final.md`~~ - Migración completada
- ~~`docs/history/`, `docs/migration-bun/`~~ - Historical legacy

---

## 🐛 Problemas Conocidos

### Tests Fallidos
- Context menu performance: timing issues
- File browser views: virtualization edge cases
- Folder preview: SVG caching

**Prioridad:** Media - no afectan funcionalidad core

### StatsService Legacy
- Todavía usa algunas queries SQL raw (Prisma legacy)
- **Plan:** Migrar a Drizzle SQL tagged progresivamente

---

## 🎯 Próximos Pasos Sugeridos

1. **Migrar StatsService a Drizzle puro** (eliminar Prisma legacy)
2. **Implementar caching en queries pesadas** (Redis o similar)
3. **Mejorar coverage de tests E2E** (corregir 11 tests fallidos)
4. **Optimizar virtualización** (mejor UX en listas grandes)
5. **Documentar API** (OpenAPI/Swagger)
6. **Implementar observability** (traces, metrics)

---

## 📞 Mantenimiento

### Logs
- Ubicación: `/logs`
- Retención: 2 días (configurable en `cleanup-logs.js`)
- Limpieza automática: `bun run logs:clean`

### Base de Datos
- Ubicación: `./data/media.db` (SQLite local) o Turso (cloud)
- Backups: Manual (scripts/db/backup.ts - TODO)
- Studio: `bun run db:studio` (puerto 5555)

### Limpieza Repositorio
- Script: `bun run cleanup:repo` (ejecuta `scripts/cleanup-repo.js`)
- Elimina: scripts obsoletos, docs deprecados, logs antiguos, test-results
- Última ejecución: 10 de octubre de 2025

---

## 🔗 Referencias

- Drizzle ORM: https://orm.drizzle.team/
- Bun: https://bun.sh/
- TanStack Query: https://tanstack.com/query/
- Playwright: https://playwright.dev/
- Tauri: https://tauri.app/

---

**Última actualización:** 10 de octubre de 2025  
**Mantenedor:** @gvastethecreator  
**Licencia:** [Ver LICENSE]
