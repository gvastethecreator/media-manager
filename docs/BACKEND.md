# 🔧 Backend Stack & Guidelines

## 📚 Stack Tecnológico

### Database
- **SQLite 3**
  - Local storage
  - Zero config
  - Single file
  - ACID compliant

- **Prisma ORM**
  - Type safety
  - Migrations
  - Seeding
  - Studio UI

### API
- **Next.js API Routes**
  - Route Handlers
  - Edge Runtime
  - Middleware
  - API Groups

### File System
- **Node.js fs/promises**
  - Async operations
  - File watching
  - Stream support
  - Path handling

### Servicios Principales

#### 1. Collection Service
```typescript
interface CollectionService {
  // Operaciones básicas
  getCollections(): Promise<CollectionWithStats[]>
  getCollection(id: string): Promise<CollectionWithStats | null>
  createCollection(data: CollectionCreate): Promise<Collection>
  updateCollection(id: string, data: CollectionUpdate): Promise<Collection>
  deleteCollection(id: string): Promise<void>

  // Operaciones de imágenes
  addImageToCollection(collectionId: string, imageId: string): Promise<void>
  removeImageFromCollection(collectionId: string, imageId: string): Promise<void>
}

interface CollectionCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  sortBy?: string
  filters?: any[]
}
```

#### 2. Folder Service
```typescript
interface FolderService {
  // Operaciones básicas
  getFolders(): Promise<Folder[]>
  addFolder(params: AddFolderParams): Promise<Folder>
  updateFolder(id: string, params: Partial<AddFolderParams>): Promise<Folder>
  deleteFolder(id: string): Promise<void>

  // Operaciones avanzadas
  reindexFolder(id: string): Promise<void>
  getStats(id: string): Promise<FolderStats>
  watchFolder(id: string): Promise<void>
}

interface AddFolderParams {
  path: string
  name?: string
  watch?: boolean
}
```

#### 3. Image Service
```typescript
interface ImageService {
  // Operaciones de imagen
  processImage(file: File): Promise<ProcessedImage>
  generateThumbnail(image: Image): Promise<string>
  optimizeImage(image: Image): Promise<OptimizedImage>

  // Metadata
  extractMetadata(image: Image): Promise<ImageMetadata>
  updateMetadata(id: string, metadata: Partial<ImageMetadata>): Promise<void>
}
```

#### 4. Profile Service
```typescript
interface ProfileService {
  // Operaciones básicas
  getProfiles(): Promise<Profile[]>
  getProfile(id: string): Promise<Profile | null>
  createProfile(data: ProfileCreate): Promise<Profile>
  updateProfile(id: string, data: ProfileUpdate): Promise<Profile>
  deleteProfile(id: string): Promise<void>

  // Operaciones específicas
  activateProfile(id: string): Promise<void>
  getActiveProfile(): Promise<Profile | null>
  saveProfileSettings(id: string, settings: ProfileSettings): Promise<void>
}

interface ProfileCreate {
  name: string
  description?: string
  isDefault?: boolean
  settings?: ProfileSettings
}

interface ProfileSettings {
  theme: 'light' | 'dark' | 'system'
  viewMode: 'grid' | 'list'
  sortBy: string
  thumbnailSize: number
  showHiddenFiles: boolean
  customFilters?: Filter[]
}
```

#### 5. Tag Service
```typescript
interface TagService {
  // Operaciones básicas
  getTags(): Promise<Tag[]>
  getTag(id: string): Promise<Tag | null>
  createTag(data: TagCreate): Promise<Tag>
  updateTag(id: string, data: TagUpdate): Promise<Tag>
  deleteTag(id: string): Promise<void>

  // Operaciones de archivos
  addTagToFile(tagId: string, fileId: string): Promise<void>
  removeTagFromFile(tagId: string, fileId: string): Promise<void>
  getFilesByTag(tagId: string): Promise<File[]>

  // Operaciones por lote
  batchAddTags(fileIds: string[], tagIds: string[]): Promise<void>
  batchRemoveTags(fileIds: string[], tagIds: string[]): Promise<void>
}

interface TagCreate {
  name: string
  color?: string
  description?: string
  type?: 'user' | 'system' | 'auto'
  icon?: string
}

interface Tag {
  id: string
  name: string
  color?: string
  description?: string
  type: 'user' | 'system' | 'auto'
  icon?: string
  fileCount: number
  createdAt: Date
  updatedAt: Date
}
```

