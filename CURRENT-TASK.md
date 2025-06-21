# ⚔️ Plan de Batalla: Cero Errores de TypeScript

## 🎯 Misión

El objetivo es la eliminación sistemática y completa de los 1300+ errores de TypeScript que actualmente plagan el codebase. Este documento sirve como guía central, hoja de ruta y checklist para esta iniciativa.

## 📜 Estrategia General

Los errores se abordarán de manera estructurada para minimizar la creación de nuevos problemas y maximizar la eficiencia. La estrategia se divide en dos ejes:

1. **Por Capas (Orden de Prioridad):** Las correcciones se realizarán desde el núcleo hacia el exterior.
    - **Nivel 1: Tipos Base (`/types/entities`)**: Corregir las definiciones fundamentales de las entidades.
    - **Nivel 2: Transformadores (`/transformers`)**: Asegurar que la capa de mapeo entre Prisma y los tipos de la aplicación sea robusta.
    - **Nivel 3: Lógica de Negocio (`/app/actions`, `/services`)**: Arreglar los errores en las server actions y servicios que consumen los transformadores.
    - **Nivel 4: Stores (`/store/entities`)**: Alinear los stores de Zustand con los tipos correctos.
    - **Nivel 5: Componentes UI (`/components`)**: Solucionar problemas de props y estado en los componentes de React.
    - **Nivel 6: Pruebas (`/tests`, `*.test.ts`)**: Actualizar o corregir las pruebas unitarias y de integración.

2. **Por Entidad:** Dentro de cada capa, se agruparán las correcciones por entidad para mantener el contexto y la coherencia.

## 🚨 Patrones de Errores Comunes Identificados

- **Desajuste de Tipos (Transformer/Prisma):** El error más común. Las funciones `fromPrisma...` devuelven objetos que no coinciden con los tipos esperados (`AlbumWithRelations`, `CharacterComplete`, etc.), usualmente por falta de propiedades o relaciones.
- **Import/Export Rotos:** Módulos que no exponen miembros (`has no exported member`) o rutas de importación incorrectas.
- **Problemas de Nulabilidad (`null`):** Funciones que pueden devolver `null` pero cuyo tipo de retorno no lo permite.
- **Errores de Props en Componentes:** Pasar props con tipos incorrectos a los componentes de React.
- **Errores de Configuración (Next.js/Prisma):** Errores en archivos generados (`.next/types`) o en consultas de Prisma (`mode: 'insensitive'`).

---

## ✅ Checklist de Corrección por Entidad

### 📝 Entidad: General / Sistema

- [ ] **API Routes (`.next/types/app/api/...`)**: Investigar los errores `ParamCheck<RouteContext>`. Probablemente se deban a una mala definición de los `params` en las props de las rutas.
- [ ] **Module Resolution (`@/types/files`)**: El tipo `FileItem` parece faltar o estar mal exportado. Es usado en múltiples actions.
- [ ] **Framer Motion (`framer-motion`)**: El módulo no se encuentra en `character-card-images.tsx`. Verificar instalación y dependencias.
- [ ] **Revalidate Path (`@/app/actions/revalidate`)**: Módulo no encontrado en `video.actions.ts`.

### 💿 Entidad: Album (`album.actions.ts`, `album-card*`)

- [ ] **`album.actions.ts`**:
  - [ ] Corregir el mapeo en `fromPrismaAlbums` y `fromPrismaAlbum`. Falta la propiedad `characters`.
  - [ ] Resolver problemas de nulabilidad donde las funciones devuelven `AlbumWithRelations | null` en lugar de `AlbumWithRelations`.
- [ ] **`album-card-footer.tsx`**: La propiedad `totalSize` no existe en `AlbumBase`. Verificar el tipo y añadirla o usar una alternativa.
- [ ] **`album-card.test.tsx`**: El `mockAlbum` no cumple con el tipo `AlbumWithRelations`. Faltan `featuredImage` y `isFavorite`.
- [ ] **`album-server-actions.ts`**:
  - [ ] `AlbumCardData` extiende `AlbumWithRelations` incorrectamente (incompatibilidad en `filters`).
  - [ ] Múltiples propiedades (`theme`, `layout`, `thumbnailSize`) no existen en el objeto `album`.
  - [ ] El objeto `metadata` que se retorna no coincide con el tipo esperado (problema con `coverImageUrl` que puede ser `null`).

### 🦸 Entidad: Character (`character.actions.ts`, `character-card*`)

- [ ] **`character.actions.ts`**:
  - [ ] `fromPrismaCharacters` y `fromPrismaCharacter` reciben un tipo con `properties` incompleto. Faltan `name`, `description`, `category`, etc.
