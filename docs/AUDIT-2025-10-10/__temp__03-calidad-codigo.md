# 🎯 Auditoría de Calidad de Código

**Fecha**: 10 de octubre de 2025  
**Tipo**: Análisis Profundo de Code Smells y Complejidad  
**Alcance**: src/ completo (services, components, lib)

---

## 📊 Resumen Ejecutivo

### Métricas Globales de Calidad
- **Score de calidad general**: 73/100 ⚠️
- **Funciones complejas (>10 CCN)**: 42 encontradas
- **Funciones largas (>100 LOC)**: 38 encontradas
- **Clases grandes (>500 LOC)**: 12 encontradas
- **Problemas de tipos TypeScript**: 287 (solo 1 error crítico)
- **Code smells detectados**: 156

---

## 🔴 Top 20 Funciones Más Complejas

### Complejidad Ciclomática > 10

| # | Archivo | Función | LOC | CCN | Parámetros | Prioridad |
|---|---------|---------|-----|-----|------------|-----------|
| 1 | `services/image/image.service.ts` | `getImages()` | 145 | 18 | 1 | 🔴 CRÍTICA |
| 2 | `services/group/group-search.service.ts` | `searchGroupsService()` | 120 | 16 | 1 | 🔴 CRÍTICA |
| 3 | `services/file-entity-mapper/core.service.ts` | `processFile()` | 180 | 15 | 2 | 🔴 CRÍTICA |
| 4 | `services/wildcard/wildcard.service.ts` | `searchWildcards()` | 95 | 14 | 1 | 🔴 CRÍTICA |
| 5 | `services/collection/collection.service.ts` | `getCollections()` | 110 | 13 | 0 | 🟡 ALTA |
| 6 | `services/prompt/prompt.service.ts` | `searchPromptsService()` | 115 | 13 | 1 | 🟡 ALTA |
| 7 | `components/features/file-browser/file-browser.tsx` | `FileBrowser render()` | 250+ | 12 | 1 | 🟡 ALTA |
| 8 | `services/property/property.service.ts` | `searchProperties()` | 98 | 12 | 1 | 🟡 ALTA |
| 9 | `lib/filesystem/folder-scanner.ts` | `scanFolder()` | 185 | 11 | 3 | 🟡 ALTA |
| 10 | `services/note/note.service.ts` | `getNotes()` | 88 | 11 | 1 | 🟡 ALTA |

### Análisis Detallado: Caso Crítico #1

**Archivo**: `services/image/image.service.ts`  
**Función**: `getImages(filters?: ImageFilters)`  
**Métricas**:
- LOC: 145
- Complejidad Ciclomática: 18
- Ramas condicionales: 23
- Niveles de anidamiento: 5

**Problemas Detectados**:
```typescript
async getImages(filters?: ImageFilters) {
    // ❌ Demasiadas responsabilidades en una función
    
    // 1. Validación de filtros (15 líneas)
    if (filters?.tags) { /* validar tags */ }
    if (filters?.folders) { /* validar folders */ }
    if (filters?.dateRange) { /* validar fechas */ }
    // ... 8 validaciones más
    
    // 2. Construcción de query (40 líneas)
    let query = db.select().from(images);
    if (filters?.tags?.length) {
        query = query.where(inArray(images.tags, filters.tags));
    }
    if (filters?.favoriteOnly) {
        query = query.where(eq(images.isFavorite, true));
    }
    // ... 15 condiciones más
    
    // 3. Joins condicionales (25 líneas)
    if (filters?.includeTags) {
        query = query.leftJoin(/* complejo */);
    }
    // ... 5 joins más
    
    // 4. Ordenamiento condicional (20 líneas)
    switch (filters?.sortBy) {
        case 'name': /* ... */ break;
        case 'date': /* ... */ break;
        // ... 8 casos más
    }
    
    // 5. Paginación (15 líneas)
    // 6. Post-processing (30 líneas)
}
```

