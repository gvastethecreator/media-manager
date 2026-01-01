# Arquitectura del Sistema

## Image Manager - Documentación Técnica

**Versión:** 0.1.0  
**Última Actualización:** 31 de diciembre de 2025

---

## 1. Visión General

Image Manager implementa una arquitectura **cliente-servidor monolítica** con capacidad de despliegue como aplicación web o de escritorio (Tauri). El sistema está diseñado para alto rendimiento en la gestión de grandes volúmenes de archivos multimedia.

### 1.1 Principios Arquitectónicos

1. **Separación de Responsabilidades:** Frontend, Backend y Persistencia claramente delimitados
2. **Modularidad:** Servicios independientes por dominio de entidad
3. **Type-Safety:** TypeScript estricto en todo el codebase
4. **Performance-First:** Virtualización, lazy loading, caching agresivo
5. **Programación Funcional:** Migración progresiva a Effect-TS para manejo de errores y composición

---

## 2. Diagrama de Arquitectura

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                        │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │                         React 19 + Vite 7                               │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│ │
│ │ │  Components │ │   Stores    │ │   Hooks     │ │  TanStack Query     ││ │
│ │ │   (UI/UX)   │ │  (Zustand)  │ │ (React)     │ │  (Data Fetching)    ││ │
│ │ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘│ │
│ │        │               │               │                   │           │ │
│ │        └───────────────┴───────────────┴───────────────────┘           │ │
│ └────────────────────────────────────┬───────────────────────────────────┘ │
│                                      │ HTTP REST + SSE                     │
│                                      ▼                                     │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │                     Express 5 + Bun Runtime                             │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│ │
│ │ │   Routes    │ │  Middleware │ │  Services   │ │   Transformers      ││ │
│ │ │  (API)      │ │ (Logging)   │ │ (Business)  │ │   (DTO/View)        ││ │
│ │ └──────┬──────┘ └─────────────┘ └──────┬──────┘ └─────────────────────┘│ │
│ │        │                               │                                │ │
│ │        └───────────────────────────────┘                                │ │
│ └────────────────────────────────────┬───────────────────────────────────┘ │
│                                      │                                     │
│                                      ▼                                     │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │                     Drizzle ORM + SQLite                                │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│ │
│ │ │   Schema    │ │  Relations  │ │   Helpers   │ │    Migrations       ││ │
│ │ │  (Tables)   │ │  (M:N)      │ │  (Queries)  │ │    (Versioning)     ││ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                     │
│                                      ▼                                     │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │                   Sistema de Archivos Local                             │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│ │
│ │ │   Images    │ │   Videos    │ │    Audio    │ │     Documents       ││ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                           TAURI (Desktop)                                   │
│ ┌──────────────────────────────────────────────────────────────────────┐   │
│ │                          Rust Backend                                  │   │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       │   │
│ │ │   Window    │ │    IPC      │ │  Native     │                       │   │
│ │ │  Management │ │  Commands   │ │  Features   │                       │   │
│ │ └─────────────┘ └─────────────┘ └─────────────┘                       │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura del Proyecto

