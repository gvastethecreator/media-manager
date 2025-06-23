# 🔄 Guía de Migración: FileItem → EntityWithStats

Esta guía explica cómo migrar componentes del tipo legacy `FileItem` a los tipos optimizados `WithStats`.

## 📋 Checklist Rápido

- [ ] Cambiar imports de `FileItem` a `EntityWithStats`
- [ ] Actualizar props del componente
- [ ] Usar type guards en lugar de discriminadores
- [ ] Reemplazar conversiones manuales con transformadores
- [ ] Actualizar tests si existen

## 🎯 Ejemplos de Migración

### 1️⃣ Migrar un componente que usa FileItem

**Antes:**
```tsx
import type { FileItem } from '@/types/files';

interface MyComponentProps {
  items: FileItem[];
  onItemClick: (item: FileItem) => void;
}

export function MyComponent({ items, onItemClick }: MyComponentProps) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id} onClick={() => onItemClick(item)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

**Después:**
```tsx
import type { EntityWithStats } from '@/types/migration';

interface MyComponentProps {
  items: EntityWithStats[];
  onItemClick: (item: EntityWithStats) => void;
}

export function MyComponent({ items, onItemClick }: MyComponentProps) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id} onClick={() => onItemClick(item)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### 2️⃣ Usar Type Guards en lugar de discriminadores

**Antes:**
```tsx
import type { AnyEntity } from '@/types/entities';

function renderEntity(entity: AnyEntity) {
  switch (entity.entityType) {
    case 'image':
      return <ImageCard image={entity} />;
    case 'video':
      return <VideoCard video={entity} />;
    default:
      return null;
  }
}
```

**Después:**
```tsx
import type { EntityWithStats } from '@/types/migration';
import { isImageWithStats, isVideoWithStats } from '@/types/migration';

function renderEntity(entity: EntityWithStats) {
  if (isImageWithStats(entity)) {
    return <ImageCard image={entity} />;
  }
  if (isVideoWithStats(entity)) {
    return <VideoCard video={entity} />;
  }
  return null;
}
```

### 3️⃣ Usar stores específicos en lugar de files.store

**Antes:**
```tsx
import { useFilesStore } from '@/store/files/files.store';

function MyView() {
  const { currentItems, loadAllImages } = useFilesStore();

  useEffect(() => {
    loadAllImages();
  }, []);

  return <FileBrowser items={currentItems} />;
}
```

**Después:**
```tsx
import { useImageStore } from '@/store/entities/image';

function MyView() {
  const { getSortedImages, loadImages } = useImageStore();

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const images = getSortedImages();
  return <FileBrowserV2 entityType="image" />;
}
```

### 4️⃣ Actualizar server actions

**Antes:**
```ts
export async function getImages(): Promise<FileItem[]> {
  const images = await prisma.image.findMany({
    include: {
      albums: true,
      tags: true,
      // ... muchas relaciones
    }
  });

  return images.map(imageToFileItem);
}
```

**Después:**
```ts
import { fromPrismaImageWithCounts } from '@/transformers/image';

export async function getImages(): Promise<ImageWithStats[]> {
  const images = await prisma.image.findMany({
    include: {
      _count: {
        select: {
          albums: true,
          tags: true,
          // ... solo conteos
        }
      }
    }
  });

  return images.map(fromPrismaImageWithCounts);
}
```

## 🛠️ Herramientas de Ayuda

### Hook de conversión temporal

Si necesitas compatibilidad temporal:

```tsx
import { useEntityConversion } from '@/hooks/use-entity-conversion';

function MyLegacyComponent({ fileItems }: { fileItems: FileItem[] }) {
  const { convertFileItems } = useEntityConversion();
  const entities = convertFileItems(fileItems);

  return <NewComponent items={entities} />;
}
```

### Componentes V2 disponibles

- `EntityCardV2` - Reemplaza a `EntityCard`
- `FileBrowserV2` - Reemplaza a `FileBrowser`
- Más componentes se añadirán progresivamente

## ⚠️ Problemas Comunes

### 1. "Property 'entityType' does not exist"
**Solución:** Usa type guards en lugar de discriminadores:
```tsx
// ❌ Mal
if (entity.entityType === 'image')

// ✅ Bien
if (isImageWithStats(entity))
```

### 2. "Type 'FileItem' is not assignable to type 'EntityWithStats'"
**Solución:** Usa el hook de conversión o actualiza el server action para devolver WithStats.

### 3. Propiedades faltantes en tipos Complete
Algunas entidades aún no tienen WithStats. Temporalmente usan Complete:
- Album, Audio, Document, etc.

## 📚 Recursos

- [Plan de Refactorización](./REFACTORING-PLAN-TYPES.md)
- [Progreso Actual](./REFACTORING-PROGRESS.md)
- [Tipos de Migración](../src/types/migration.ts)

## 🤝 Ayuda

Si encuentras problemas durante la migración:
1. Revisa esta guía
2. Consulta los ejemplos de componentes ya migrados
3. Pregunta en el canal de desarrollo