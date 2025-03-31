# Entidad Tag

## Descripción

La entidad `Tag` representa etiquetas que permiten clasificar y organizar diferentes tipos de contenido en el sistema. Las etiquetas facilitan la búsqueda, filtrado y organización del contenido como imágenes, videos, álbumes, colecciones y otras entidades.

## Estructura de la entidad

```mermaid
graph TD
    A[Tag] --> B[Base Properties]
    A --> C[Relations]
    A --> D[UI Properties]

    B --> B1[id: string]
    B --> B2[name: string]
    B --> B3[description: string]
    B --> B4[category: string]
    B --> B5[shortcut: string]
    B --> B6[createdAt: Date]
    B --> B7[updatedAt: Date]

    C --> C1[images: Image[]]
    C --> C2[videos: Video[]]
    C --> C3[albums: Album[]]
    C --> C4[collections: Collection[]]
    C --> C5[characters: Character[]]
    C --> C6[places: Place[]]
    C --> C7[worldItems: WorldItem[]]
    C --> C8[concepts: Concept[]]
    C --> C9[prompts: Prompt[]]
    C --> C10[notes: Note[]]
    C --> C11[wildcards: Wildcard[]]
    C --> C12[properties: Property[]]
    C --> C13[groups: Group[]]

    D --> D1[emoji: string]
    D --> D2[color: string]
    D --> D3[featuredImage: string]
    D --> D4[isFavorite: boolean]

    style A fill:#d4f1f9
    style B fill:#ffecb3
    style C fill:#e1bee7
    style D fill:#c8e6c9
```

## Tipos principales

### TagBase

```typescript
export interface TagBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string | null;
  shortcut?: string | null;
  category: string;
  featuredImage?: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### TagRelations

```typescript
export interface TagRelations {
  images?: { id: string }[];
  videos?: { id: string }[];
  albums?: { id: string }[];
  collections?: { id: string }[];
  characters?: { id: string }[];
  places?: { id: string }[];
  worldItems?: { id: string }[];
  concepts?: { id: string }[];
  prompts?: { id: string }[];
  notes?: { id: string }[];
  wildcards?: { id: string }[];
  properties?: { id: string }[];
  groups?: { id: string }[];
}
```

### TagComplete

```typescript
export interface TagComplete extends TagBase, TagRelations, TagCounts {}
```

## Flujo de datos

El flujo de datos para tags sigue este patrón:

1. Se crea o actualiza un tag mediante el servicio o actions
2. Se valida con esquemas Zod y transformers
3. Se transforma a formato de Prisma y se guarda en la base de datos
4. Al recuperar, se transforma de nuevo al formato de la aplicación
5. Se utiliza el store Zustand para gestionar el estado en la UI

## Servicios disponibles

```typescript
interface TagService {
  search(options: TagSearchOptions): Promise<TagSearchResult>;
  findById(id: string): Promise<TagComplete | null>;
  create(data: TagCreateInput): Promise<TagComplete>;
  update(id: string, data: TagUpdateInput): Promise<TagComplete>;
  delete(id: string): Promise<boolean>;
  getRelatedTags(id: string, limit?: number): Promise<TagComplete[]>;
  findByCategory(category: string, limit?: number): Promise<TagComplete[]>;
}
```

## Ejemplos de uso

### Crear un tag

```typescript
// 1. Importar dependencias
import { getTagService } from '../services/tag.service';

// 2. Obtener servicio
const tagService = getTagService();

// 3. Crear tag
await tagService.create({
  name: 'Naturaleza',
  emoji: '🌲',
  color: '#10b981',
  category: 'tema',
  description: 'Imágenes de paisajes naturales',
  isFavorite: false
});
```

### Buscar tags

```typescript
// Buscar tags con filtros
const result = await tagService.search({
  where: {
    categories: ['tema'],
    isFavorite: true
  },
  take: 20,
  skip: 0,
  orderBy: { name: 'asc' }
});

// Resultado
console.log(`Total: ${result.total}`);
console.log(`Tiene más: ${result.hasMore}`);
result.items.forEach(tag => {
  console.log(`${tag.emoji} ${tag.name} - ${tag._count?.images || 0} imágenes`);
});
```

## Server Actions

La entidad dispone de server actions para operaciones CRUD:

```typescript
// Crear tag
const newTag = await createTag({
  name: 'Personajes',
  category: 'tipo',
  emoji: '👤'
});

// Actualizar tag
await updateTag(tagId, { isFavorite: true });

// Eliminar tag
await deleteTag(tagId);

// Buscar tags
const tags = await searchTags({
  search: 'naturaleza',
  take: 10
});
```

## Store Zustand

El store para tags permite gestionar el estado de los tags en la UI:

```typescript
import { useTagStore, useFilteredTags } from '@/store/entities/tag';

// Ejemplo de uso en un componente
function TagList() {
  const tags = useFilteredTags();
  const { fetchTags, selectTag, isLoading } = useTagStore();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {tags.map(tag => (
        <TagItem
          key={tag.id}
          tag={tag}
          onClick={() => selectTag(tag.id)}
        />
      ))}
    </div>
  );
}
```

## Integración con otras entidades

La entidad Tag se relaciona con múltiples entidades:

- **Images**: Para categorizar imágenes
- **Albums**: Para organizar álbumes por tema o contenido
- **Collections**: Para agrupar colecciones relacionadas
- **Characters/Places/WorldItems**: Para clasificar elementos de worldbuilding
- **Notes/Prompts**: Para organizar notas y prompts

## Consideraciones técnicas

- Los tags tienen una estructura flexible para adaptarse a diferentes categorías
- El campo `category` permite agrupar tags por tipo (tema, estilo, técnica, etc.)
- El campo `shortcut` permite asignar atajos de teclado para tags de uso frecuente
- La visualización de tags debe mantener consistencia en toda la aplicación
- Se recomienda usar el sistema de emojis y colores para mejorar la experiencia visual