```
image-manager/
├── src/                          # Código fuente principal
│   ├── app/                      # Configuración de aplicación
│   ├── components/               # Componentes React
│   │   ├── common/              # Componentes reutilizables
│   │   ├── core/                # Componentes fundamentales
│   │   ├── entities/            # Componentes por entidad
│   │   ├── features/            # Features complejas
│   │   │   ├── file-browser/    # Navegador de archivos
│   │   │   └── file-viewer/     # Visor de archivos
│   │   ├── layout/              # Layouts principales
│   │   ├── navigation/          # Navegación
│   │   ├── panels/              # Paneles laterales
│   │   ├── toolbar/             # Barras de herramientas
│   │   ├── ui/                  # Componentes UI primitivos
│   │   └── views/               # Vistas por sección
│   ├── config/                   # Configuración de la app
│   ├── constants/                # Constantes globales
│   ├── hooks/                    # React Hooks personalizados
│   ├── lib/                      # Librerías y utilidades
│   │   ├── api/                 # Cliente API (TanStack Query)
│   │   ├── client/              # Utilidades del cliente
│   │   ├── drizzle/             # ORM y esquema de BD
│   │   │   ├── schema/          # Definición de tablas
│   │   │   │   ├── core/        # Tablas fundamentales
│   │   │   │   ├── files/       # Tablas de archivos
│   │   │   │   ├── organization/# Organización
│   │   │   │   ├── relations/   # Tablas de relaciones
│   │   │   │   ├── taxonomy/    # Clasificación
│   │   │   │   └── worldbuilding/# Worldbuilding
│   │   │   ├── migrations/      # Migraciones de BD
│   │   │   └── seeds/           # Datos iniciales
│   │   ├── effect/              # Effect-TS utilities
│   │   ├── events/              # Sistema de eventos
│   │   ├── filesystem/          # Operaciones de archivos
│   │   ├── image/               # Procesamiento de imágenes
│   │   ├── logger/              # Sistema de logging
│   │   └── utils/               # Utilidades generales
│   ├── providers/                # React Context Providers
│   ├── server/                   # Backend Express
│   │   ├── middleware/          # Middleware HTTP
│   │   ├── routes/              # Rutas API
│   │   └── services/            # Servicios del servidor
│   ├── services/                 # Servicios de dominio
│   │   ├── image/               # Servicio de imágenes
│   │   ├── video/               # Servicio de videos
│   │   ├── audio/               # Servicio de audio
│   │   ├── folder/              # Servicio de carpetas
│   │   ├── tag/                 # Servicio de tags
│   │   ├── album/               # Servicio de álbumes
│   │   └── ...                  # Más servicios por entidad
│   ├── store/                    # Estado global (Zustand)
│   │   ├── entities/            # Stores por entidad
│   │   └── ui/                  # Stores de UI
│   ├── styles/                   # Estilos globales
│   ├── transformers/             # Transformadores DTO
│   ├── types/                    # Tipos TypeScript
│   ├── utils/                    # Utilidades
│   ├── main.tsx                 # Punto de entrada React
│   └── router.tsx               # Configuración de rutas
├── src-tauri/                    # Código Tauri (Rust)
│   ├── src/                     # Código Rust
│   └── tauri.conf.json          # Configuración Tauri
├── public/                       # Assets públicos
├── scripts/                      # Scripts de desarrollo
├── tests/                        # Tests
│   ├── e2e/                     # Tests E2E (Playwright)
│   ├── integration/             # Tests de integración
│   └── unit/                    # Tests unitarios
├── docs/                         # Documentación
└── logs/                         # Logs de desarrollo
```

---

## 4. Capas de la Arquitectura

### 4.1 Capa de Presentación (Frontend)

#### Componentes UI

La biblioteca de componentes está basada en **Radix UI** con estilos de **Tailwind CSS**. Los componentes siguen el patrón de composición y están organizados en:

- **Primitivos (`/ui`):** Botones, inputs, modales, etc.
- **Compuestos (`/common`):** Componentes reutilizables compuestos
- **Features (`/features`):** Componentes de funcionalidad completa
- **Views (`/views`):** Páginas/vistas completas

#### Estado Global

El estado se gestiona con **Zustand** siguiendo el patrón de stores granulares:

```typescript
// Ejemplo: Store de selección
export const useSelectionStore = create<SelectionState>()(
  devtools(
    immer((set, get) => ({
      selectedIds: [],
      selectedItems: [],
      toggleSelection: (id, item) => { ... },
      clearSelection: () => { ... },
    }))
  )
);
```

**Stores principales:**

- `selection.store.ts` - Selección de elementos
- `ui.store.ts` - Estado de UI global
- `settings.store.ts` - Configuración persistente
- `entities/` - Stores por tipo de entidad

#### Data Fetching

**TanStack Query** maneja toda la comunicación con el servidor:

