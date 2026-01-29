# Análisis de Refactorización de Settings

## Estado Actual

### Layouts Existentes

#### 1. Layout Clásico (`settings-view.tsx`)
- **Estructura**: Tabs verticales a la derecha (w-44), contenido a la izquierda
- **Problema**: Código duplicado masivo - 23 TabsContent casi idénticos
- **Vistas**: Conectadas a datos reales via React Query
- **Estado**: Funcional pero con deuda técnica

#### 2. Layout Moderno (`modern/modern-settings-view.tsx`)
- **Estructura**: Sidebar izquierda con categorías jerárquicas, breadcrumbs
- **Problema**: Vistas son solo mockups con datos estáticos
- **Vistas**: Placeholders sin conexión a API
- **Estado**: Diseño superior pero sin funcionalidad real

### Entidades de Settings (23 total)

#### Categoría: Sistema
1. **folders** - Carpetas (complejo, con reindexación)
2. **system** - Configuración del sistema
3. **interface** - Configuración de interfaz

#### Categoría: Organización
4. **albums** - Álbumes de imágenes
5. **collections** - Colecciones
6. **groups** - Grupos

#### Categoría: Taxonomía
7. **tags** - Etiquetas
8. **properties** - Propiedades

#### Categoría: Worldbuilding
9. **characters** - Personajes
10. **places** - Lugares
11. **world-items** - Objetos
12. **concepts** - Conceptos
13. **prompts** - Prompts
14. **notes** - Notas
15. **wildcards** - Wildcards

#### Categoría: Media
16. **thumbnails** - Miniaturas
17. **uploaded-images** - Imágenes subidas
18. **audio** - Audio
19. **document** - Documentos
20. **json-file** - Archivos JSON
21. **file3d** - Archivos 3D

#### Categoría: Otros
22. **shortcuts** - Atajos de teclado
23. **profiles** - Perfiles
24. **entities-cards** - Tarjetas de entidades

### Patrones Comunes en Vistas Clásicas

```typescript
// 1. Estado local
const [selectedItem, setSelectedItem] = useState<Entity | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [onlyFavorites, setOnlyFavorites] = useState(false);

// 2. Hooks de datos
const { data: response, isLoading, error } = useEntities({ search: searchQuery });
const deleteMutation = useDeleteEntity();
const entities = response?.data || [];

// 3. Estadísticas
const stats = useMemo(() => ({
  total: entities.length,
  favorites: entities.filter(e => e.isFavorite).length,
  // ...
}), [entities]);

// 4. Filtrado
const filteredEntities = useMemo(() => {
  return entities.filter(e => {
    // filtros por categoría, búsqueda, favoritos
  });
}, [entities, searchQuery, selectedCategories, onlyFavorites]);

// 5. Handlers CRUD
const handleDelete = useCallback(async (id: string) => { ... }, []);
const handleEdit = useCallback((entity: Entity) => { ... }, []);
const handleCreate = useCallback((entity: Entity) => { ... }, []);
```

### Componentes UI Comunes

1. **Header**: Título + descripción + acciones
2. **Stats Cards**: 3-4 cards con métricas principales
3. **Toolbar**: Búsqueda + filtros + botón crear
4. **Grid/List**: Vista de entidades con grid/list toggle
5. **Empty State**: Cuando no hay datos
6. **Form Dialog**: Crear/editar entidad
7. **Loading State**: Skeletons/spinners

### Props Interface Ideal

```typescript
interface EntitySettingsViewProps<T extends EntityWithStats> {
  // Configuración
  entityType: string;
  entityLabel: string;
  entityLabelPlural: string;
  icon: LucideIcon;
  color: string;
  
  // API Hooks
  useListQuery: (filters: ListFilters) => UseQueryResult<PaginatedResponse<T>>;
  useDeleteMutation: () => UseMutationResult<void, unknown, string>;
  
  // Configuración de filtros
  filterConfig?: {
    categories?: { id: string; label: string; color?: string }[];
    enableFavorites?: boolean;
    enableSearch?: boolean;
  };
  
  // Configuración de stats
  statsConfig?: {
    primary: StatConfig<T>;
    secondary?: StatConfig<T>[];
  };
  
  // Render
  renderCard: (entity: T, actions: CardActions) => ReactNode;
  renderForm: (props: FormProps<T>) => ReactNode;
}
```

## Plan de Refactorización

### Fase 1: Componentes Base
1. Crear `EntitySettingsView` componente genérico
2. Crear `SettingsStatsCard` para métricas
3. Crear `SettingsToolbar` para búsqueda/filtros
4. Crear `SettingsGridList` para vistas grid/list

### Fase 2: Migración de Vistas
1. Migrar vistas simples (albums, collections, groups)
2. Migrar vistas de worldbuilding (characters, places, items, concepts)
3. Migrar vistas de taxonomía (tags, properties)
4. Migrar vistas especiales (folders, thumbnails, system)

### Fase 3: Unificación
1. Eliminar `settings-view.tsx` clásico
2. Mantener solo layout moderno
3. Actualizar rutas
4. Limpieza de código duplicado

## Beneficios

1. **DRY**: Eliminar ~2000 líneas de código duplicado
2. **Mantenibilidad**: Un solo componente base para mantener
3. **Consistencia**: Todas las vistas con mismo comportamiento
4. **Type Safety**: Tipos genéricos para todas las entidades
5. **Testing**: Un solo componente base para testear
