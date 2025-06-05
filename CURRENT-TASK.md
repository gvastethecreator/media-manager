# 🧪 Configuración de Jest y Tests - Image Manager

## 📋 Análisis Inicial

### Stack Detectado

- **Next.js**: 15.3.3
- **React**: 19.1.0
- **TypeScript**: 5.8.3
- **Tailwind CSS**: 4.1.8
- **Prisma**: 6.9.0 (ORM actual)
- **Testing**: Jest 29.7.0 + Testing Library
- **Package Manager**: PNPM

### 🔍 Problemas Identificados (RESUELTOS)

1. ✅ **Resolver faltante**: `src/tests/resolver.js` creado
2. ✅ **Configuración incompleta**: Jest config ajustado para React 19 y Next.js 15
3. ✅ **Estructura de tests**: Directorio `src/tests/` creado con organización completa

### 🎯 Plan de Acción Escalonado

#### Fase 1: Configuración Base ✅ COMPLETADA

- [x] **Resolver faltante**: Creado `src/tests/resolver.js` con compatibilidad completa
- [x] **Configuración Jest**: Ajustado para React 19 + Next.js 15 + TypeScript 5.8
- [x] **Estructura de tests**: Creado directorio `/tests/` con organización completa
- [x] **Setup básico**: Configurado jest.setup.ts con mocks globales
- [x] **Utilities**: Creadas utilidades para testing (`test-utils.tsx`)
- [x] **Fixtures**: Datos de prueba para entidades (`entities.ts`)
- [x] **Mocks**: Prisma client + Next.js navigation + archivos
- [x] **Test inicial**: Verificación de funcionamiento con test básico
- [x] **Documentación**: README.md completo + AGENTS.md

#### Fase 2: Tests Unitarios 🔄 SIGUIENTE

- [ ] **Custom Hooks**: Testing de hooks personalizados del proyecto
- [ ] **Zustand Stores**: Testing de estado global y actions
- [ ] **Transformers/Utils**: Testing de funciones puras y helpers
- [ ] **Core Components**: Testing de componentes base Shadcn/UI

#### Fase 3: Tests de Componentes (FUTURO)

- [ ] **Features principales**: Folder scanner, image viewer
- [ ] **Formularios**: React Hook Form + validaciones
- [ ] **Layouts**: Navigation, panels, responsive
- [ ] **Interactions**: Drag & drop, keyboard shortcuts

#### Fase 4: Tests de Integración (FUTURO)

- [ ] **API Routes**: Testing de endpoints Next.js
- [ ] **Database**: Testing de operaciones Prisma
- [ ] **File System**: Testing de folder scanner
- [ ] **Cache**: Testing de strategies de cache

## 📊 Estado Actual

### ✅ Archivos Creados

```
src/tests/
├── resolver.js                      # ✅ Resolver personalizado Jest
├── image-mock.js                    # ✅ Mock archivos imagen
├── README.md                        # ✅ Documentación completa
├── helpers/test-utils.tsx           # ✅ Utilidades testing
├── fixtures/entities.ts             # ✅ Datos prueba
├── __mocks__/@prisma/client.ts      # ✅ Mock Prisma
├── __mocks__/next/navigation.ts     # ✅ Mock Next.js
└── setup/react-testing.test.tsx    # ✅ Test verificación
```

### ✅ Configuraciones Actualizadas

- **jest.config.ts**: Optimizado para stack actual
- **jest.setup.ts**: Setup global con mocks
- **tsconfig.test.json**: TypeScript para tests
- **AGENTS.md**: Documentación completa para agentes futuros

### 🎯 Próximos Pasos

1. **Ejecutar tests**: Verificar funcionamiento completo
2. **Hook testing**: Implementar tests para custom hooks
3. **Store testing**: Testing de Zustand stores
4. **Component testing**: Setup para Shadcn/UI

## Plan de Acción: Solucionar Problemas de Indexación de Carpetas

**Objetivo:** Resolver los errores de importación y ejecución que impiden la correcta indexación de carpetas y la actualización de su estado.

**Problemas Identificados:**

1.  **Errores de importación de Selectores de Zustand:**
    *   **Archivo afectado:** `src/hooks/folder/use-folder.ts`
    *   **Causa:** Intenta importar selectores (ej. `selectFolders`, `selectCurrentFolder`) desde `@/store/entities/folder` (que apunta a `src/store/entities/folder/index.ts`), pero estos selectores están definidos en `src/store/entities/folder/store.ts` y no son reexportados por `index.ts`.
    *   **Adicional:** Duplicación de la creación de `useFolderStore` en `index.ts` y `store.ts` dentro de `src/store/entities/folder/`.

