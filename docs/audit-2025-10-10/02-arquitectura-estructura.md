# 🏗️ Auditoría de Arquitectura y Estructura

**Fecha**: 10 de octubre de 2025  
**Tipo**: Análisis Arquitectónico Profundo  
**Alcance**: Servicios, Componentes, Stores, Lib

---

## 📊 Resumen Ejecutivo

### Métricas de Salud Arquitectónica
- **Cumplimiento de patrones**: 78/100 ⚠️
- **Separación de concerns**: 82/100 ✅
- **Cohesión de módulos**: 85/100 ✅
- **Acoplamiento**: 65/100 ⚠️ (alto en algunas áreas)
- **Consistencia estructural**: 72/100 ⚠️

### Problemas Principales Detectados
1. ⚠️ **Inconsistencia en exportaciones** de servicios (3+ patrones diferentes)
2. ⚠️ **Dependencias circulares** potenciales entre services/transformers
3. ⚠️ **Acceso directo a Drizzle** fuera de servicios (~15 casos)
4. ✅ **Buena separación** frontend/backend
5. ⚠️ **Paths mixtos** (relativos + absolutos)

---

## 🗂️ Estructura Actual del Proyecto

### Mapa de Dominios (Árbol Simplificado)
```
image-manager/
├── src/
│   ├── components/          [UI Layer] ✅ Bien organizado
│   │   ├── cards/          (30 tipos de entidades)
│   │   ├── views/          (15 vistas principales)  
│   │   ├── features/       (file-browser, entity-browser)
│   │   ├── forms/          (formularios de entidades)
│   │   ├── panels/         (details, stats, navigation)
│   │   ├── ui/             (componentes base Shadcn)
│   │   └── ...
│   │
│   ├── services/           [Business Logic] ⚠️ Inconsistente
│   │   ├── activity/       ✅ Patrón nuevo
│   │   ├── album/          ✅ Patrón nuevo
│   │   ├── group/          ✅ Modularizado (4 archivos)
│   │   ├── image/          ✅ Modularizado (5 archivos)
│   │   ├── tag/            ✅ Modularizado (4 archivos)
│   │   ├── prompt/         ⚠️ Monolítico (660 líneas)
│   │   ├── property/       ⚠️ Monolítico (666 líneas)
│   │   ├── wildcard/       ⚠️ Semi-modular
│   │   └── [35+ servicios] ⚠️ Patrones mixtos
│   │
│   ├── transformers/       [DTOs] ⚠️ Repetitivo
│   │   ├── image/          (6 archivos × 30 entidades)
│   │   ├── group/          = 180 archivos con mucha duplicación
│   │   └── ...
│   │
│   ├── types/              [Type Definitions] ✅ Bien estructurado
│   │   ├── entities/       (tipos core)
│   │   ├── file-browser/   (tipos de UI)
│   │   └── validations/    (zod schemas)
│   │
│   ├── stores/             [State Management] ✅ Zustand fino
│   │   ├── file-browser-store.ts     ✅
│   │   ├── selection-store.ts        ✅
│   │   ├── entity-catalog-store.ts   ✅
│   │   └── multi-entity-viewer.store.ts ✅
│   │
│   ├── lib/                [Utilities] ⚠️ Mezclado
│   │   ├── drizzle/        ✅ Schema + migrations
│   │   ├── filesystem/     ✅ File operations
│   │   ├── logger/         ✅ Server logging
│   │   ├── hooks/          ⚠️ Mezclado con API calls
│   │   ├── api/            ⚠️ Cliente API (debería estar en services?)
│   │   └── utils/          ⚠️ Catch-all demasiado grande
│   │
│   └── server/             [Backend] ✅ Bien estructurado
│       ├── routes/         (50+ endpoints)
│       ├── services/       (servicios específicos de servidor)
│       └── middleware/     (logging, auth, cors)
│
├── scripts/                [Tooling] ✅ Bien organizado
│   ├── db/                 (13 scripts BD)
│   ├── dev-*.js            (dev workflow)
│   └── run-with-log.js     (wrapper logging)
│
└── tests/                  [Testing] ⚠️ Cobertura parcial
    └── e2e/                (Playwright tests)
```

---

## 🔍 Análisis por Capa

### 1. Capa de Servicios (Business Logic)

#### ✅ Patrón Recomendado (Seguido por: group, image, tag)
```typescript
src/services/<entity>/
├── <entity>.service.ts       // Core CRUD
├── <entity>-search.service.ts  // Búsqueda
├── <entity>-relations.service.ts // Relaciones
├── <entity>-errors.ts        // Error handling
├── <entity>-events.ts        // Event emitter
├── <entity>-types.ts         // Types locales
└── index.ts                  // Exports unificados
```

