# Plantilla para Implementación de Stores

Este documento proporciona una plantilla estándar para implementar stores de entidades siguiendo el patrón de arquitectura por slices.

## Estructura de archivos

```
src/store/entities/[entidad]/
├── index.ts               # Exportación principal y barrel file
├── types.ts               # Definición de tipos para el store
├── store.ts               # Configuración del store con selectores optimizados
├── slices/                # División del store en slices funcionales
│   ├── core.ts            # Operaciones CRUD y estado principal
│   ├── filters.ts         # Filtrado, búsqueda y ordenación
│   ├── ui.ts              # Estado de UI (modales, vista, tema)
│   └── ...                # Otros slices específicos de la entidad
└── hooks/                 # (Opcional) Hooks personalizados específicos
    ├── use[Entidad].ts    # Hook principal para operaciones comunes
    └── ...                # Otros hooks específicos
```

## Plantilla para cada archivo

### 1. `types.ts`

```typescript
import type { [EntidadExtendida] } from '@/types/entities/[entidad]';

// Slice de Core - Estado principal
export interface [Entidad]CoreState {
  [entidades]: [EntidadExtendida][];
  current[Entidad]Id: string | null;
  current[Entidad]: [EntidadExtendida] | null;
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Slice de Core - Acciones
export interface [Entidad]CoreActions {
  fetch[Entidades]: () => Promise<void>;
  fetch[Entidad]ById: (id: string) => Promise<[EntidadExtendida] | null>;
  create[Entidad]: (data: any) => Promise<[EntidadExtendida] | null>;
  update[Entidad]: (id: string, data: any) => Promise<[EntidadExtendida] | null>;
  delete[Entidad]: (id: string) => Promise<boolean>;
  setCurrent[Entidad]Id: (id: string | null) => void;
  setCurrent[Entidad]: ([entidad]: [EntidadExtendida] | null) => void;
  resetError: () => void;
}

// Slice de UI - Estado de interfaz
export interface [Entidad]UIState {
  is[Entidad]ModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isSidebarOpen: boolean;
  viewMode: 'grid' | 'list' | 'cards';
  // ... otros estados UI
}

// Slice de UI - Acciones
export interface [Entidad]UIActions {
  toggle[Entidad]Modal: () => void;
  open[Entidad]Modal: () => void;
  close[Entidad]Modal: () => void;
  toggleDeleteModal: () => void;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  toggleSidebar: () => void;
  setViewMode: (mode: 'grid' | 'list' | 'cards') => void;
  // ... otras acciones UI
}

// Slice de Filtros - Estado
export interface [Entidad]FiltersState {
  searchTerm: string;
  filterCategory: string[];
  filterTag: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  // ... otros estados de filtros
}

// Slice de Filtros - Acciones
export interface [Entidad]FiltersActions {
  setSearchTerm: (term: string) => void;
  clearSearchTerm: () => void;
  addFilterCategory: (category: string) => void;
  removeFilterCategory: (category: string) => void;
  clearFilterCategories: () => void;
  addFilterTag: (tag: string) => void;
  removeFilterTag: (tag: string) => void;
  clearFilterTags: () => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  resetAllFilters: () => void;
  // ... otras acciones de filtros
}

// Store completo combinando todos los slices
export interface [Entidad]Store
  extends [Entidad]CoreState,
          [Entidad]CoreActions,
          [Entidad]UIState,
          [Entidad]UIActions,
          [Entidad]FiltersState,
          [Entidad]FiltersActions {
  // Propiedad para versión del store
  version?: number;
}
```

### 2. `store.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createCoreSlice } from './slices/core';
import { createFiltersSlice } from './slices/filters';
import { createUISlice } from './slices/ui';
import type { [Entidad]Store } from './types';
import type { [EntidadExtendida] } from '@/types/entities/[entidad]';

export const use[Entidad]Store = create<[Entidad]Store>()(
  devtools(
    (...a) => ({
      ...createCoreSlice(...a),
      ...createUISlice(...a),
      ...createFiltersSlice(...a),
    }),
    { name: '[Entidad]Store' }
  )
);

// Selectores para simplificar el acceso a estados específicos

