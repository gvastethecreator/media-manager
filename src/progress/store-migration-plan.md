# Plan de Migración de Stores

## Situación actual

El proyecto se encuentra en proceso de migración hacia una nueva arquitectura con tipos y transformers estandarizados. Como parte de esta migración, los stores también están evolucionando:

1. **Stores antiguos** - Archivos `.store.ts` en la raíz del directorio `src/store/` (ej: `collections.store.ts`, `tags.store.ts`)
2. **Stores nuevos** - Implementados con estructura modular en carpetas dedicadas dentro de `src/store/entities/` (ej: `src/store/entities/collection/`)

Los nuevos stores siguen una arquitectura más modular:
- Separación en slices (core, UI, filters)
- Selectores optimizados para evitar re-renders
- Mejor integración con los tipos extendidos
- Persistencia selectiva de configuraciones

## Archivos a migrar

**Stores antiguos a eliminar tras migración:**

1. `file-manager.store.ts` → Reemplazar con stores específicos de entidades
2. `unified-file-manager.ts` → No utilizado actualmente, eliminar
3. `files.store.ts` → Migrar a `/entities/file`
4. `image-resources.store.ts` → Migrar a `/entities/image`
5. `image-viewer.store.ts` → Migrar a `/entities/image`
6. `settings.store.ts` → Integrar con `/entities/profile`
7. `stats.store.ts` → Separar en stats específicos por entidad
8. `thumbnails.store.ts` → Migrar a `/entities/image` o `/entities/file`
9. `file-selection.store.ts` → Funcionalidad a distribuir en cada entidad
10. `details-panel.store.ts` → Migrar a componentes específicos con hooks
11. `search.store.ts` → Reestructurar como feature independiente o distribuir en entidades

**Archivos redundantes en /entities a consolidar:**
- `collections.store.ts` vs `/collection/index.ts`
- `characters.store.ts` vs `/character/index.ts`
- `concepts.store.ts` vs `/concept/index.ts`
- `tags.store.ts` vs `/tag/index.ts`
- etc.

## Plan paso a paso

### Fase 1: Inventario y Análisis (1-2 días)

1. **Mapeo completo de usos**
   - Identificar todos los componentes que importan stores antiguos
   - Documentar qué funcionalidades específicas utilizan
   - Categorizar por prioridad y complejidad de migración

2. **Análisis de API**
   - Comparar la API pública de los stores antiguos y nuevos
   - Identificar incompatibilidades o brechas funcionales
   - Crear mapeo de equivalencias (store antiguo → store nuevo)

### Fase 2: Implementación progresiva (3-4 días)

1. **Implementación del adaptador temporal**
   - Crear adaptadores que exporten la API antigua pero utilizando los stores nuevos
   - Ejemplo: `useFileManager` → `useAdaptedFileManager` que internamente usa stores específicos

2. **Actualización por componentes**
   - Actualizar componentes clave para usar los nuevos stores de forma directa
   - Priorizar componentes más simples y aislados primero
   - Actualizar componentes compartidos al final

3. **Consolidación de stores redundantes**
   - Unificar archivos duplicados en `/entities`
   - Consolidar nomenclatura (ej: `useConceptStore` vs `useConceptsStore`)
   - Mantener un registro de cambios para facilitar refactoring

### Fase 3: Limpieza y documentación (1-2 días)

1. **Eliminación de adaptadores temporales**
   - Una vez que todos los componentes se han actualizado, retirar los adaptadores

2. **Eliminación de stores antiguos**
   - Eliminar los archivos `.store.ts` obsoletos
   - Verificar que no quedan importaciones a estos stores

3. **Documentación**
   - Actualizar documentación técnica
   - Crear ejemplos de uso de los nuevos stores
   - Documentar patrones de selección y actualización de estado

## Reglas de migración

1. **Regla principal**: Un store por entidad, con arquitectura modular
2. **Selectores**: Usar selectores nombrados en lugar de desestructuración directa
3. **Acciones**: Migrar a acciones tipadas dentro de slices
4. **Persistencia**: Solo persistir configuraciones y preferencias, no datos
5. **Rendimiento**: Usar memoización y selectores optimizados para evitar re-renders

## Ejemplos de migración

### Antes:
```tsx
// En algún componente
import { useFileManager } from '@/store/file-manager.store';

function AlbumView() {
  const {
    currentItems,
    selectedItems,
    isLoading,
    loadItems,
    selectItem
  } = useFileManager();

  // Resto del componente
}
```

### Después:
```tsx
// En el mismo componente
import {
  useAlbumStore,
  selectAlbumItems,
  selectSelectedAlbums,
  selectIsLoading
} from '@/store/entities/album';

function AlbumView() {
  // Acceso a estado mediante selectores
  const items = useAlbumStore(selectAlbumItems);
  const selectedItems = useAlbumStore(selectSelectedAlbums);
  const isLoading = useAlbumStore(selectIsLoading);

  // Acceso a acciones
  const { loadAlbums, selectAlbum } = useAlbumStore();

  // Resto del componente
}
```

## Seguimiento del progreso

| Store antiguo | Nuevo store | Estado | Componentes actualizados | Pendientes |
|---------------|-------------|--------|--------------------------|------------|
| file-manager.store.ts | Múltiples | No iniciado | 0/27 | All |
| collections.store.ts | collection/ | En progreso | 2/8 | 6 |
| tags.store.ts | tag/ | En progreso | 1/5 | 4 |
| ... | ... | ... | ... | ... |

## Consideraciones adicionales

1. **Test unitarios**: Crear tests para los nuevos stores
2. **Performance**: Monitorear rendimiento después de migración
3. **Refactoring gradual**: Priorizar funcionamiento sobre perfección
4. **Feedback de equipo**: Recoger feedback sobre nueva estructura