2.  **Errores de importación y `TypeError` de Funciones de Caché:**
    *   **Archivos afectados:** `src/app/actions/folders/folder-crud.actions.ts`, `src/app/actions/folders/folder-indexing.actions.ts`.
    *   **Causa:** Intentan importar `invalidateFolderCache` e `invalidateAllFolderCache` desde `@/lib/folder-cache`, pero estas funciones no existen en dicho archivo. El `TypeError` "(0 , _lib_folder_cache__WEBPACK_IMPORTED_MODULE_3__.invalidateFolderCache) is not a function" es consecuencia directa.

3.  **Estado de Indexación no se Actualiza:**
    *   **Síntoma:** La API `/api/folders/status` devuelve `hasStatus: false` y `currentStatus: null`.
    *   **Causa probable:** Los errores anteriores interrumpen el flujo de indexación, impidiendo que el estado se actualice correctamente.

**Pasos para la Solución:**

1.  **Implementar Funciones de Invalidación de Caché:**
    *   **Archivo:** `src/lib/folder-cache.ts`
    *   **Acción:**
        *   Crear e exportar la función `invalidateFolderCache(folderId: string)`. Esta función deberá utilizar los métodos `.delete()` o `.clear(pattern)` de las instancias `folderResponseCache` y `folderListCache` para eliminar las entradas relevantes. Usar `getFolderCacheKey(folderId)` para generar las claves a eliminar.
        *   Crear e exportar la función `invalidateAllFolderCache()`. Esta función deberá limpiar todas las entradas de `folderListCache` (ej. `folderListCache.clear()`) y las entradas relevantes en `folderResponseCache` (ej. todas las que empiecen con `folders:list:` o `folder:` usando `folderResponseCache.clear('folders:list:')` y `folderResponseCache.clear('folder:')`).

2.  **Corregir Exportaciones y Estructura del Store de Folders:**
    *   **Archivo Principal:** `src/store/entities/folder/index.ts`
    *   **Archivo de Selectores:** `src/store/entities/folder/store.ts`
    *   **Acciones:**
        *   **Consolidar `useFolderStore`:**
            *   Revisar ambas definiciones de `useFolderStore` (en `index.ts` y `store.ts`).
            *   Modificar `src/store/entities/folder/index.ts` para que importe y reexporte `useFolderStore` desde `src/store/entities/folder/store.ts` (asumiendo que `store.ts` contiene la lógica más completa de combinación de slices) o, alternativamente, que `index.ts` sea la única fuente de creación del store y `store.ts` solo exporte los selectores. **Por ahora, se priorizará hacer que los selectores se exporten correctamente.**
        *   **Reexportar Selectores:**
            *   En `src/store/entities/folder/index.ts`, importar y reexportar todos los selectores necesarios (ej. `selectFolders`, `selectCurrentFolder`, `selectIsLoading`, `selectError`, `selectViewMode`, `selectItemSize`, `selectSortBy`, `selectSortDirection`, `selectSearchTerm`, `selectShowFavorites`, `selectFilteredFolders`, `selectFavoriteFolders`, `selectFolderStats`) desde `src/store/entities/folder/store.ts`.
            *   Ejemplo en `index.ts`: `export { selectFolders, selectCurrentFolder } from './store';`

3.  **Verificación y Pruebas:**
    *   Reiniciar el servidor de desarrollo.
    *   Probar la funcionalidad de indexación de carpetas desde la UI (`folders-settings.tsx`).
    *   Monitorear los logs del servidor y la consola del navegador para verificar la ausencia de los errores previamente identificados.
    *   Confirmar que el estado de indexación (`/api/folders/status`) se actualiza correctamente.

**Consideraciones Adicionales:**

*   Asegurar que las claves de caché utilizadas para invalidar sean consistentes con las claves utilizadas para almacenar los datos.
*   Revisar si los nombres de los hooks selectores exportados en `index.ts` (ej. `useFolderItems`) deberían usarse en lugar de los selectores directos en `use-folder.ts`, o si `use-folder.ts` realmente necesita los selectores puros. Por el momento, se enfoca en resolver las importaciones faltantes tal como están.

---

**Estado**: ✅ Configuración base completada
**Próximo**: Fase 2 - Tests Unitarios
**Fecha**: 5 de junio de 2025