```typescript
// Ejemplo: Hook de imágenes
export function useImages(folderId: string) {
  return useQuery({
    queryKey: ['images', 'byFolder', folderId],
    queryFn: () => imagesApi.getByFolder(folderId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

### 4.2 Capa de Negocio (Services)

Los servicios encapsulan la lógica de negocio por dominio:

```typescript
// Estructura de un servicio
src/services/image/
├── image.service.ts          # Servicio principal
├── image.service.effect.ts   # Versión Effect-TS
├── image-events.ts           # Sistema de eventos
├── image-lookup.service.ts   # Operaciones de búsqueda
├── image-processing.ts       # Procesamiento de imágenes
├── image-thumbnail.service.ts # Generación de thumbnails
└── index.ts                  # Exportaciones
```

**Patrón de servicio:**

```typescript
export const imageService = {
  // CRUD
  create: async (input: CreateImageInput) => { ... },
  getById: async (id: string) => { ... },
  update: async (id: string, input: UpdateImageInput) => { ... },
  delete: async (id: string) => { ... },
  
  // Operaciones específicas
  getByFolder: async (folderId: string) => { ... },
  generateThumbnail: async (id: string) => { ... },
  
  // Con Effect-TS
  getByIdEffect: (id: string) => Effect.gen(function* () { ... }),
};
```

### 4.3 Capa de Datos (Drizzle ORM)

#### Esquema de Base de Datos

El esquema está organizado por dominios:

```typescript
// Ejemplo: Tabla de imágenes
export const images = sqliteTable('Image', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  hash: text('hash').notNull(),
  size: integer('size').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  thumbnail: text('thumbnail'),
  folderId: text('folderId').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }),
}, (table) => ({
  folderIdIdx: index('Image_folderId_idx').on(table.folderId),
  hashIdx: index('Image_hash_idx').on(table.hash),
}));
```

#### Relaciones Many-to-Many

Las relaciones se manejan con tablas intermedias:

```typescript
// Ejemplo: Imagen a Tags
export const imageTags = sqliteTable('_ImageToTag', {
  A: text('A').notNull(), // imageId
  B: text('B').notNull(), // tagId
}, (table) => ({
  AB_unique: uniqueIndex('_ImageToTag_AB_unique').on(table.A, table.B),
}));
```

### 4.4 Capa de API (Express Routes)

Las rutas siguen un patrón RESTful:

```typescript
// Ejemplo: Rutas de imágenes
router.get('/', getImages);
router.get('/:id', getImageById);
router.post('/', createImage);
router.put('/:id', updateImage);
router.delete('/:id', deleteImage);

// Rutas especializadas
router.get('/folder/:folderId', getImagesByFolder);
router.post('/:id/thumbnail', generateThumbnail);
router.post('/:id/tags', addTagsToImage);
```

---

## 5. Patrones de Diseño

### 5.1 Patrón de Servicio Singleton

Los servicios se exportan como objetos singleton con métodos:

```typescript
export const tagService = {
  create: async (input) => { ... },
  getAll: async () => { ... },
};
```

### 5.2 Patrón de Transformer

Los transformadores convierten datos de BD a vistas:

```typescript
// src/transformers/image/
export function imageToView(image: DrizzleImage): ImageView {
  return {
    ...image,
    formattedSize: formatFileSize(image.size),
    thumbnailUrl: `/api/images/${image.id}/thumbnail`,
  };
}

export function imageToStats(image: DrizzleImage, counts: Counts): ImageWithStats {
  return {
    ...imageToView(image),
    tagCount: counts.tags,
    albumCount: counts.albums,
  };
}
```

### 5.3 Patrón de Feature Flags

Los features experimentales se controlan con flags:

```typescript
// src/config/features.ts
export const FEATURES = {
  USE_EFFECT_TAGS: process.env.USE_EFFECT_TAGS !== 'false',
  USE_EFFECT_IMAGES: process.env.USE_EFFECT_IMAGES !== 'false',
  USE_EFFECT_VIDEOS: process.env.USE_EFFECT_VIDEOS !== 'false',
  USE_EFFECT_AUDIOS: process.env.USE_EFFECT_AUDIOS !== 'false',
};
```

### 5.4 Patrón de Eventos

El sistema de eventos desacopla componentes:

```typescript
// Emisión
emitImageEvent(IMAGE_EVENTS.CREATED, { id, name });