// Core selectores
export const use[Entidades] = () => use[Entidad]Store(state => state.[entidades]);
export const useCurrent[Entidad]Id = () => use[Entidad]Store(state => state.current[Entidad]Id);
export const useCurrent[Entidad] = () => {
  const [entidades] = use[Entidad]Store(state => state.[entidades]);
  const currentId = use[Entidad]Store(state => state.current[Entidad]Id);
  return currentId ? [entidades].find([entidad] => [entidad].id === currentId) : null;
};
export const use[Entidad]Loading = () => use[Entidad]Store(state => state.loading);
export const use[Entidad]Error = () => use[Entidad]Store(state => state.error);

// UI selectores
export const use[Entidad]ModalOpen = () => use[Entidad]Store(state => state.is[Entidad]ModalOpen);
export const useDeleteModalOpen = () => use[Entidad]Store(state => state.isDeleteModalOpen);
export const useSidebarOpen = () => use[Entidad]Store(state => state.isSidebarOpen);
export const useViewMode = () => use[Entidad]Store(state => state.viewMode);

// Filtros selectores
export const useSearchTerm = () => use[Entidad]Store(state => state.searchTerm);
export const useFilterCategories = () => use[Entidad]Store(state => state.filterCategory);
export const useFilterTags = () => use[Entidad]Store(state => state.filterTag);
export const useSortSettings = () => ({
  sortBy: use[Entidad]Store(state => state.sortBy),
  sortOrder: use[Entidad]Store(state => state.sortOrder),
});

// Selector para filtrar [entidades] basado en los filtros actuales
export const useFiltered[Entidades] = () => {
  const [entidades] = use[Entidad]Store(state => state.[entidades]);
  const searchTerm = use[Entidad]Store(state => state.searchTerm);
  const filterCategories = use[Entidad]Store(state => state.filterCategory);
  const filterTags = use[Entidad]Store(state => state.filterTag);
  const sortBy = use[Entidad]Store(state => state.sortBy);
  const sortOrder = use[Entidad]Store(state => state.sortOrder);

  // Implementación de lógica de filtrado
  return [entidades]
    .filter([entidad] => {
      // Filtro por término de búsqueda
      const matchesSearch = searchTerm === '' ||
        [entidad].name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ([entidad].description && [entidad].description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por categorías (si hay alguna seleccionada)
      const matchesCategory = filterCategories.length === 0 ||
        ([entidad].category && filterCategories.includes([entidad].category));

      // Filtro por etiquetas (si hay alguna seleccionada)
      const matchesTags = filterTags.length === 0 ||
        ([entidad].tags && [entidad].tags.some(tag => filterTags.includes(tag)));

      return matchesSearch && matchesCategory && matchesTags;
    })
    .sort((a, b) => {
      // Implementación de lógica de ordenación
      // ...
    });
};
```

### 3. `slices/core.ts`

```typescript
import { serverLogger } from '@/lib/logger/server-logger';
import type { [EntidadExtendida] } from '@/types/entities/[entidad]';
import { StateCreator } from 'zustand';
import type { [Entidad]CoreActions, [Entidad]CoreState, [Entidad]Store } from '../types';

const coreLogger = serverLogger.withContext('[Entidad]Store:Core');

// Mock de datos para desarrollo (reemplazar por llamadas a API reales en producción)
const mock[Entidades]: [EntidadExtendida][] = [
  // ... datos de ejemplo
];

export const createCoreSlice: StateCreator<
  [Entidad]Store,
  [],
  [],
  [Entidad]CoreState & [Entidad]CoreActions
> = (set, get) => ({
  // Estado inicial
  [entidades]: [],
  current[Entidad]Id: null,
  current[Entidad]: null,
  loading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,

  // Acciones
  fetch[Entidades]: async () => {
    try {
      set({ loading: true, error: null });
      coreLogger.info('🔄 Obteniendo [entidades]');

      // Código para obtener datos (sustituir mock por llamada real a API)
      // ...

      set({ [entidades]: mock[Entidades], loading: false });
      return;
    } catch (error) {
      coreLogger.error('❌ Error obteniendo [entidades]:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error obteniendo [entidades]'
      });
    }
  },

  // Implementación del resto de acciones...
  // ...
});
```

### 4. `slices/ui.ts`

```typescript
import { serverLogger } from '@/lib/logger/server-logger';
import { StateCreator } from 'zustand';
import type { [Entidad]Store, [Entidad]UIActions, [Entidad]UIState } from '../types';