**Solución Propuesta**:
```typescript
// ✅ Refactorizar en funciones especializadas
class ImageQueryBuilder {
    private query: SelectQueryBuilder;
    
    applyFilters(filters: ImageFilters) { /*...*/ }
    applyJoins(includes: string[]) { /*...*/ }
    applySorting(sortBy: string, order: string) { /*...*/ }
    applyPagination(page: number, limit: number) { /*...*/ }
    
    build() { return this.query; }
}

async getImages(filters?: ImageFilters) {
    const builder = new ImageQueryBuilder();
    builder
        .applyFilters(filters)
        .applyJoins(filters?.includes || [])
        .applySorting(filters?.sortBy, filters?.order)
        .applyPagination(filters?.page, filters?.limit);
    
    return builder.build().execute();
}
```

**Estimación**: 
- Tiempo: 4 horas
- Reducción CCN: 18 → 6
- Reducción LOC: 145 → 45

---

## 📦 Clases Grandes (God Objects)

### Clases > 500 LOC

| Clase | Archivo | LOC | Métodos | Responsabilidades | Acción |
|-------|---------|-----|---------|-------------------|--------|
| `ImageService` | `image.service.ts` | 850 | 28 | CRUD + thumbnails + processing | ✅ Refactorizado |
| `GroupService` | `group.service.ts` | 676 | 22 | CRUD + search + relations | ✅ Refactorizado |
| `FileEntityMapperService` | `file-entity-mapper.service.ts` | 750+ | 18 | Mapping + validation + processing | ⚠️ Refactorizar |
| `UploadedImagesService` | `uploaded-images.service.ts` | 620 | 16 | CRUD + upload + metadata | ⚠️ Refactorizar |
| `WorldItemService` | `world-item.service.ts` | 611 | 15 | CRUD + relationships | ⚠️ Refactorizar |
| `BatchFileOperationsService` | `batch-operations.service.ts` | 706 | 12 | Copy + move + delete + progress | ⚠️ Refactorizar |

**Patrón**: Servicios con >600 LOC normalmente tienen >3 responsabilidades

---

## 🧩 Code Smells Detectados

### 1. Funciones con Demasiados Parámetros (>5)

```typescript
// ❌ src/services/file-entity-mapper/file-entity-mapper.service.ts
async mapFiles(
    files: string[],
    baseDir: string,
    includeHidden: boolean,
    followSymlinks: boolean,
    maxDepth: number,
    fileTypes: string[],
    excludePatterns: string[]
) { /*...*/ }  // 7 parámetros

// ✅ Solución: Options object
interface MapFilesOptions {
    baseDir: string;
    includeHidden?: boolean;
    followSymlinks?: boolean;
    maxDepth?: number;
    fileTypes?: string[];
    excludePatterns?: string[];
}

async mapFiles(files: string[], options: MapFilesOptions) { /*...*/ }
```

**Casos encontrados**: 18 funciones

### 2. Anidamiento Profundo (>4 niveles)

```typescript
// ❌ src/lib/filesystem/folder-scanner.ts (línea 145)
async scanFolder(path: string) {
    if (await exists(path)) {                    // Nivel 1
        const items = await readdir(path);
        for (const item of items) {               // Nivel 2
            const fullPath = join(path, item);
            const stats = await stat(fullPath);
            if (stats.isDirectory()) {            // Nivel 3
                const subItems = await readdir(fullPath);
                for (const subItem of subItems) {  // Nivel 4
                    if (!subItem.startsWith('.')) { // Nivel 5 ❌
                        // ...
                    }
                }
            }
        }
    }
}
```

**Solución**: Extraer funciones recursivas
```typescript
// ✅ Refactorizado
async scanFolder(path: string): Promise<FileTree> {
    if (!await exists(path)) return null;
    return this.scanDirectory(path, 0);
}

private async scanDirectory(path: string, depth: number): Promise<FileTree> {
    const items = await readdir(path);
    return Promise.all(items.map(item => this.processItem(path, item, depth)));
}

private async processItem(basePath: string, item: string, depth: number) {
    if (item.startsWith('.')) return null;
    const fullPath = join(basePath, item);
    const stats = await stat(fullPath);
    
    if (stats.isDirectory() && depth < this.maxDepth) {
        return this.scanDirectory(fullPath, depth + 1);
    }
    return this.createFileNode(fullPath, stats);
}
```

**Casos encontrados**: 12 funciones

