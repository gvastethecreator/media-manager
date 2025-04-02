# Ejemplos de Uso: Entidad Group

Este documento proporciona ejemplos prácticos de cómo trabajar con la entidad Group en diferentes contextos.

## Server Actions

### Obtener todos los grupos

```typescript
import { getGroups } from '@/app/actions/groups/group.actions';

async function loadAllGroups() {
  try {
    const groups = await getGroups();
    console.log(`Obtenidos ${groups.length} grupos`);
    return groups;
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    throw error;
  }
}
```

### Crear un nuevo grupo

```typescript
import { createGroup } from '@/app/actions/groups/group.actions';
import type { CreateGroupData } from '@/types/entities/group/types';

async function createNewGroup() {
  const groupData: CreateGroupData = {
    name: 'Paisajes',
    emoji: '🏞️',
    color: '#4CAF50',
    description: 'Imágenes de paisajes y escenas naturales',
    isFavorite: true
  };

  try {
    const newGroup = await createGroup(groupData);
    console.log('Grupo creado:', newGroup);
    return newGroup;
  } catch (error) {
    console.error('Error al crear grupo:', error);
    throw error;
  }
}
```

### Actualizar un grupo existente

```typescript
import { updateGroup } from '@/app/actions/groups/group.actions';
import type { UpdateGroupData } from '@/types/entities/group/types';

async function updateExistingGroup(groupId: string) {
  const updateData: UpdateGroupData = {
    name: 'Paisajes Naturales',
    description: 'Imágenes de paisajes, escenas naturales y fotografía de naturaleza',
    isFavorite: true
  };

  try {
    const updatedGroup = await updateGroup(groupId, updateData);
    console.log('Grupo actualizado:', updatedGroup);
    return updatedGroup;
  } catch (error) {
    console.error('Error al actualizar grupo:', error);
    throw error;
  }
}
```

### Eliminar un grupo

```typescript
import { deleteGroup } from '@/app/actions/groups/group.actions';

async function removeGroup(groupId: string) {
  try {
    const result = await deleteGroup(groupId);
    console.log('Grupo eliminado:', result);
    return result;
  } catch (error) {
    console.error('Error al eliminar grupo:', error);
    throw error;
  }
}
```

### Cambiar estado de favorito

```typescript
import { toggleGroupFavorite } from '@/app/actions/groups/group.actions';

async function toggleFavorite(groupId: string) {
  try {
    const updatedGroup = await toggleGroupFavorite(groupId);
    console.log(`Grupo ${updatedGroup.isFavorite ? 'marcado como' : 'desmarcado de'} favorito:`, updatedGroup);
    return updatedGroup;
  } catch (error) {
    console.error('Error al cambiar estado de favorito:', error);
    throw error;
  }
}
```

## Servicios

### Búsqueda avanzada de grupos

```typescript
import { searchGroupsService } from '@/services/group-service-export';

async function searchGroups() {
  const filters = {
    name: { contains: 'paisaje' },
    isFavorite: true
  };

  const options = {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortOrder: 'asc' as const
  };

  try {
    const result = await searchGroupsService(filters, options);
    console.log(`Encontrados ${result.pagination.totalItems} grupos`);
    return result;
  } catch (error) {
    console.error('Error en búsqueda de grupos:', error);
    throw error;
  }
}
```

### Obtener estadísticas de un grupo

```typescript
import { getGroupStatsService } from '@/services/group-service-export';

async function getGroupStatistics(groupId: string) {
  try {
    const groupWithStats = await getGroupStatsService(groupId);

    // Mostrar estadísticas
    console.log('Estadísticas del grupo:');
    console.log(`- Total de elementos: ${groupWithStats.stats.totalItems}`);
    console.log(`- Imágenes: ${groupWithStats.stats.totalImages}`);
    console.log(`- Videos: ${groupWithStats.stats.totalVideos}`);
    console.log(`- Álbumes: ${groupWithStats.stats.totalAlbums}`);

    return groupWithStats;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}
```

### Añadir elementos a un grupo

