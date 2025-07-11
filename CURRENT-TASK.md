## Current Task: Resolve All Missing Export Errors

**Status:** IN_PROGRESS

### Description
Resolve all missing export errors that are causing TypeScript compilation failures across the codebase.

### Critical Missing Exports Found

#### Statistics/Stats Types
- [ ] `CharacterStatistics` → should be `CharacterStats`
- [ ] `ConceptStatistics` → should be `ConceptStats` 
- [ ] `ImageStatistics` → should be `ImageStats`
- [ ] `VideoStatistics` → should be `VideoStats`
- [ ] `FavoriteStatistics` → should be `FavoriteStats`

#### WithStats Types
- [ ] `PromptWithStats` (multiple files)
- [ ] `ConceptWithStats`
- [ ] `NoteWithStats`
- [ ] `CharacterWithStats`
- [ ] `FavoriteWithStats`
- [ ] `WorldItemWithStats`
- [ ] `WildcardWithCounts` → should be `WildcardWithStats`

#### Component/Service Exports
- [ ] `BaseContentView` (multiple content views)
- [ ] `DetailsPanel` → should be `DetailsPanelV2`
- [ ] `ViewOptionsStore` → should be `useViewOptionsStore`
- [ ] `SystemStats` → should be `useSystemStats`
- [ ] `NavigationData` → should be `useNavigationData`
- [ ] `AppSettings` → should be `Settings`

#### Entity-Specific Issues
- [ ] `CharacterFilter` → should be `CharacterFilters`
- [ ] `CharacterFilterItem` → should be `CharacterFilters`
- [ ] `CharacterRelations` → should be `CharacterRelationship`
- [ ] `CollectionSortBy` → should be `CollectionRarity`
- [ ] `UploadedImageType` → should be `UploadedFileType`
- [ ] `WorldItemUpdateInput` → should be `WorldItemUpdateData`
- [ ] `WorldItemStats` → should be `WorldItemWithStats`

### Steps
1. [x] Search for all missing export errors
2. [ ] Fix Statistics/Stats type exports
3. [ ] Fix WithStats type exports
4. [ ] Fix component/service exports
5. [ ] Fix entity-specific export issues
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