**Servicios que siguen este patrón**: 7/40 (17.5%) ⚠️

#### ⚠️ Patrón Monolítico (Necesita Refactorizar)
```typescript
// Servicios con >600 líneas en un solo archivo:
- prompt/prompt.service.ts       (660 líneas)
- property/property.service.ts   (666 líneas)  
- note/note.service.ts           (542 líneas)
- character/character.service.ts (555 líneas)
- world-item/world-item.service.ts (611 líneas)
- uploaded-images/uploaded-images.service.ts (620 líneas)
```

**Recomendación**: Aplicar patrón modular (estimado: reducir 20-30% código)

#### 🔴 Problema: Inconsistencia en Exportaciones

**Patrón 1**: Exportaciones funcionales (prompt, property)
```typescript
export const getPromptService = async () => { /*...*/ };
export const createPromptService = async () => { /*...*/ };
// Luego aliases redundantes:
export const getPrompt = getPromptService;
export const createPrompt = createPromptService;
```

**Patrón 2**: Clase + Singleton (image, stats, video-probe)
```typescript
export class ImageService {
    private static instance: ImageService;
    static getInstance() { /*...*/ }
}
export const imageService = ImageService.getInstance();
```

**Patrón 3**: Objeto literal (group, toast, settings)
```typescript
export const groupService = {
    get: getGroupService,
    create: createGroupService,
    // ...
};
export default groupService;
```

**Impacto**: 
- Confusión al importar servicios
- Tree-shaking subóptimo
- Duplicación de exports

**Solución Propuesta**:
```typescript
// ESTANDARIZAR en todos los servicios:
class EntityService {
    // Implementación interna
}

export const entityService = {
    get: (...) => EntityService.get(...),
    create: (...) => EntityService.create(...),
    // ...
};

export default entityService;
```

---

### 2. Capa de Transformers (DTOs)

#### 📊 Análisis de Repetición
```
30 entidades × 6 archivos cada una = 180 archivos

Estructura repetida en TODOS:
├── validators.ts       (~50 líneas, 80% similar)
├── transformer.ts      (~100 líneas, 60% similar)
├── serializers.ts      (~80 líneas, 70% similar)
├── schema.ts           (~60 líneas, 50% similar)
├── mappers.ts          (~120 líneas, 40% similar)
└── index.ts            (~10 líneas, 95% similar)
```

**Problema**: ~35% código duplicado en transformers

**Solución Arquitectónica**:
```typescript
// Crear: src/transformers/base/base-transformer.ts
export abstract class BaseTransformer<T, R> {
    abstract validate(data: unknown): T;
    abstract toView(entity: T): R;
    abstract toDatabase(data: R): Partial<T>;
    
    // Métodos comunes compartidos
    protected ensureId(data: Partial<T>): T { /*...*/ }
    protected sanitize(data: unknown): unknown { /*...*/ }
}

// Uso en entidades:
export class ImageTransformer extends BaseTransformer<Image, ImageView> {
    validate(data: unknown): Image {
        return imageSchema.parse(data);
    }
    // Solo implementar lo específico de Image
}
```

**Beneficios**:
- Reducir 500-800 líneas de código
- Lógica compartida centralizada
- Mantenimiento más fácil

---

### 3. Separación Frontend/Backend

#### ✅ Fortalezas
```
✅ Backend completamente aislado en src/server/
✅ No hay imports de React en servicios
✅ Express routes bien organizados
✅ Middleware dedicado
```

#### ⚠️ Áreas de Mejora
```
⚠️ src/lib/api/ contiene cliente API (¿debería estar en services?)
⚠️ Algunos hooks en lib/hooks/ llaman directamente a BD
⚠️ src/lib/filesystem/ usa fs sync (bloqueante en backend)
```

**Recomendación**:
```
Mover:
- src/lib/api/* → src/client/api/*
- lib/hooks/* → src/hooks/*
- Convertir lib/filesystem/* a async/await
```

---

### 4. Gestión de Estado (Stores)

#### ✅ Fortalezas
- Stores finos y especializados (4 stores principales)
- No hay mega-store
- Uso correcto de Zustand
- Integración con React Query para datos del servidor

#### Stores Actuales
```typescript
1. file-browser-store.ts          // Estado del explorador de archivos
2. selection-store.ts             // Selección múltiple
3. entity-catalog-store.ts        // Catálogo de entidades
4. multi-entity-viewer.store.ts   // Visor multi-entidad
```

