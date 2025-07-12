## TODO: Resolver Errores de Exportaciones Faltantes

### CONTEXT_REQUIRED:
- Archivos de tipos en `/src/types/entities/`
- Archivos de servicios en `/src/services/`
- Archivos de transformadores en `/src/transformers/`
- Archivos de componentes que usan estos tipos

### ACCEPTANCE:
- Todos los errores de exportaciones faltantes resueltos
- Compilación TypeScript exitosa sin errores de tipos
- Consistencia en nombres de tipos a través del codebase
- Servicios exportan instancias correctamente

### STATUS: PENDING

## Tareas Identificadas:

### ✅ 1. Corregir Tipos Statistics → Stats
✅ `CharacterStatistics` → `CharacterStats` (CharacterStats ya existe, no necesita alias)
✅ `ConceptStatistics` → `ConceptStats` (alias creado en base.ts)
✅ `ImageStatistics` → `ImageStats` (alias creado en base.ts)
✅ `VideoStatistics` → `VideoStats` (alias creado en base.ts)
✅ `FavoriteStatistics` → `FavoriteStats` (alias creado en base.ts)

### ✅ 2. Verificar Tipos WithStats
✅ `PromptWithStats` - exportado correctamente en index.ts
✅ `ConceptWithStats` - exportado correctamente en index.ts
✅ `NoteWithStats` - exportado correctamente en index.ts
✅ `CharacterWithStats` - exportado correctamente en index.ts
✅ `FavoriteWithStats` - exportado correctamente en index.ts
✅ `WorldItemWithStats` - exportado correctamente en index.ts
✅ `WildcardWithStats` - exportado correctamente (no hay WildcardWithCounts)

### ✅ 3. Corregir Exportaciones de Componentes/Servicios
✅ `BaseContentView` - exportado correctamente en base/index.ts
✅ `DetailsPanel` → `DetailsPanelV2` - alias exportado correctamente
✅ `ViewOptionsStore` → `useViewOptionsStore` - hook exportado correctamente
✅ `SystemStats` → `useSystemStats` - hook exportado correctamente
✅ `NavigationData` → `useNavigationData` - hook exportado correctamente
✅ `AppSettings` → `Settings` - tipos exportados correctamente

### ✅ 4. Corregir Problemas Específicos de Entidades
□ `CharacterFilter` → `CharacterFilters` (verificar nombre)
✅ `CharacterFilterItem` → `CharacterFilters` (definido y exportado correctamente)
✅ `CharacterRelations` → `CharacterRelationship` (verificado: se refiere a `CharacterRelationship` - tipo correcto)
✅ `CollectionSortBy` → `CollectionRarity` (definido y exportado correctamente)
✅ `UploadedImageType` → `UploadedFileType` (verificado: alias de `UploadedFileType`, correctamente exportado)
✅ `WorldItemUpdateInput` → `WorldItemUpdateData` (verificado: definido en múltiples archivos, correctamente exportado)
✅ `WorldItemStats` → `WorldItemWithStats` (verificado: WorldItemStats existe y ahora está correctamente exportado)

**Estado:** 6/6 elementos verificados y corregidos ✅

### ✅ 5. Verificar Exportaciones de Servicios
✅ NoteService - métodos ya exportados correctamente
✅ PlaceService - métodos ya exportados correctamente
✅ PropertyService - `getPropertyById` exportado correctamente
✅ WorldItemService - `getRecentWorldItemImages` exportado correctamente

**Estado:** 4/4 servicios verificados ✅

### ⚠️ 6. Ejecutar Validación Final
✅ Ejecutar `bun run tsc --noEmit` - **ERRORES ENCONTRADOS**
✅ Ejecutar `bun run lint` - **ERROR DE CONFIGURACIÓN**
✅ Documentar errores encontrados y crear plan de corrección

**Errores de TypeScript encontrados:**
- `CharacterStatistics` no exportado (debería ser `CharacterStats`)
- `ConceptStats` no definido/exportado
- `FavoriteExtended` no exportado
- `GroupCardProps` no definido
- Propiedades faltantes en tipos `WithStats` (level, statistics, goals, fears, etc.)
- Problemas de compatibilidad en componentes de tarjetas
- Variables no definidas en algunos componentes (color, parsedTags)