```typescript
import { addItemToGroupService } from '@/services/group-service-export';

async function addImageToGroup(groupId: string, imageId: string) {
  try {
    await addItemToGroupService(groupId, imageId, 'images');
    console.log(`Imagen ${imageId} añadida al grupo ${groupId}`);
  } catch (error) {
    console.error('Error al añadir imagen al grupo:', error);
    throw error;
  }
}

async function addMultipleItemsToGroup(groupId: string) {
  try {
    // Añadir varios elementos de diferentes tipos
    await Promise.all([
      addItemToGroupService(groupId, 'img123', 'images'),
      addItemToGroupService(groupId, 'vid456', 'videos'),
      addItemToGroupService(groupId, 'alb789', 'albums')
    ]);

    console.log('Elementos añadidos al grupo');
  } catch (error) {
    console.error('Error al añadir elementos al grupo:', error);
    throw error;
  }
}
```

## Zustand Store

### Uso básico del store

```typescript
import { useGroupStore } from '@/store/entities/group';

// En un componente React
function GroupsComponent() {
  // Obtener grupos del store
  const groups = useGroupStore(state => state.getGroups());

  // Comprobar si hay grupo con un ID específico
  const hasSpecificGroup = useGroupStore(state => !!state.getGroup('group123'));

  // Estado de carga
  const isLoading = useGroupStore(state => state.core.isLoading);

  // Error
  const error = useGroupStore(state => state.core.error);

  // ...resto del componente
}
```

### Operaciones con el store

```typescript
import { useGroupStore } from '@/store/entities/group';
import type { CreateGroupData, UpdateGroupData } from '@/types/entities/group/types';

// En un componente React
function GroupsManager() {
  const addGroup = useGroupStore(state => state.addGroup);
  const updateGroup = useGroupStore(state => state.updateGroup);
  const deleteGroup = useGroupStore(state => state.deleteGroup);

  // Añadir grupo al store
  const handleAddGroup = (group) => {
    addGroup(group);
  };

  // Actualizar grupo en el store
  const handleUpdateGroup = (id, data: UpdateGroupData) => {
    updateGroup(id, data);
  };

  // Eliminar grupo del store
  const handleDeleteGroup = (id) => {
    deleteGroup(id);
  };

  // ...resto del componente
}
```

### Selección y UI

```typescript
import { useGroupStore } from '@/store/entities/group';

// En un componente React
function GroupSelector() {
  // Selectores UI
  const selectedIds = useGroupStore(state => state.ui.selectedIds);
  const viewMode = useGroupStore(state => state.ui.viewMode);

  // Acciones UI
  const selectGroup = useGroupStore(state => state.selectGroup);
  const deselectGroup = useGroupStore(state => state.deselectGroup);
  const clearSelection = useGroupStore(state => state.clearSelection);
  const setViewMode = useGroupStore(state => state.setViewMode);

  // Manejar selección
  const handleGroupClick = (groupId) => {
    if (selectedIds.includes(groupId)) {
      deselectGroup(groupId);
    } else {
      selectGroup(groupId);
    }
  };

  // ...resto del componente
}
```

### Filtros y búsqueda

```typescript
import { useGroupStore } from '@/store/entities/group';
import { GroupSortCriteria } from '@/types/entities/group/types';

// En un componente React
function GroupFilters() {
  // Selectores de filtros
  const sortBy = useGroupStore(state => state.filters.sortBy);
  const searchQuery = useGroupStore(state => state.filters.searchQuery);
  const filterFavorites = useGroupStore(state => state.filters.filterFavorites);

  // Acciones de filtros
  const setSortBy = useGroupStore(state => state.setSortBy);
  const setSearchQuery = useGroupStore(state => state.setSearchQuery);
  const setFilterFavorites = useGroupStore(state => state.setFilterFavorites);

  // Cambiar criterio de ordenación
  const handleSortChange = (criteria) => {
    setSortBy(criteria);
  };

  // Aplicar filtro de búsqueda
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filtrar por favoritos
  const handleFilterFavorites = (checked) => {
    setFilterFavorites(checked);
  };

  // ...resto del componente
}
```

## Transformadores

### Transformar un grupo

```typescript
import { transformGroup } from '@/transformers/group';

function processGroup(groupData) {
  try {
    const transformedGroup = transformGroup(groupData);
    console.log('Grupo transformado:', transformedGroup);
    return transformedGroup;
  } catch (error) {
    console.error('Error al transformar grupo:', error);
    throw error;
  }
}
```

### Obtener estadísticas