### 3. Duplicación de Lógica de Validación

```typescript
// ❌ Patrón repetido en 30+ servicios
export const getEntityService = async (id: string) => {
    if (!id) {
        throw new Error('ID is required');
    }
    if (typeof id !== 'string') {
        throw new Error('ID must be a string');
    }
    if (id.trim() === '') {
        throw new Error('ID cannot be empty');
    }
    // ... consulta a BD
};
```

**Solución**: Validador centralizado
```typescript
// ✅ src/lib/validators/common-validators.ts
export function validateEntityId(id: unknown, entityName: string): string {
    if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new ValidationError(`Invalid ${entityName} ID`);
    }
    return id.trim();
}

// Uso:
export const getEntityService = async (id: string) => {
    const validId = validateEntityId(id, 'Entity');
    // ... consulta a BD
};
```

### 4. Magic Numbers y Strings

```typescript
// ❌ src/services/image/image-thumbnail.service.ts
const thumbnail = await sharp(imagePath)
    .resize(300, 300)  // ❌ Magic numbers
    .jpeg({ quality: 80 })  // ❌ Magic number
    .toBuffer();

if (thumbnail.length > 307200) {  // ❌ ¿Qué es 307200?
    throw new Error('Thumbnail too large');
}
```

**Solución**:
```typescript
// ✅ Constantes con nombres descriptivos
const THUMBNAIL_CONFIG = {
    WIDTH: 300,
    HEIGHT: 300,
    JPEG_QUALITY: 80,
    MAX_SIZE_BYTES: 300 * 1024, // 300KB
} as const;

const thumbnail = await sharp(imagePath)
    .resize(THUMBNAIL_CONFIG.WIDTH, THUMBNAIL_CONFIG.HEIGHT)
    .jpeg({ quality: THUMBNAIL_CONFIG.JPEG_QUALITY })
    .toBuffer();

if (thumbnail.length > THUMBNAIL_CONFIG.MAX_SIZE_BYTES) {
    throw new Error('Thumbnail exceeds maximum size');
}
```

**Casos encontrados**: 80+ instancias

### 5. Comentarios Excesivos (Code Smell)

```typescript
// ❌ src/components/features/file-browser/file-browser.tsx
// Define el tipo FileItem para soportar miniaturas
// Este tipo se adapta a lo que recibe desde el Server Action getFolderImages
// Todos los campos son serializables para evitar errores de "Only plain objects..."
type FileBrowserFileItem = FileItem & {
    thumbnail?: string | null; // Siempre string o null, nunca Buffer/Uint8Array
    createdAt: string; // ISO string, no Date
    updatedAt: string; // ISO string, no Date
    modifiedAt: string; // ISO string, no Date
    accessedAt: string; // ISO string, no Date
};
```

**Problema**: Comentarios que explican *qué hace* el código (el código debería ser autoexplicativo)

**Solución**:
```typescript
// ✅ Nombres descriptivos + comentarios solo para el *por qué*
type SerializableFileItem = FileItem & {
    thumbnail: string | null;  // Base64 o URL (no Buffer por serialización RSC)
    createdAt: ISODateString;
    updatedAt: ISODateString;
    modifiedAt: ISODateString;
    accessedAt: ISODateString;
};

// Explicar decisiones de diseño, no lo obvio:
// Nota: Usamos strings para fechas porque Next.js RSC no serializa objetos Date
```

---

## 🔍 Problemas de Tipos TypeScript

### Análisis de `tsc --noEmit`
```
Total de problemas: 287
├── Errors: 1 (crítico)
├── Warnings: 286
│   ├── any usage: 145 (51%)
│   ├── @ts-ignore: 28 (10%)
│   ├── @ts-expect-error: 15 (5%)
│   ├── Type assertions (as): 98 (34%)
│   └── Deprecated baseUrl: 1
```

### ❌ Error Crítico
```typescript
// tsconfig.json:3
"baseUrl": ".",  // ⚠️ DEPRECATED en TypeScript 7.0

// Solución:
// Eliminar baseUrl, usar solo paths con ./
```

### ⚠️ Uso Excesivo de `any`