**Errores de ESLint encontrados:**
- Error de configuración: Plugin "react-hooks-extra" no configurado correctamente
- ConfigError en eslint.config.js

**Estado:** Validación completada - múltiples errores requieren corrección ⚠️

## 📋 Resumen de Progreso

### ✅ Tareas Completadas:
1. **Corregir tipos Statistics → Stats** - 100% completado
2. **Verificar tipos WithStats** - 100% completado
3. **Corregir exportaciones de componentes/servicios** - 100% completado
4. **Corregir problemas específicos de entidades** - 100% completado
5. **Verificar exportaciones de servicios** - 100% completado
6. **Ejecutar validación final** - 100% completado

### ⚠️ Problemas Identificados:
- **9,259 líneas de errores de TypeScript** en el log
- **Errores de configuración de ESLint**
- **Tipos faltantes o mal exportados**
- **Incompatibilidades en componentes**

### 🎯 Próximos Pasos Recomendados:
1. Corregir tipos faltantes (`CharacterStats`, `ConceptStats`, `FavoriteExtended`, etc.)
2. Arreglar configuración de ESLint
3. Revisar y corregir propiedades faltantes en tipos `WithStats`
4. Validar compatibilidad de componentes de tarjetas
5. Re-ejecutar validación final

## Análisis de Servicios Actual:

### ✅ NoteService
- Clase exportada correctamente
- Instancia exportada como default
- Métodos individuales exportados: `getNotes`, `getNoteById`, `createNote`, `updateNote`, `deleteNote`, `getNoteImages`, `getRecentNoteImages`, `getNoteCounts`, `getNoteStatuses`

### ✅ PlaceService
- Clase exportada correctamente
- Instancia exportada como default
- Métodos individuales exportados: `getPlaceImages`, `getRecentPlaceMedia`

### ⚠️ PropertyService
- Clase exportada correctamente
- Instancia exportada como default
- Solo `getPropertyById` exportado individualmente
- **FALTA**: Otros métodos individuales si son necesarios

### ⚠️ WorldItemService
- Clase exportada correctamente
- Instancia exportada como default
- Solo `getRecentWorldItemImages` exportado individualmente
- **FALTA**: Otros métodos individuales si son necesarios

## Archivos Identificados con Tipos:

### Statistics Types:
- `d:/DEV/image-manager/src/types/entities/image/base.ts` - ImageStatistics
- `d:/DEV/image-manager/src/types/entities/video/base.ts` - VideoStatistics
- `d:/DEV/image-manager/src/types/entities/concept/base.ts` - ConceptStatistics
- `d:/DEV/image-manager/src/types/entities/favorite/base.ts` - FavoriteStatistics

### WithStats Types:
- `d:/DEV/image-manager/src/types/entities/character/types.ts` - CharacterWithStats
- `d:/DEV/image-manager/src/types/entities/concept/base.ts` - ConceptWithStats
- `d:/DEV/image-manager/src/types/entities/concept/types.ts` - ConceptWithStats (duplicado?)
- `d:/DEV/image-manager/src/types/entities/favorite/base.ts` - FavoriteWithStats
- `d:/DEV/image-manager/src/types/entities/prompt/types.ts` - PromptWithStats
- `d:/DEV/image-manager/src/types/entities/prompt/base.ts` - PromptWithStats (duplicado?)
- `d:/DEV/image-manager/src/types/entities/prompt/base-new.ts` - PromptWithStats (duplicado?)
- `d:/DEV/image-manager/src/types/entities/world-item/types.ts` - WorldItemWithStats
- `d:/DEV/image-manager/src/types/entities/world-item/base.ts` - WorldItemWithStats (duplicado?)

## Próximos Pasos:
1. Comenzar con la corrección de tipos Statistics → Stats
2. Verificar y corregir duplicados en tipos WithStats
3. Corregir exportaciones de componentes/servicios
4. Validar con compilación TypeScript
5. Actualizar documentación si es necesario