```typescript
import { transformGroupToWithStats } from '@/transformers/group';

function getGroupStatistics(groupData) {
  try {
    const groupWithStats = transformGroupToWithStats(groupData);

    // Calcular porcentajes
    const totalItems = groupWithStats.stats.totalItems;
    const imagePercentage = totalItems > 0
      ? (groupWithStats.stats.totalImages / totalItems) * 100
      : 0;

    console.log(`El grupo "${groupWithStats.name}" contiene:`);
    console.log(`- ${groupWithStats.stats.totalImages} imágenes (${imagePercentage.toFixed(1)}%)`);

    return groupWithStats;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}
```

### Transformar múltiples grupos

```typescript
import { transformGroups } from '@/transformers/group';

function processMultipleGroups(groupsData) {
  try {
    const transformedGroups = transformGroups(groupsData);

    // Ejemplo: encontrar el grupo con más elementos
    let maxItemsGroup = null;
    let maxItems = 0;

    for (const group of transformedGroups) {
      const totalItems = Object.values(group._count || {}).reduce((sum, count) => sum + count, 0);
      if (totalItems > maxItems) {
        maxItems = totalItems;
        maxItemsGroup = group;
      }
    }

    console.log(`Grupo con más elementos: "${maxItemsGroup?.name}" (${maxItems} elementos)`);

    return transformedGroups;
  } catch (error) {
    console.error('Error al transformar grupos:', error);
    throw error;
  }
}
```

## Uso en Componentes

### Ejemplo de grupo individual

```tsx
import { type GroupWithStats } from '@/types/entities/group/types';
import { Badge } from '@/components/ui/badge';

interface GroupCardProps {
  group: GroupWithStats;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onFavoriteToggle: (id: string) => void;
}

export function GroupCard({ group, onEdit, onDelete, onFavoriteToggle }: GroupCardProps) {
  // Calcular total de elementos
  const totalItems = group._count
    ? Object.values(group._count).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div
      className="p-4 border rounded-lg shadow-sm"
      style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{group.emoji}</span>
          <h3 className="text-lg font-medium">{group.name}</h3>
        </div>
        {group.isFavorite && <span className="text-yellow-500">⭐</span>}
      </div>

      {group.description && (
        <p className="mt-2 text-sm text-gray-600">{group.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <Badge variant="outline" className="px-2">
          {totalItems} {totalItems === 1 ? 'elemento' : 'elementos'}
        </Badge>

        <div className="flex gap-2">
          <button
            onClick={() => onFavoriteToggle(group.id)}
            className="text-sm text-blue-500 hover:underline"
          >
            {group.isFavorite ? 'Quitar favorito' : 'Favorito'}
          </button>
          <button
            onClick={() => onEdit(group.id)}
            className="text-sm text-blue-500 hover:underline"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(group.id)}
            className="text-sm text-red-500 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Uso del componente GroupCard

```tsx
import { useEffect, useState } from 'react';
import { GroupCard } from './GroupCard';
import { getGroups, deleteGroup, toggleGroupFavorite } from '@/app/actions/groups/group.actions';
import type { GroupWithStats } from '@/types/entities/group/types';

export function GroupList() {
  const [groups, setGroups] = useState<GroupWithStats[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar grupos
  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (error) {
        console.error('Error al cargar grupos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, []);

  // Manejar edición
  const handleEdit = (id: string) => {
    // Implementación para editar
    console.log('Editar grupo:', id);
  };

  // Manejar eliminación
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo?')) return;

    try {
      await deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
    }
  };

  // Manejar cambio de favorito
  const handleFavoriteToggle = async (id: string) => {
    try {
      const updatedGroup = await toggleGroupFavorite(id);
      setGroups(prev => prev.map(g => g.id === id ? updatedGroup : g));
    } catch (error) {
      console.error('Error al cambiar favorito:', error);
    }
  };

  if (loading) return <div>Cargando grupos...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mis Grupos ({groups.length})</h2>

      {groups.length === 0 ? (
        <p className="text-gray-500">No hay grupos disponibles.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Manejo de errores

```typescript
import { TransformerError } from '@/lib/errors';
import { transformGroup } from '@/transformers/group';

function safelyTransformGroup(groupData: unknown) {
  try {
    // Verificar si tenemos datos
    if (!groupData) {
      throw new Error('No se proporcionaron datos de grupo');
    }

    // Transformar
    return transformGroup(groupData);
  } catch (error) {
    // Manejar error del transformador
    if (error instanceof TransformerError) {
      console.error('Error en el transformador:', error.message);
      // Realizar acciones específicas para errores del transformador
    } else {
      console.error('Error inesperado:', error);
    }

    // Devolver un objeto por defecto o null
    return null;
  }
}
```