- [ ] **`character-card-content.tsx`**: `ProgressProps` no tiene `indicatorClassName`. Usar una alternativa o extender el componente.
- [ ] **`character-card.tsx`**:
  - [ ] `cardMedia` (un array de objetos) se pasa a `CharacterCardImages`, que espera `string[]`.
  - [ ] Se pasa `backstory` a `CharacterCardContentProps`, pero no está definido en el tipo.
  - [ ] `rarityLevel` se pasa como `string` pero se espera `number`.
- [ ] **`character-server-actions.ts`**: El tipo `CharacterCardData[]` no es compatible con lo que se retorna. El `_count` tiene menos propiedades de las esperadas.

### 📚 Entidad: Collection (`collection.actions.ts`, `collection-card*`)

- [ ] **`collection.actions.ts`**: Mismo patrón que `character.actions.ts`. El tipo de entrada para los transformadores tiene `properties` incompleto.
- [ ] **`collection-card-content.tsx`**: `edition.date` no existe en `CollectionEdition`.
- [ ] **`collection-card.tsx`**: `CollectionWithRelations` no se exporta desde `@/types/entities/collection/types`.
- [ ] **`collection-server-actions.ts`**: El objeto retornado no es asignable a `CollectionCardData` (incompatibilidad en `filters` y `editions`).

### 💡 Entidad: Concept (`concept.actions.ts`, `concept-server-actions.ts`)

- [ ] **`concept-images.actions.ts`**: `toConceptComplete` no se exporta desde `@/transformers/concept`.
- [ ] **`concept.actions.ts`**:
  - [ ] `prisma` no se exporta desde `@/lib/db`.
  - [ ] Múltiples miembros no se exportan desde `@/transformers/concept` (`toCreateData`, `toSearchOptions`, `toUpdateData`).
  - [ ] Inferencia de tipo `any` implícita en un `.filter()`.
- [ ] **`concept-server-actions.ts`**:
  - [ ] `tags: true` no existe en `ConceptCountOutputTypeSelect`.
  - [ ] Propiedad `_count` no existe en el tipo base del concepto.
  - [ ] Propiedad `tags` no existe en el objeto `concept`.

### 🏷️ Entidad: Tag (`crud.actions.ts`, `query.actions.ts`)

- [ ] **`crud.actions.ts`**:
  - [ ] Problemas de nulabilidad al pasar `fromPrismaTag(tag)` a `notifyTagChange`.
  - [ ] Las funciones retornan `TagWithStats | null` en lugar de `TagWithRelations`.
- [ ] **`query.actions.ts`**:
  - [ ] `tags: true` no existe en `TagCountOutputTypeSelect`.
  - [ ] `fromPrismaTag` se usa en un `map` con un tipo incompatible (falta `_count`).
  - [ ] `mode: 'insensitive'` se usa incorrectamente en un filtro de Prisma.
  - [ ] `convertServerImageToFileItem` recibe un tipo `ServerImage` incompleto.

### 🚀 Entidad: Prompt (`prompt.actions.ts`)

- [ ] **`prompt.actions.ts`**:
  - [ ] Múltiples importaciones rotas desde `@/transformers/prompt` y `@/types/entities/prompt`.
  - [ ] `PromptWithStats` usado pero parece que el tipo correcto es `PromptStats`.
  - [ ] Incompatibilidad en `.map(toPromptWithStats)` porque el tipo de `parameters` es `string` en lugar de `PromptParameter[]`.

### 🌍 Entidad: WorldItem (`world-item.actions.ts`)

- [ ] **`world-item.actions.ts`**:
  - [ ] `handleTransformerError` se llama con 2 argumentos pero espera 1.
  - [ ] El tipo de retorno `TransformerError` no es asignable a `WorldItemComplete` o `WorldItemComplete[]`.

### очередь (Queue) Entidad: QueueJob (`crud.actions.ts`, `query.actions.ts`)

- [ ] **`crud.actions.ts`**: El `status` se pasa como `string` pero se espera el enum `QueueJobStatus`.
- [ ] **`query.actions.ts`**: Mismo problema con `status` y `findQueueJobsByStatus`.
- [ ] **`stats.actions.ts`**: `getCachedQueueStats` retorna `QueueStats` que no es asignable a `Record<string, number>`.

### Otros Errores Notables

- [ ] **`wildcard.actions.ts`**: Errores de transformer complejos donde faltan múltiples relaciones (`properties`, `tags`, `images`, etc.).
- [ ] **`uploaded-images.actions.ts`**:
  - [ ] `metadata` se asigna como objeto, pero el tipo espera `string`.
  - [ ] `imageRecord.url` no existe en `UploadedImageBase`.
- [ ] **`video.actions.ts`**: Importaciones rotas para tipos `CreateVideoInput`, `UpdateVideoInput`.
- [ ] **`property.actions.ts`**: Importaciones rotas desde `@/transformers/property` y `@/types/entities/property`.
- [ ] **`folder`**: Varios errores en componentes y actions relacionados con la entidad `Folder`.
- [ ] **`group.actions.ts`**: `fromPrismaGroup` no se exporta.