#### 6. Favorites Service
```typescript
interface FavoritesService {
  // Operaciones básicas
  getFavorites(): Promise<File[]>
  addToFavorites(fileId: string): Promise<void>
  removeFromFavorites(fileId: string): Promise<void>

  // Operaciones por lote
  batchAddToFavorites(fileIds: string[]): Promise<void>
  batchRemoveFromFavorites(fileIds: string[]): Promise<void>

  // Operaciones de consulta
  isFavorite(fileId: string): Promise<boolean>
  getFavoritesCount(): Promise<number>
  getFavoritesByType(type: string): Promise<File[]>
}

interface FavoriteStats {
  totalCount: number
  byType: Record<string, number>
  recentlyAdded: File[]
}
```

#### 7. Stats Service
```typescript
interface StatsService {
  // Estadísticas generales
  getSystemStats(): Promise<SystemStats>
  getFolderStats(folderId: string): Promise<FolderStats>
  getFileTypeStats(): Promise<FileTypeStats>

  // Estadísticas de uso
  getUsageStats(): Promise<UsageStats>
  getDiskUsage(): Promise<DiskUsage>
  getCacheStats(): Promise<CacheStats>

  // Estadísticas de rendimiento
  getPerformanceStats(): Promise<PerformanceStats>
  getThumbnailGenerationStats(): Promise<ThumbnailStats>
}

interface SystemStats {
  totalFiles: number
  totalFolders: number
  totalSize: number
  fileTypes: Record<string, number>
  recentActivity: ActivityLog[]
}

interface FolderStats {
  fileCount: number
  subFolderCount: number
  totalSize: number
  lastModified: Date
  fileTypes: Record<string, number>
  depth: number
}

interface UsageStats {
  mostViewedFiles: File[]
  mostUsedTags: Tag[]
  popularFolders: Folder[]
  accessHistory: AccessLog[]
}

interface PerformanceStats {
  averageLoadTime: number
  cacheHitRate: number
  thumbnailGenerationTime: number
  indexingStats: IndexingStats
}
```

### Estructura de Archivos

```bash
src/
├── services/
│   ├── core/
│   │   ├── fs.server.ts          # Sistema de archivos
│   │   ├── watcher.server.ts     # Monitoreo
│   │   └── cache.server.ts       # Caché
│   │
│   ├── features/
│   │   ├── collection.service.ts  # Colecciones
│   │   ├── folder.service.ts     # Carpetas
│   │   ├── image.service.ts      # Imágenes
│   │   └── thumbnail.service.ts  # Miniaturas
│   │
│   └── api/
│       ├── collections/
│       ├── folders/
│       └── images/
```

### Patrones de Implementación

1. **Servicios Core**
```typescript
// src/services/core/fs.server.ts
export class FileSystemService {
  private watcher: FSWatcher

  async watchDirectory(path: string): Promise<void> {
    this.watcher = chokidar.watch(path, {
      persistent: true,
      ignoreInitial: false
    })

    this.watcher
      .on('add', this.handleFileAdded)
      .on('change', this.handleFileChanged)
      .on('unlink', this.handleFileRemoved)
  }

  private async handleFileAdded(path: string): Promise<void> {
    // Implementación
  }
}
```

2. **Servicios de Feature**
```typescript
// src/services/features/collection.service.ts
export class CollectionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly imageService: ImageService
  ) {}

  async createCollection(data: CollectionCreate): Promise<Collection> {
    return this.prisma.collection.create({
      data: {
        ...data,
        createdAt: new Date()
      }
    })
  }
}
```

### Manejo de Errores

```typescript
// src/lib/errors.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

// Uso en servicios
throw new ServiceError(
  'Folder not found',
  'FOLDER_NOT_FOUND',
  404
)
```

### Validación

```typescript
// src/lib/validation/collection.schema.ts
import { z } from 'zod'

export const CollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  emoji: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
})

// Uso en API routes
const data = CollectionSchema.parse(req.body)
```

### Caché y Optimización