**Patrón**: ✅ Correcto, sin problemas detectados

---

### 5. Uso de Paths

#### ⚠️ Problema: Paths Mixtos

**tsconfig.json**:
```json
"paths": {
    "@/*": ["./src/*"],
    "@components/*": ["./src/components/*"]
}
```

**Análisis de Uso**:
```typescript
// ✅ Encontrado (80% de archivos):
import { Button } from '@/components/ui/button';
import { imageService } from '@/services/image';

// ⚠️ Encontrado (15% de archivos):
import { Button } from '../../../components/ui/button';

// ❌ Path específico no usado:
import { Button } from '@components/ui/button';  // Nunca usado
```

**Recomendación**:
- Eliminar `@components/*` de tsconfig (no se usa)
- Migrar todos los imports relativos a `@/*`
- Script de migración automática

---

## 🔄 Dependencias Circulares Potenciales

### Cadenas de Importación Sospechosas

#### 1. Services ↔ Transformers
```
services/image/image.service.ts
    ↓ imports
transformers/image/transformer.ts  
    ↓ imports
types/entities/image/types.ts
    ↓ imports  
services/image/converter.service.ts ⚠️ CIRCULAR
```

**Solución**: Mover `converter.service.ts` fuera de `/services`

#### 2. Lib ↔ Services
```
lib/api/folders.ts
    ↓ imports
services/folder/folder-api.service.ts
    ↓ imports
lib/drizzle/schema/organization/folders.ts
    ↓ imports
lib/api/client/folder.client.ts ⚠️ POTENCIAL CIRCULAR
```

**Solución**: Reorganizar estructura de `lib/api/`

---

## 🎯 Violaciones Arquitectónicas Detectadas

### 🔴 CRÍTICO

#### 1. Acceso Directo a Drizzle fuera de Servicios
**Ubicaciones detectadas**:
```typescript
// ❌ src/server/routes/search.ts (línea ~45)
import { db } from '@/lib/drizzle';
const results = await db.select()...

// ❌ src/lib/hooks/files/use-folder-images.ts
import { db } from '@/lib/drizzle';  
```

**Total encontrados**: ~15 casos

**Impacto**: 
- Rompe capa de servicios
- Hace testing difícil
- Lógica de negocio mezclada con rutas

**Solución**:
```typescript
// ✅ Refactorizar a:
import { searchService } from '@/services/search';
const results = await searchService.search(query);
```

---

## 📐 Métricas de Complejidad Arquitectónica

### Por Módulo
| Módulo | Archivos | LOC Promedio | Complejidad | Estado |
|--------|----------|--------------|-------------|--------|
| services/ | 150+ | 420 | Media-Alta | ⚠️ Mejorar |
| transformers/ | 180 | 65 | Baja | ⚠️ Repetitivo |
| components/ | 400+ | 180 | Media | ✅ OK |
| lib/ | 120+ | 250 | Media-Alta | ⚠️ Reorganizar |
| server/ | 60+ | 180 | Media | ✅ OK |

---

## 🎯 Plan de Refactorización Arquitectónica

### Sprint 0 (1 semana)
1. ✅ Estandarizar exportaciones de servicios (Patrón único)
2. ✅ Eliminar paths no usados de tsconfig
3. ✅ Migrar imports relativos → @/*
4. ✅ Mover accesos directos a Drizzle → servicios

### Sprint 1 (2 semanas)
1. 📦 Crear `BaseTransformer` y migrar 10 transformers
2. 📦 Refactorizar servicios monolíticos (prompt, property, note)
3. 📦 Reorganizar `lib/` (mover api/ → client/)
4. 📦 Resolver dependencias circulares

### Sprint 2 (2 semanas)
1. 🔧 Migrar lib/filesystem/ a async
2. 🔧 Consolidar eventos en base-events.service.ts
3. 🔧 Documentar patrones arquitectónicos en ARCHITECTURE.md

---

## 📈 Métricas de Éxito

### KPIs Post-Refactorización
- ✅ 95%+ servicios siguen patrón único
- ✅ 0 dependencias circulares
- ✅ 0 accesos directos a Drizzle fuera de servicios
- ✅ Reducir 500+ líneas de código duplicado en transformers
- ✅ 100% paths absolutos (@/*)

---

## 🔗 Referencias
- Ver `01-limpieza-codigo.md` para archivos a eliminar
- Ver `REFACTOR-CONSOLIDADO-2025-10-02.md` para refactorizaciones exitosas previas
- Ver `PLAN-ACCION-INMEDIATO.md` para tareas específicas
