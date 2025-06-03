# 🔄 Plan de Consolidación de Stores - Image Manager

## 📊 Análisis Actual de Stores

### 🚨 Stores Duplicados Identificados

```mermaid
graph TB
    subgraph "🗂️ File Management Stores (DUPLICADOS)"
        FS["`📂 files.store.ts
        - currentItems: FileItem[]
        - displayedItems: FileItem[]
        - selectedItem/selectedIds
        - handleSelectFolder()
        - loadAllImages()`"]

        FMS["`📂 file-manager.store.ts
        - currentItems: FileItem[]
        - displayedItems: FileItem[]
        - selectedItem/selectedItems
        - setCurrentFolder()
        - transformToFileItem()`"]

        UFS["`📂 unified-file-manager.ts
        - currentItems: FileItem[]
        - displayedItems: FileItem[]
        - selectedItems[]
        - setCurrentFolder()
        - operationQueue: Promise[]`"]

        EFS["`📂 entities/folder/store.ts
        - Similar functionality
        - Folder specific operations`"]

        HOOK["`🪝 hooks/use-file-manager.ts
        - currentFolder: string
        - setCurrentFolder()
        - stats management`"]
    end

    subgraph "🎯 Functionality Overlap"
        OVERLAP["`⚠️ PROBLEMAS:
        - 4-5 stores con state similar
        - Duplicación de lógica de selección
        - Múltiples transformadores de datos
        - Sincronización inconsistente
        - Re-renders excesivos`"]
    end

    FS --> OVERLAP
    FMS --> OVERLAP
    UFS --> OVERLAP
    EFS --> OVERLAP
    HOOK --> OVERLAP
```

## 🎯 Store Unificado Propuesto

### 📋 Arquitectura Nueva

```mermaid
graph TB
    subgraph "🏗️ NUEVO: Unified File Manager Store"
        UNI["`📚 unified-file-manager.store.ts
        ✅ Estado unificado
        ✅ Cache integrado (LRU)
        ✅ Throttling de eventos
        ✅ Operation Queue optimizada
        ✅ Selección optimizada
        ✅ Transformación única`"]
    end

    subgraph "🔌 Interfaces Especializadas"
        FOLDER_INT["`📂 useFolder()
        - Wrapper para carpetas
        - Cache específico
        - Validaciones folder`"]

        COLLECTION_INT["`📚 useCollection()
        - Wrapper para colecciones
        - Metadata específica
        - Relaciones collection`"]

        SELECTION_INT["`🎯 useSelection()
        - Lógica de selección
        - Multi-select optimizado
        - Keyboard shortcuts`"]

        NAVIGATION_INT["`🧭 useNavigation()
        - History management
        - Breadcrumb logic
        - State transitions`"]
    end

    subgraph "⚡ Performance Modules"
        CACHE["`💾 folder-cache.ts
        - LRU Cache
        - Invalidation strategy
        - Memory management`"]

        THROTTLE["`⏱️ event-throttler.ts
        - Event batching
        - Debounce logic
        - Queue management`"]
    end

    UNI --> FOLDER_INT
    UNI --> COLLECTION_INT
    UNI --> SELECTION_INT
    UNI --> NAVIGATION_INT

    CACHE --> UNI
    THROTTLE --> UNI
```

## 🛠️ Plan de Implementación

### Phase 1: Crear Store Unificado Base ⚡

1. **Crear nuevo store unificado**:
   - `src/store/unified-file-manager.store.ts` (ya existe, optimizar)
   - Integrar cache y throttling existentes
   - Unificar interfaces de todos los stores

2. **Migrar funcionalidad core**:
   - Selección de items (multi-select, keyboard)
   - Navegación entre contextos (folder/collection/tag)
   - Carga y display de items con batch loading
   - Estado de loading y error handling

### Phase 2: Crear Interfaces Especializadas 🎯

3. **useFolder() Hook**:

   ```typescript
   // src/lib/hooks/use-folder.ts
   export function useFolder() {
     const store = useUnifiedFileManager()
     return {
       currentFolder: store.currentFolder,
       setCurrentFolder: store.setCurrentFolder,
       folderImages: store.currentItems,
       // Folder-specific operations
     }
   }
   ```

4. **useSelection() Hook**:

   ```typescript
   // src/lib/hooks/use-selection.ts
   export function useSelection() {
     const store = useUnifiedFileManager()
     return {
       selectedItems: store.selectedItems,
       toggleSelection: store.toggleItemSelection,
       clearSelection: store.clearSelection,
       // Selection-specific logic
     }
   }
   ```

### Phase 3: Migrar Componentes 🔄

5. **Actualizar componentes existentes**:
   - Reemplazar `useFilesStore` → `useFolder()`
   - Reemplazar `useFileManager` → `useUnifiedFileManager()`
   - Actualizar importaciones y referencias

6. **Testing y validación**:
   - Verificar que la funcionalidad se mantiene
   - Comprobar performance improvements
   - Validar que no hay memory leaks

### Phase 4: Cleanup 🧹

7. **Eliminar stores obsoletos**:
   - `src/store/files/files.store.ts`
   - `src/store/files/file-manager.store.ts`
   - `src/store/entities/folder/store.ts`
   - `src/lib/hooks/use-file-manager.ts` (hook simple)

8. **Actualizar documentación**:
   - README con nueva arquitectura
   - Diagramas de flujo actualizados
   - Ejemplos de uso

## 🎯 Beneficios Esperados

### 📈 Performance Improvements

- ✅ **Menos re-renders**: Estado unificado reduce re-renders innecesarios
- ✅ **Cache inteligente**: LRU cache reduce fetches duplicados
- ✅ **Event throttling**: Menos eventos de revalidación
- ✅ **Operation queue**: Evita race conditions en navegación

### 🏗️ Architecture Benefits

- ✅ **Single source of truth**: Un solo store para file management
- ✅ **Mejor testing**: Lógica centralizada es más fácil de testear
- ✅ **Mantenibilidad**: Menos duplicación de código
- ✅ **Escalabilidad**: Arquitectura preparada para nuevas features

### 🐛 Bug Fixes

- ✅ **Sincronización**: Elimina inconsistencias entre stores
- ✅ **Memory leaks**: Mejor gestión de memoria con cache LRU
- ✅ **Race conditions**: Operation queue previene conflictos

## 🚀 Estado Actual: EN PROGRESO

- [x] Análisis de stores duplicados completado
- [x] Arquitectura unificada diseñada
- [x] Cache y throttling implementados
- [ ] **PRÓXIMO**: Consolidar unified-file-manager.store.ts
- [ ] Crear hooks especializados
- [ ] Migrar componentes
- [ ] Cleanup stores obsoletos

---

*Documento creado: ${new Date().toISOString()}*
*Última actualización: ${new Date().toISOString()}*