1. **Thumbnails**
```typescript
// src/services/features/thumbnail.service.ts
export class ThumbnailService {
  private readonly cacheDir = 'public/thumbnails'

  async getThumbnail(imageId: string): Promise<string> {
    const cachePath = this.getCachePath(imageId)

    if (await this.existsInCache(cachePath)) {
      return cachePath
    }

    return this.generateAndCacheThumbnail(imageId)
  }
}
```

2. **Batch Operations**
```typescript
// src/services/features/folder.service.ts
export class FolderService {
  async batchProcessFolder(folderId: string): Promise<void> {
    const files = await this.getFiles(folderId)
    const chunks = chunk(files, 10)

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(file => this.processFile(file))
      )
    }
  }
}
```

### Testing

```typescript
// src/services/__tests__/collection.service.test.ts
describe('CollectionService', () => {
  it('should create collection with valid data', async () => {
    const service = new CollectionService(prisma)
    const data = {
      name: 'Test Collection',
      description: 'Test Description'
    }

    const collection = await service.createCollection(data)
    expect(collection).toHaveProperty('id')
    expect(collection.name).toBe(data.name)
  })
})
```

### Scripts de Base de Datos

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  }
}
```

### Implementaciones de Ejemplo

1. **Profile Service**
```typescript
// src/services/features/profile.service.ts
export class ProfileService {
  constructor(private readonly prisma: PrismaClient) {}

  async getActiveProfile(): Promise<Profile | null> {
    return this.prisma.profile.findFirst({
      where: { isActive: true }
    })
  }

  async activateProfile(id: string): Promise<void> {
    await this.prisma.$transaction([
      // Desactivar perfil actual
      this.prisma.profile.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      }),
      // Activar nuevo perfil
      this.prisma.profile.update({
        where: { id },
        data: { isActive: true }
      })
    ])
  }
}
```

2. **Tag Service**
```typescript
// src/services/features/tag.service.ts
export class TagService {
  constructor(private readonly prisma: PrismaClient) {}

  async batchAddTags(fileIds: string[], tagIds: string[]): Promise<void> {
    const data = fileIds.flatMap(fileId =>
      tagIds.map(tagId => ({
        fileId,
        tagId
      }))
    )

    await this.prisma.fileTag.createMany({
      data,
      skipDuplicates: true
    })
  }

  async getFilesByTag(tagId: string): Promise<File[]> {
    const result = await this.prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        files: {
          include: {
            metadata: true,
            tags: true
          }
        }
      }
    })
    return result?.files ?? []
  }
}
```

3. **Stats Service**
```typescript
// src/services/features/stats.service.ts
export class StatsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService
  ) {}

  async getSystemStats(): Promise<SystemStats> {
    const cacheKey = 'system_stats'
    const cached = await this.cache.get<SystemStats>(cacheKey)

    if (cached) return cached

    const [files, folders] = await Promise.all([
      this.prisma.file.count(),
      this.prisma.folder.count()
    ])

    const stats: SystemStats = {
      totalFiles: files,
      totalFolders: folders,
      // ... más cálculos
    }

    await this.cache.set(cacheKey, stats, 60 * 5) // 5 minutos
    return stats
  }
}
```

4. **Favorites Service**
```typescript
// src/services/features/favorites.service.ts
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventEmitter: EventEmitter
  ) {}

  async addToFavorites(fileId: string): Promise<void> {
    await this.prisma.favorite.create({
      data: {
        fileId,
        addedAt: new Date()
      }
    })

    this.eventEmitter.emit('favorite:added', { fileId })
  }

  async getFavoritesByType(type: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: {
        type,
        favorites: {
          some: {}
        }
      },
      include: {
        metadata: true,
        tags: true
      }
    })
  }

  async getFavoriteStats(): Promise<FavoriteStats> {
    const [totalCount, byType, recentlyAdded] = await Promise.all([
      this.prisma.favorite.count(),
      this.prisma.favorite.groupBy({
        by: ['type'],
        _count: true
      }),
      this.prisma.favorite.findMany({
        take: 10,
        orderBy: { addedAt: 'desc' },
        include: { file: true }
      })
    ])

    return {
      totalCount,
      byType: Object.fromEntries(
        byType.map(({ type, _count }) => [type, _count])
      ),
      recentlyAdded: recentlyAdded.map(f => f.file)
    }
  }
}
```