// Suscripción
onImageEvent(IMAGE_EVENTS.CREATED, (data) => {
  refreshQueries(['images']);
});
```

---

## 6. Flujos de Datos

### 6.1 Flujo de Carga de Imágenes

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuario    │────▶│   FolderView │────▶│ useImages()  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ImageGrid  │◀────│ TanStack     │◀────│ /api/images  │
│  (Virtual)   │     │ Query Cache  │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │imageService  │
                                          └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ Drizzle ORM  │
                                          └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   SQLite     │
                                          └──────────────┘
```

### 6.2 Flujo de Reindexación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuario    │────▶│ Reindex Btn  │────▶│ SSE Stream   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Progress   │◀────│ SSE Events   │◀────│/api/folders/ │
│   Toast      │     │              │     │  reindex     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │folderService │
                                          └──────┬───────┘
                                                  │
          ┌───────────────────────────────────────┼───────────────────────────────────────┐
          │                                       │                                       │
          ▼                                       ▼                                       ▼
┌──────────────┐                         ┌──────────────┐                        ┌──────────────┐
│  Scan Files  │                         │ Extract Meta │                        │Gen Thumbnails│
└──────────────┘                         └──────────────┘                        └──────────────┘
```

---

## 7. Gestión de Estado

### 7.1 Estado del Servidor (TanStack Query)

- Caché automático de respuestas
- Invalidación inteligente
- Background refetching
- Optimistic updates

### 7.2 Estado del Cliente (Zustand)

- UI state (paneles, modales)
- Selección
- Preferencias de usuario
- Estado temporal

### 7.3 Estado Persistente (SQLite)

- Entidades del dominio
- Relaciones
- Configuración del usuario
- Historial de actividad

---

## 8. Seguridad

### 8.1 Validación de Entrada

- Zod para validación de schemas
- Sanitización de paths de archivos
- Límites de tamaño de payload (50MB)

### 8.2 Acceso a Archivos

- Rutas restringidas a carpetas indexadas
- No acceso directo al sistema de archivos desde el cliente
- Validación de extensiones permitidas

### 8.3 Tauri (Desktop)

- CSP configurado
- Capabilities específicas por feature
- IPC seguro para comandos nativos

---

## 9. Performance

### 9.1 Virtualización

- TanStack Virtual para listas grandes
- Renderizado solo de elementos visibles
- Recycling de nodos DOM

### 9.2 Lazy Loading

- Componentes con React.lazy()
- Imágenes con loading="lazy"
- Chunks optimizados en Vite

### 9.3 Caching

- TanStack Query cache
- LRU cache para thumbnails
- Service worker (futuro)

### 9.4 Optimizaciones de Build

- Tree shaking
- Code splitting por ruta
- Minificación con esbuild

---

## 10. Extensibilidad

### 10.1 Añadir Nueva Entidad

1. Crear tabla en `src/lib/drizzle/schema/`
2. Añadir a exportaciones en `schema/index.ts`
3. Crear servicio en `src/services/<entidad>/`
4. Crear transformer en `src/transformers/<entidad>/`
5. Crear rutas en `src/server/routes/`
6. Crear store en `src/store/entities/<entidad>/`
7. Crear hooks de query en `src/lib/api/`
8. Crear componentes de vista

### 10.2 Feature Flags

Usar `src/config/features.ts` para activar/desactivar features experimentales.

### 10.3 Effect-TS Migration

El sistema soporta migración gradual a Effect-TS:

- Crear versión `.effect.ts` del servicio
- Añadir flag en `features.ts`
- Router carga condicionalmente según flag

---

## 11. Monitoreo y Logging

### 11.1 Sistema de Logging

```typescript
// Servidor
serverLogger.info('Mensaje informativo');
serverLogger.error('Error:', error);

// Cliente
clientLogger.debug('Debug info');
clientLogger.warn('Advertencia');
```

### 11.2 Métricas

- Logs estructurados en JSON
- Archivo de métricas en `logs/metrics-media.jsonl`
- Timestamps ISO para trazabilidad

---

## 12. Referencias

- [PRD - Documento de Requerimientos](./PRD.md)
- [Referencia de API](./API-REFERENCE.md)
- [Esquema de Base de Datos](./DATABASE-SCHEMA.md)
- [Guía de Servicios](./SERVICES-GUIDE.md)
- [Guía de Frontend](./FRONTEND-GUIDE.md)
