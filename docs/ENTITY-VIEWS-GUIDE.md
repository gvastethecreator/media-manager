# Guía de Vistas Enriquecidas de Entidades

Esta guía explica cómo crear vistas enriquecidas para entidades abstractas usando los componentes existentes del proyecto.

## Componentes Disponibles

### 1. EntityHeader (`src/components/ui/entity-header.tsx`)

Componente completo para headers de páginas de entidades con:
- ✅ Breadcrumbs y navegación hacia atrás
- ✅ Título, subtítulo y descripción
- ✅ Icono y color personalizado
- ✅ Estadísticas con badges
- ✅ Acciones (botones principales y dropdown)
- ✅ Toggle de favorito
- ✅ Imagen destacada

**Ejemplo de uso:**
```tsx
<EntityHeader
  title={character.name}
  subtitle={character.species}
  description={character.description}
  icon={<Users className="w-5 h-5" />}
  primaryColor={character.color}
  stats={[
    { label: 'Imágenes', value: character._count?.images || 0, icon: ImageIcon },
    { label: 'Videos', value: character._count?.videos || 0, icon: Video },
  ]}
  actions={[
    { label: 'Editar', icon: <PencilIcon />, onClick: handleEdit },
    { label: 'Eliminar', icon: <TrashIcon />, onClick: handleDelete, variant: 'destructive', inDropdown: true },
  ]}
  isFavorite={character.isFavorite}
  onToggleFavorite={handleToggleFavorite}
  showFavoriteButton
  backUrl="/characters"
  backLabel="Volver a personajes"
/>
```

### 2. ContentFilters (`src/components/ui/content-filters.tsx`)

Barra de filtros reutilizable con:
- ✅ Búsqueda con input
- ✅ Filtros avanzados en dropdown
- ✅ Toggle Grid/List view
- ✅ Contador de resultados

**Ejemplo de uso:**
```tsx
<ContentFilters
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Buscar imágenes..."
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  filterGroups={[
    {
      label: 'Tipo',
      options: [
        { label: 'Solo imágenes', value: 'images', checked: showImages, onChange: setShowImages },
        { label: 'Solo videos', value: 'videos', checked: showVideos, onChange: setShowVideos },
      ],
    },
  ]}
  showResultCount
  resultCount={filteredItems.length}
  resultLabel="item"
/>
```

### 3. EntityCardDynamic (`src/components/ui/entity-card-dynamic.tsx`)

Card flexible para mostrar cualquier entidad con:
- ✅ Emoji y color
- ✅ Featured image
- ✅ Campos dinámicos
- ✅ Estadísticas
- ✅ Acciones
- ✅ Toggle favorito

### 4. EntityGrid (`src/components/features/entity-grid/entity-grid.tsx`)

Grid especializado para mostrar entidades con componentes visuales específicos por tipo:
- ✅ Componentes especializados para cada tipo de entidad (Character, Place, Concept, etc.)
- ✅ Grid responsive con auto-fill
- ✅ Modo compacto opcional
- ✅ Click y double-click handlers
- ✅ Hover effects y transiciones suaves

**Componentes de entidad disponibles:**
- `CharacterItem` - Muestra edad, género, especie, clase
- `PlaceItem` - Muestra tipo de ubicación, clima, región
- `ConceptItem` - Muestra definición y categoría
- `WorldItemItem` - Muestra tipo y rareza con badges de color
- `TagItem` - Visualización simplificada
- `CollectionItem` - Muestra total de items
- `PromptItem` - Muestra modelo y categoría
- `NoteItem` - Muestra preview del contenido

**Ejemplo de uso:**
```tsx
import { EntityGrid } from '@/components/features/entity-grid';

<EntityGrid
  items={characters}
  itemSize={200}
  gap={16}
  compact={false}
  onItemClick={(character) => console.log('Clicked:', character)}
  onItemDoubleClick={(character) => router.push(`/characters/${character.id}`)}
/>
```

### 5. FileBrowser (`src/components/features/file-browser/file-browser.tsx`)

Grid de items con:
- ✅ Múltiples vistas (grid, list, masonry)
- ✅ Selección múltiple
- ✅ Drag & drop
- ✅ Paginación
- ✅ Ordenamiento

## ¿Cuándo Usar Cada Componente?

### Para Mostrar Entidades (Characters, Places, Concepts, etc.)

**EntityGrid** - Mejor para:
- ✅ Grids de entidades con visualización rica y específica por tipo
- ✅ Cuando quieres mostrar información específica de cada entidad (edad, género, tipo, rareza, etc.)
- ✅ Navegación entre entidades (ej: lista de todos los personajes)
- ✅ Menos de 100 items (no necesita virtualización canvas)

**EntityCardDynamic** - Mejor para:
- ✅ Vistas de configuración/settings
- ✅ Cuando necesitas acciones inline (editar, eliminar, favorito)
- ✅ Grid simple con información básica
- ✅ Ya usado en todos los settings views

