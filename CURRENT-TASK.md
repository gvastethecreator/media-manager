## Current Task: Resolve All Missing Export Errors

**Status:** IN_PROGRESS

### Description
Resolve all missing export errors that are causing TypeScript compilation failures across the codebase.

### Critical Missing Exports Found

#### Statistics/Stats Types
- [x] `CharacterStatistics` → should be `CharacterStats`
- [x] `ConceptStatistics` → should be `ConceptStats`
- [x] `ImageStatistics` → should be `ImageStats`
- [x] `VideoStatistics` → should be `VideoStats`
- [x] `FavoriteStatistics` → should be `FavoriteStats`

#### WithStats Types
- [x] `PromptWithStats` (multiple files)
- [x] `ConceptWithStats`
- [x] `NoteWithStats`
- [x] `CharacterWithStats`
- [x] `FavoriteWithStats`
- [x] `WorldItemWithStats`
- [x] `WildcardWithCounts` → should be `WildcardWithStats`

#### Component/Service Exports
- [x] `BaseContentView` (multiple content views)
- [x] `DetailsPanel` → should be `DetailsPanelV2`
- [x] `ViewOptionsStore` → should be `useViewOptionsStore`
- [x] `SystemStats` → should be `useSystemStats`
- [x] `NavigationData` → should be `useNavigationData`
- [x] `AppSettings` → should be `Settings`

#### Entity-Specific Issues
- [ ] `CharacterFilter` → should be `CharacterFilters`
- [x] `CharacterFilterItem` → should be `CharacterFilters`
- [x] `CharacterRelations` → should be `CharacterRelationship`
- [x] `CollectionSortBy` → should be `CollectionRarity`
- [x] `UploadedImageType` → should be `UploadedFileType`
- [x] `WorldItemUpdateInput` → should be `WorldItemUpdateData`
- [x] `WorldItemStats` → should be `WorldItemWithStats`

### Steps
1. [x] Search for all missing export errors
2. [x] Fix Statistics/Stats type exports
3. [x] Fix WithStats type exports
4. [x] Fix component/service exports
5. [ ] Fix entity-specific export issues (pending CharacterFilter)
6. [ ] Run type check to verify all fixes
7. [ ] Update task status to completed

### Acceptance Criteria
- All missing export errors are resolved
- TypeScript compilation passes without export-related errors
- Proper type names are used consistently across the codebase

## Descripción del Problema
El servidor está mostrando múltiples warnings sobre importaciones que no existen:

### Note Service
- getNotes, getNoteById, getNoteImages, getRecentNoteImages, getNoteCounts, getNoteStatuses, createNote, updateNote, deleteNote

### Place Service
- getPlaceImages, getRecentPlaceMedia

### Property Service
- getPropertyById

### World Item Service
- getRecentWorldItemImages

## Análisis
El problema principal es que los servicios definen clases `NoteService`, `PlaceService`, etc., pero no exportan instancias de estas clases. Los routes están intentando importar métodos directamente, pero necesitan importar instancias de las clases.

## Solución Propuesta
1. Exportar instancias de los servicios desde cada archivo .service.ts
2. Verificar que todos los métodos requeridos estén implementados
3. Actualizar las importaciones en los routes si es necesario