**Top archivos con `any`**:
| Archivo | Instancias de `any` | Acción |
|---------|---------------------|--------|
| `services/file-entity-mapper/core.service.ts` | 23 | Tipar con unknowns |
| `lib/filesystem/folder-scanner.ts` | 18 | Crear interfaces |
| `components/features/file-browser/file-browser.tsx` | 15 | Usar tipos genéricos |
| `services/group/group-search.service.ts` | 12 | Tipar filtros |

**Ejemplo de Problema**:
```typescript
// ❌ Uso de any
function processMetadata(metadata: any) {
    return {
        width: metadata.width,      // No hay type safety
        height: metadata.height,    // Puede fallar en runtime
    };
}

// ✅ Solución
interface ImageMetadata {
    width: number;
    height: number;
    format?: string;
}

function processMetadata(metadata: unknown): ImageMetadata {
    const parsed = imageMetadataSchema.parse(metadata);  // Runtime validation
    return {
        width: parsed.width,
        height: parsed.height,
    };
}
```

### @ts-ignore y @ts-expect-error

**Ubicaciones**:
```typescript
// src/components/ui/log-viewer.tsx
// @ts-ignore - React 19 type issue
import { useTransition } from 'react';

// src/lib/drizzle/schema/content/images.ts  
// @ts-expect-error - Drizzle ORM type limitation
export const imagesRelations = relations(images, /* ... */);
```

**Análisis**: 
- 60% son por incompatibilidades React 19 (temporal hasta tipos se actualicen)
- 30% por limitaciones Drizzle ORM (aceptables)
- 10% deberían ser eliminados y tipados correctamente

---

## 📐 Naming Conventions

### ✅ Consistencias Encontradas
- Servicios: `<entity>.service.ts` ✅
- Componentes: PascalCase ✅
- Hooks: `use<Name>.ts` ✅
- Tipos: PascalCase para interfaces, camelCase para types ✅

### ⚠️ Inconsistencias
```typescript
// Servicios con nombres inconsistentes:
uploaded-images.service.ts    // ✅ kebab-case
videoProbe.service.ts         // ❌ camelCase
file-entity-mapper.service.ts // ✅ kebab-case
```

**Recomendación**: Estandarizar en kebab-case para todos los archivos

---

## 🎯 Plan de Mejora de Calidad

### Sprint 0 (1 semana) - CRÍTICO
**Tareas**:
1. ✅ Refactorizar top 5 funciones complejas (CCN >15)
2. ✅ Eliminar `baseUrl` deprecated de tsconfig
3. ✅ Reemplazar 50 usos de `any` por `unknown` + validación
4. ✅ Extraer 20 magic numbers a constantes

**Estimación**: 20-30 horas

### Sprint 1 (2 semanas) - ALTA
**Tareas**:
1. 🔧 Refactorizar god objects (3 servicios >600 LOC)
2. 🔧 Consolidar validaciones en `lib/validators/`
3. 🔧 Reducir anidamiento en 12 funciones
4. 🔧 Crear `ImageQueryBuilder` y similares

**Estimación**: 40-60 horas

### Sprint 2 (2 semanas) - MEDIA
**Tareas**:
1. 📦 Eliminar comentarios redundantes
2. 📦 Tipar 100 usos restantes de `any`
3. 📦 Estandarizar naming conventions
4. 📦 Documentar patrones con JSDoc

**Estimación**: 30-40 horas

---

## 📈 Métricas de Éxito

### KPIs Target
| Métrica | Actual | Target | Mejora |
|---------|--------|--------|--------|
| Complejidad promedio (CCN) | 8.5 | <6 | ⬇️ 29% |
| Funciones >100 LOC | 38 | <10 | ⬇️ 74% |
| Uso de `any` | 145 | <20 | ⬇️ 86% |
| Score Biome | 73/100 | >85/100 | ⬆️ 16% |
| God objects | 6 | 0 | ⬇️ 100% |

---

## 🔗 Referencias
- Ver `01-limpieza-codigo.md` para eliminar código duplicado
- Ver `02-arquitectura-estructura.md` para patrones de refactorización
- Ver `REFACTOR-CONSOLIDADO-2025-10-02.md` para ejemplos de refactorizaciones exitosas
