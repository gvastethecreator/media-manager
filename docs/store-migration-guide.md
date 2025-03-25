# Guía de Migración de Stores

Este documento proporciona instrucciones para migrar de los stores antiguos a la nueva arquitectura de stores implementada por entidades con patrón de slices.

## Estructura de la nueva arquitectura

```
src/store/entities/[entidad]/
├── index.ts               # Exportación principal y barrel file
├── types.ts               # Definición de tipos para el store
├── store.ts               # Configuración del store con selectores optimizados
└── slices/                # División del store en slices funcionales
    ├── core.ts            # Operaciones CRUD y estado principal
    ├── filters.ts         # Filtrado, búsqueda y ordenación
    ├── ui.ts              # Estado de UI (modales, vista, tema)
    └── ...                # Otros slices específicos de la entidad
```

## Archivos a eliminar (stores antiguos)

Los siguientes archivos deben ser eliminados gradualmente a medida que se adopte la nueva estructura:

- `src/store/entities/albums.store.ts` → Reemplazar por `src/store/entities/album/`
- `src/store/entities/characters.store.ts` → Reemplazar por `src/store/entities/character/`
- `src/store/entities/collections.store.ts` → Reemplazar por `src/store/entities/collection/`
- `src/store/entities/concepts.store.ts` → Reemplazar por `src/store/entities/concept/`
- `src/store/entities/note.store.ts` → Reemplazar por `src/store/entities/note/`
- `src/store/entities/places.store.ts` → Reemplazar por `src/store/entities/place/`
- `src/store/entities/prompt.store.ts` → Reemplazar por `src/store/entities/prompt/`
- `src/store/entities/tags.store.ts` → Reemplazar por `src/store/entities/tag/`
- `src/store/entities/world-items.store.ts` → Reemplazar por `src/store/entities/world-item/`

## Pasos para la migración

1. **Identificar las dependencias del store antiguo**
   - Buscar todas las importaciones al store antiguo en el código
   - Identificar qué partes de la API del store se están utilizando

2. **Actualizar las importaciones**
   - Cambiar las importaciones del store antiguo al nuevo sistema de store
   - Ejemplo:
     ```typescript
     // Antes
     import { useAlbumsStore } from '@/store/entities/albums.store';

     // Después
     import { useAlbumStore, useAlbums, useFilteredAlbums } from '@/store/entities/album';
     ```

3. **Actualizar las llamadas al store**
   - Reemplazar acceso directo al store por selectores específicos
   - Ejemplo:
     ```typescript
     // Antes
     const albums = useAlbumsStore(state => state.albums);

     // Después
     const albums = useAlbums();
     ```

4. **Implementar adapters si es necesario**
   - Crear funciones adaptadoras para casos donde la API sea significativamente diferente
   - Usar estos adapters para facilitar la transición gradual

5. **Actualizar los server actions**
   - Integrar los transformers y mappers con los server actions existentes
   - Asegurar que los datos retornados sean compatibles con el nuevo formato

## Ventajas de la nueva arquitectura

1. **Organización por slices**
   - Mejor separación de responsabilidades
   - Más fácil de mantener y evolucionar
   - Reducción de la complejidad cognitiva

2. **Selectores optimizados**
   - Previenen re-renders innecesarios
   - Facilitan el acceso a partes específicas del estado
   - Mejoran la performance global de la aplicación

3. **Transformadores y validadores**
   - Garantizan la integridad de los datos
   - Facilitan la conversión entre formatos
   - Mejoran la seguridad tipo de TypeScript

4. **Middleware y extensibilidad**
   - Soporte para DevTools
   - Persistencia selectiva
   - Facilidad para añadir nuevas funcionalidades

## Orden de prioridad para la migración

1. Entidades core: Image, Folder, Tag
2. Entidades de organización: Album, Collection
3. Entidades de metadatos: Concept, Character, Place, WorldItem
4. Entidades de utilidad: Note, Prompt, VisualPreset
5. Entidades de sistema: Profile, QueueJob, Activity

## Ejemplo de uso del nuevo store (VisualPreset)

```typescript
// Importar el store completo (cuando se necesita acceder a acciones)
import { useVisualPresetStore } from '@/store/entities/visual-preset';

// Importar selectores específicos (para acceder a partes del estado)
import {
  useVisualPresets,
  useCurrentPreset,
  useFilteredPresets,
  usePresetModalOpen
} from '@/store/entities/visual-preset';

// Ejemplo de uso en un componente
function PresetsGallery() {
  // Acceso a presets filtrados (evita re-renders innecesarios)
  const filteredPresets = useFilteredPresets();

  // Acceso a acciones del store
  const { setSearchTerm, addFilterTag, fetchPresets } = useVisualPresetStore();

  // Acceso al estado de UI (modal)
  const isModalOpen = usePresetModalOpen();

  // Efecto para cargar datos
  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  return (
    <div>
      {/* Componentes UI */}
    </div>
  );
}
```

## Pruebas y verificación

Para cada entidad migrada, es importante:

1. Verificar la correcta actualización de los datos
2. Comprobar que los filtros y selectores funcionan adecuadamente
3. Asegurar que la persistencia de datos funciona según lo esperado
4. Verificar el rendimiento (especialmente con grandes conjuntos de datos)
5. Comprobar la interoperabilidad con otras partes del sistema