const uiLogger = serverLogger.withContext('[Entidad]Store:UI');

export const createUISlice: StateCreator<
  [Entidad]Store,
  [],
  [],
  [Entidad]UIState & [Entidad]UIActions
> = (set) => ({
  // Estado inicial
  is[Entidad]ModalOpen: false,
  isDeleteModalOpen: false,
  isSidebarOpen: true,
  viewMode: 'grid',

  // Acciones
  toggle[Entidad]Modal: () => {
    set(state => {
      const newState = !state.is[Entidad]ModalOpen;
      uiLogger.debug(`🔄 Modal de [entidad] ${newState ? 'abierto' : 'cerrado'}`);
      return { is[Entidad]ModalOpen: newState };
    });
  },

  // Implementación del resto de acciones...
  // ...
});
```

### 5. `slices/filters.ts`

```typescript
import { serverLogger } from '@/lib/logger/server-logger';
import { StateCreator } from 'zustand';
import type { [Entidad]FiltersActions, [Entidad]FiltersState, [Entidad]Store } from '../types';

const filtersLogger = serverLogger.withContext('[Entidad]Store:Filters');

export const createFiltersSlice: StateCreator<
  [Entidad]Store,
  [],
  [],
  [Entidad]FiltersState & [Entidad]FiltersActions
> = (set) => ({
  // Estado inicial
  searchTerm: '',
  filterCategory: [],
  filterTag: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',

  // Acciones
  setSearchTerm: (term) => {
    filtersLogger.debug(`🔍 Estableciendo término de búsqueda: ${term}`);
    set({ searchTerm: term });
  },

  // Implementación del resto de acciones...
  // ...
});
```

### 6. `index.ts`

```typescript
// Exportar el store principal y selectores
export * from './store';

// Exportar tipos
export * from './types';

// Exportar hooks personalizados (si existen)
export * from './hooks';
```

## Consejos para la implementación

1. **Mantener la estructura consistente**: Seguir siempre el mismo patrón para todas las entidades.
2. **Usar nomenclatura clara**: Nombrar funciones y variables de forma descriptiva.
3. **Implementar logging**: Usar serverLogger en todas las operaciones para facilitar debugging.
4. **Documentar interfaces**: Añadir comentarios JSDoc a las interfaces principales.
5. **Optimizar selectores**: Diseñar selectores para minimizar re-renders innecesarios.
6. **Validar datos**: Asegurar que los datos cumplen con las restricciones antes de modificar el estado.
7. **Manejar errores**: Implementar manejo de errores consistente en todas las operaciones asíncronas.
8. **Testear**: Crear tests para verificar el correcto funcionamiento del store.

## Ejemplos de uso

### Uso básico

```typescript
import {
  use[Entidad]Store,
  use[Entidades],
  useFiltered[Entidades]
} from '@/store/entities/[entidad]';

function [Entidad]List() {
  // Obtener los [entidades] filtrados
  const filtered[Entidades] = useFiltered[Entidades]();

  // Obtener funciones del store
  const { fetch[Entidades], setSearchTerm } = use[Entidad]Store();

  // Cargar datos al montar el componente
  useEffect(() => {
    fetch[Entidades]();
  }, [fetch[Entidades]]);

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar..."
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-4">
        {filtered[Entidades].map([entidad] => (
          <div key={[entidad].id} className="card">
            <h3>{[entidad].name}</h3>
            <p>{[entidad].description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Uso avanzado con middleware persistente

```typescript
// En store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const use[Entidad]Store = create<[Entidad]Store>()(
  devtools(
    persist(
      (...a) => ({
        ...createCoreSlice(...a),
        ...createUISlice(...a),
        ...createFiltersSlice(...a),
      }),
      {
        name: '[Entidad]Store',
        partialize: (state) => ({
          // Solo persistir estados específicos (UI, filtros)
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          isSidebarOpen: state.isSidebarOpen
        })
      }
    ),
    { name: '[Entidad]Store' }
  )
);
```