**Ejemplo - Lista de personajes:**
```tsx
<EntityGrid
  items={characters}
  onItemDoubleClick={(char) => router.push(`/characters/${char.id}`)}
/>
```

### Para Mostrar Contenido (Imágenes, Videos, Archivos)

**FileBrowser** - Mejor para:
- ✅ Imágenes y videos de una entidad
- ✅ Colecciones grandes (cientos o miles de items)
- ✅ Necesitas virtualización canvas para rendimiento
- ✅ Selección múltiple y acciones en batch
- ✅ Visor de imágenes integrado

**Ejemplo - Imágenes de un personaje:**
```tsx
<FileBrowser
  items={characterImages}
  viewMode="grid"
  onItemClick={(item) => console.log('Selected:', item)}
/>
```

### Combinación Recomendada

**Vista Enriquecida de Entidad:**
- `EntityHeader` - Información del personaje/lugar/concepto
- `Tabs` - Separar diferentes tipos de contenido
  - Tab "Imágenes" → `FileBrowser` (para las imágenes del personaje)
  - Tab "Entidades Relacionadas" → `EntityGrid` (para otros personajes relacionados)

**Vista de Lista/Galería:**
- `EntityGrid` - Para navegar entre entidades del mismo tipo
- Click → Redirige a la vista enriquecida individual

## Patrón Recomendado para Vistas Enriquecidas

### Estructura de Carpetas
```
src/components/views/
  characters/
    character-content-view.tsx       # Vista de contenido (imágenes, videos, etc.)
    characters-content-view.tsx      # Vista de lista de todos los personajes
    characters-view.tsx              # Vista principal con navegación
  places/
    place-content-view.tsx
    places-content-view.tsx
    places-view.tsx
```

### Template de Vista Enriquecida

```tsx
import { useState, useMemo } from 'react';
import { Users, Image, Video } from 'lucide-react';
import { EntityHeader } from '@/components/ui/entity-header';
import { ContentFilters } from '@/components/ui/content-filters';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCharacter, useCharacterImages, useRecentCharacterMedia } from '@/lib/api/characters';

export function CharacterEnrichedView({ characterId }: { characterId: string }) {
  const { data: character } = useCharacter(characterId);
  const { data: images = [] } = useCharacterImages(characterId);
  const { data: recentMedia = [] } = useRecentCharacterMedia(characterId, 50);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('images');

  // Filtrar items según búsqueda
  const filteredImages = useMemo(() => {
    return images.filter(img =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]);

  if (!character) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header enriquecido */}
      <EntityHeader
        title={character.name}
        subtitle={character.species}
        description={character.description}
        icon={<Users className="w-5 h-5" />}
        primaryColor={character.color}
        stats={[
          { label: 'Imágenes', value: character._count?.images || 0, icon: Image },
          { label: 'Videos', value: character._count?.videos || 0, icon: Video },
        ]}
        actions={[
          { label: 'Editar', onClick: () => {} },
          { label: 'Eliminar', onClick: () => {}, variant: 'destructive', inDropdown: true },
        ]}
        isFavorite={character.isFavorite}
        onToggleFavorite={() => {}}
        showFavoriteButton
        backUrl="/characters"
      />

      {/* Tabs para diferentes tipos de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="images">
            <Image className="w-4 h-4 mr-2" />
            Imágenes ({images.length})
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Video className="w-4 h-4 mr-2" />
            Media Reciente ({recentMedia.length})
          </TabsTrigger>
        </TabsList>

        {/* Contenido de Imágenes */}
        <TabsContent value="images" className="space-y-4">
          <ContentFilters
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar imágenes..."
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showResultCount
            resultCount={filteredImages.length}
            resultLabel="imagen"
          />

          <FileBrowser
            items={filteredImages}
            viewMode={viewMode}
            onItemClick={(item) => console.log('Clicked:', item)}
          />
        </TabsContent>

        {/* Contenido de Media Reciente */}
        <TabsContent value="recent">
          <FileBrowser
            items={recentMedia}
            viewMode={viewMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Hooks API Disponibles

### Characters
- `useCharacter(id)` - Obtener un personaje
- `useCharacterImages(id)` - Imágenes del personaje
- `useRecentCharacterMedia(id, limit)` - Media reciente
- `useRelatedCharacters(id, limit)` - Personajes relacionados
- `useUpdateCharacter()` - Actualizar personaje
- `useDeleteCharacter()` - Eliminar personaje

### Places
- `usePlace(id)`
- `usePlaceImages(id)`
- `useRecentPlaceMedia(id, limit)`
- `useUpdatePlace()`
- `useDeletePlace()`

### Concepts
- `useConcept(id)`
- `useConceptImages(id)`
- `useUpdateConcept()`
- `useDeleteConcept()`

*Similar para tags, collections, prompts, notes, world-items*

## Mejoras Recomendadas

### 1. Agregar Información Contextual
- Mostrar detalles de la entidad en el header (edad, género, especie, etc.)
- Usar badges y colores para categorías
- Imagen featured si existe

### 2. Filtros y Búsqueda
- Usar ContentFilters para búsqueda en tiempo real
- Agregar filtros por tipo, categoría, fecha, etc.
- Guardar preferencias de filtros en localStorage

### 3. Múltiples Vistas de Contenido
- Tabs para separar: Imágenes, Videos, Entidades Relacionadas
- Grid/List toggle
- Paginación para grandes volúmenes

### 4. Acciones Contextuales
- Editar, eliminar, favorito en el header
- Acciones rápidas en las cards
- Confirmación para acciones destructivas

### 5. Estados de Carga y Error
- Skeletons mientras carga
- Mensajes de error amigables
- Empty states cuando no hay contenido

## Ejemplo Completo

Ver `src/components/views/characters/character-enriched-view-example.tsx` para un ejemplo completo funcional.

## Próximos Pasos

1. ✅ EntityHeader - componente genérico ya existente
2. ✅ ContentFilters - componente de filtros creado
3. ✅ EntityCardDynamic - para mostrar entidades
4. ⏳ Mejorar vistas existentes usando estos componentes
5. ⏳ Agregar hooks adicionales si se necesitan (ej: useCharacterPlaces, useCharacterConcepts)
6. ⏳ Crear vistas detalladas para cada tipo de entidad

## Archivos vs Entidades

Es importante entender la diferencia entre **archivos escaneados** y **entidades abstractas**:

### Archivos Escaneados (Images, Videos, Audio, etc.)

**Qué son:** Archivos físicos importados del sistema de archivos

**Ejemplos:** `image.jpg`, `video.mp4`, `audio.mp3`, `document.pdf`

**Componentes:**
- Vistas usan **FileBrowser** (alto rendimiento con canvas)
- Items específicos: `ImageItem`, `VideoItem`, `AudioItem`, etc.
- Stores: `useImageStore`, `useVideoStore`, etc.

**Características:**
- Miles de items (necesitan virtualización)
- Thumbnails del archivo real
- Metadata del archivo (tamaño, resolución, duración)
- Visor integrado para abrir archivos

**Documentación:** Ver `FILE-VIEWS-STRUCTURE.md` para detalles completos

### Entidades Abstractas (Characters, Places, Concepts, etc.)

**Qué son:** Conceptos abstractos creados por el usuario para organizar contenido

**Ejemplos:** "Luke Skywalker", "Tatooine", "The Force"

**Componentes:**
- Vistas usan **EntityGrid** (React-based, ligero)
- Items específicos: `CharacterItem`, `PlaceItem`, `ConceptItem`, etc.
- Vistas enriquecidas con EntityHeader + Tabs + FileBrowser

**Características:**
- Pocos items (< 100 generalmente)
- Emoji y color personalizado
- Campos dinámicos específicos del tipo
- Asociaciones con archivos y otras entidades

**Documentación:** Este documento (ENTITY-VIEWS-GUIDE.md)

### Cuándo Usar Cada Uno

| Escenario | Componente | Razón |
|-----------|------------|-------|
| Mostrar todas las imágenes | FileBrowser | Miles de items, necesita virtualización |
| Mostrar todos los personajes | EntityGrid | < 100 personajes, visualización rica |
| Imágenes de un personaje | FileBrowser | Potencialmente muchas imágenes |
| Personajes relacionados | EntityGrid | Pocos personajes, info específica |
| Videos del sistema | FileBrowser | Miles de videos, rendimiento crítico |
| Tags de una imagen | EntityGrid | Pocos tags, badges visuales |

### Combinación en Vistas Enriquecidas

Las vistas enriquecidas de entidades combinan ambos:

```tsx
function CharacterDetailView({ characterId }) {
  return (
    <>
      <EntityHeader /> {/* Info del personaje */}

      <Tabs>
        {/* FileBrowser para archivos del personaje */}
        <Tab value="images">
          <FileBrowser items={characterImages} />
        </Tab>

        {/* EntityGrid para entidades relacionadas */}
        <Tab value="related">
          <EntityGrid items={relatedCharacters} />
        </Tab>
      </Tabs>
    </>
  );
}
```

## Notas

- Todos los componentes soportan dark mode
- Las animaciones están optimizadas con framer-motion
- Los componentes son accesibles (ARIA labels, keyboard navigation)
- TypeScript types completos para todas las props

## Documentos Relacionados

- **FILE-VIEWS-STRUCTURE.md** - Estructura completa de vistas de archivos escaneados
- **PRESET-FORMS-MIGRATION.md** - Sistema de presets para entidades
- **ENTITY-PRESETS-SYSTEM.md** - Detalles del sistema de configuración de entidades
