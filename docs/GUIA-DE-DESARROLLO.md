# Guía de Desarrollo - Image Manager

**Versión:** 1.0  
**Última Actualización:** 30 de enero de 2026

---

## 📋 Tabla de Contenidos

1. [Configuración del Entorno](#-configuración-del-entorno)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Convenciones de Código](#-convenciones-de-código)
4. [Patrones de Desarrollo](#-patrones-de-desarrollo)
5. [Testing](#-testing)
6. [Debugging](#-debugging)
7. [Flujo de Trabajo Git](#-flujo-de-trabajo-git)

---

## 🔧 Configuración del Entorno

### Prerrequisitos

```bash
# Verificar Bun
bun --version  # Debe ser >= 1.2.0

# Verificar Git
git --version

# Opcional: FFmpeg (para thumbnails de video/audio)
ffmpeg -version
```

### Instalación Inicial

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd image-manager

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# 4. Inicializar base de datos
bun run db:push

# 5. Ejecutar seeds (opcional)
bun run db:seed

# 6. Verificar instalación
bun run lint
bun run tsc
```

### Configuración de VS Code

Extensiones recomendadas:

```json
{
  "recommendations": [
    "oxc.oxc-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-playwright.playwright"
  ]
}
```

Configuración de settings.json:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## 📁 Estructura del Proyecto

### Convención de Carpetas

```
src/
├── app/                    # Configuración de aplicación
│   ├── globals.css        # Estilos globales
│   └── themes.css         # Variables de tema
│
├── components/            # Componentes React
│   ├── ui/               # Primitivas UI (shadcn/radix)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── views/            # Vistas por entidad
│   │   ├── image/
│   │   ├── video/
│   │   └── ...
│   ├── features/         # Features complejas
│   │   ├── file-browser/
│   │   └── file-viewer/
│   └── cards/            # Tarjetas de entidades
│
├── services/             # Capa de negocio
│   ├── image/
│   ├── video/
│   └── ...
│
├── transformers/         # Transformers DTO/View
│   ├── image/
│   ├── video/
│   └── ...
│
├── store/                # Estado global (Zustand)
│   ├── entities/
│   └── ui.store.ts
│
├── server/               # Backend Express
│   ├── routes/
│   ├── middleware/
│   └── index.ts
│
├── lib/                  # Utilidades y configuración
│   ├── drizzle/          # ORM
│   ├── utils/            # Utilidades por dominio
│   └── logger/           # Logging
│
├── types/                # TypeScript definitions
│   └── entities/
│
└── hooks/                # Custom React hooks
```

### Reglas de Organización

1. **Un componente por archivo** (excepto primitivas UI relacionadas)
2. **Co-localización**: Tests, stories y estilos junto al componente
3. **Index files**: Cada carpeta debe tener un `index.ts` para exportaciones
4. **No carpetas vacías**: Eliminar carpetas sin archivos

---

## 📝 Convenciones de Código

### TypeScript

```typescript
// ✅ Bueno: Tipado explícito
interface UserProps {
  id: string;
  name: string;
  email: string;
}

function UserCard({ id, name, email }: UserProps): JSX.Element {
  return <div>{name}</div>;
}

// ❌ Malo: any implícito
function UserCard(props: any) {
  return <div>{props.name}</div>;
}
```

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes | PascalCase | `UserCard`, `FileBrowser` |
| Hooks | camelCase con `use` | `useFileSync`, `useDebounce` |
| Servicios | camelCase | `imageService`, `folderService` |
| Tipos/Interfaces | PascalCase | `UserProps`, `ImageStats` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_URL` |
| Archivos | kebab-case | `use-file-sync.ts`, `image-service.ts` |

### Importaciones

```typescript
// ✅ Bueno: Imports absolutos con alias
import { Button } from '@/components/ui/button';
import { useFileSync } from '@/hooks/use-file-sync';
import type { Image } from '@/types/entities/image';

// ❌ Malo: Imports relativos profundos
import { Button } from '../../../components/ui/button';
```

Orden de imports:

```typescript
// 1. React/Next
import { useState, useEffect } from 'react';

// 2. Librerías externas
import { Effect } from 'effect';
import { toast } from 'sonner';

// 3. Alias absolutos (@/)
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

// 4. Tipos
import type { Image } from '@/types/entities/image';

// 5. Imports relativos (solo en misma carpeta)
import { helper } from './utils';
```

### Logging

```typescript
// ✅ Bueno: Usar sistema de logging
import { serverLogger } from '@/lib/logger/server-logger';
import { clientLogger } from '@/lib/logger/client-logger';

// En servicios/backend
const logger = serverLogger.withContext('ImageService');
logger.info('Procesando imagen', { imageId: '123' });
logger.error('Error al procesar', { error });

// En componentes/frontend
const logger = clientLogger.withContext('UserCard');
logger.debug('Renderizando', { userId: '123' });

// ❌ Malo: Console directo
console.log('Procesando imagen', imageId);
console.error('Error', error);
```

---

## 🏗️ Patrones de Desarrollo

### Service Pattern

```typescript
// src/services/image/image.service.effect.ts
import { Effect } from 'effect';

// Definir errores específicos
class ImageNotFound {
  readonly _tag = 'ImageNotFound';
  constructor(readonly imageId: string) {}
}

class ImageDatabaseError {
  readonly _tag = 'ImageDatabaseError';
  constructor(readonly operation: string, readonly error: unknown) {}
}

export type ImageError = ImageNotFound | ImageDatabaseError;

// Servicio con Effect-TS
export const getById = (id: string): Effect.Effect<Image, ImageError> =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () => db.query.images.findFirst({ where: eq(images.id, id) }),
      catch: (error) => new ImageDatabaseError('getById', error),
    });

    if (!result) {
      return yield* Effect.fail(new ImageNotFound(id));
    }

    return result;
  });
```

### Transformer Pattern

```typescript
// src/transformers/image/transformer.effect.ts
import { Effect } from 'effect';
import type { Image as DrizzleImage } from '@/lib/drizzle/schema';
import type { ImageWithStats } from '@/types/entities/image';

export const transformImageToWithStats = (
  image: DrizzleImage & { _count?: Record<string, number> }
): Effect.Effect<ImageWithStats, ImageTransformError> =>
  Effect.gen(function* () {
    // Validación
    if (!image.id) {
      return yield* Effect.fail(new ImageTransformError('ID requerido'));
    }

    // Transformación
    return {
      ...image,
      stats: {
        albumCount: image._count?.albums ?? 0,
        tagCount: image._count?.tags ?? 0,
        // ...
      },
    };
  });
```

### Store Pattern (Zustand)

```typescript
// src/store/entities/image/image.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ImageState {
  images: ImageWithStats[];
  selectedId: string | null;
  isLoading: boolean;
  
  // Actions
  setImages: (images: ImageWithStats[]) => void;
  selectImage: (id: string | null) => void;
  fetchImages: (folderId: string) => Promise<void>;
}

export const useImageStore = create<ImageState>()(
  devtools(
    immer((set, get) => ({
      images: [],
      selectedId: null,
      isLoading: false,

      setImages: (images) => set({ images }),
      
      selectImage: (id) => set({ selectedId: id }),
      
      fetchImages: async (folderId) => {
        set({ isLoading: true });
        try {
          const images = await imageApi.getByFolder(folderId);
          set({ images, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    })),
    { name: 'ImageStore' }
  )
);
```

### Component Pattern

```typescript
// src/components/views/image/image-view.tsx
import { memo } from 'react';
import { useImageStore } from '@/store/entities/image';
import { ImageCard } from '@/components/cards/image-card';

interface ImageViewProps {
  folderId: string;
}

export const ImageView = memo(function ImageView({ folderId }: ImageViewProps) {
  const { images, isLoading, fetchImages } = useImageStore();

  useEffect(() => {
    fetchImages(folderId);
  }, [folderId, fetchImages]);

  if (isLoading) {
    return <ImageViewSkeleton />;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  );
});

// Skeleton separado
function ImageViewSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### Tests Unitarios (Vitest)

```typescript
// src/services/image/__tests__/image.service.effect.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { getById } from '../image.service.effect';

describe('ImageService', () => {
  beforeEach(async () => {
    // Limpiar datos de test
    await cleanupTestData();
  });

  describe('getById', () => {
    it('should return image when found', async () => {
      // Arrange
      const testImage = await createTestImage();

      // Act
      const result = await Effect.runPromise(getById(testImage.id));

      // Assert
      expect(result.id).toBe(testImage.id);
      expect(result.name).toBe(testImage.name);
    });

    it('should fail with ImageNotFound when image does not exist', async () => {
      // Act & Assert
      const result = await Effect.runPromise(
        getById('non-existent-id').pipe(
          Effect.match({
            onFailure: (error) => error,
            onSuccess: () => null,
          })
        )
      );

      expect(result).toBeInstanceOf(ImageNotFound);
    });
  });
});
```

### Tests de Componentes

```typescript
// src/components/views/image/__tests__/image-view.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ImageView } from '../image-view';

describe('ImageView', () => {
  it('should render images after loading', async () => {
    // Arrange
    const folderId = 'test-folder';

    // Act
    render(<ImageView folderId={folderId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('image-grid')).toBeInTheDocument();
    });
  });

  it('should show skeleton while loading', () => {
    // Act
    render(<ImageView folderId="test" />);

    // Assert
    expect(screen.getAllByTestId('image-skeleton')).toHaveLength(8);
  });
});
```

### Tests E2E (Playwright)

```typescript
// tests/e2e/image-browser.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Image Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/images');
  });

  test('should display images in grid view', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="image-grid"]');

    // Assert
    const images = await page.locator('[data-testid="image-card"]').count();
    expect(images).toBeGreaterThan(0);
  });

  test('should filter images by tag', async ({ page }) => {
    // Act
    await page.click('[data-testid="tag-filter"]');
    await page.click('text=Landscape');

    // Assert
    await expect(page.locator('[data-testid="image-card"]')).toHaveCount(5);
  });
});
```

---

## 🐛 Debugging

### Server-side Debugging

```typescript
// Usar logger con contexto
const logger = serverLogger.withContext('Debug');

// Debug de Effect
const result = await Effect.runPromise(
  someEffect.pipe(
    Effect.tap((value) => logger.debug('Valor intermedio', { value })),
    Effect.catchAll((error) => {
      logger.error('Error en effect', { error });
      return Effect.fail(error);
    })
  )
);
```

### Client-side Debugging

```typescript
// React DevTools
// Instalar React DevTools browser extension

// React Scan (ya incluido)
// Muestra re-renders automáticamente

// Logger
const logger = clientLogger.withContext('ComponentName');

useEffect(() => {
  logger.debug('Component mounted', { props });
  return () => logger.debug('Component unmounted');
}, []);
```

### Database Debugging

```bash
# Drizzle Studio
bun run db:studio

# Ver queries en consola (development)
# Agregar en .env.local:
DEBUG_DB_QUERIES=true
```

---

## 🌿 Flujo de Trabajo Git

### Branches

```bash
# Feature branches
git checkout -b feature/nueva-funcionalidad

# Bug fixes
git checkout -b fix/correccion-bug

# Refactoring
git checkout -b refactor/mejora-codigo
```

### Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description

feat(image): agregar soporte para WebP animado
fix(folder): corregir error en reindexación
refactor(tags): migrar a Effect-TS
docs(api): actualizar documentación de endpoints
test(audio): agregar tests de waveform
```

### Pull Requests

Checklist antes de crear PR:

- [ ] Tests pasan (`bun run test`)
- [ ] Linting pasa (`bun run lint`)
- [ ] Type checking pasa (`bun run tsc`)
- [ ] No hay `console.log` (solo logger)
- [ ] No hay `any` innecesarios
- [ ] Documentación actualizada

### Pre-commit Hooks

```bash
# Instalar hooks (automático con bun install)
bun run prepare

# Hooks ejecutan:
# 1. vp check / bun run check
# 2. tsc --noEmit
# 3. test:changed
```

---

## 📚 Recursos Adicionales

- [Documentación de React](https://react.dev)
- [Documentación de Effect-TS](https://effect.website/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Oxc Docs](https://oxc.rs/docs/guide/usage/linter.html)

---

## ❓ FAQ

### ¿Cómo agrego una nueva entidad?

1. Crear schema en `src/lib/drizzle/schema/`
2. Crear tipos en `src/types/entities/<entity>/`
3. Crear servicio en `src/services/<entity>/`
4. Crear transformer en `src/transformers/<entity>/`
5. Crear rutas en `src/server/routes/<entity>.effect.ts`
6. Crear store en `src/store/entities/<entity>/`
7. Crear componentes en `src/components/views/<entity>/`

### ¿Cómo manejo errores?

Usar Effect-TS para código nuevo:

```typescript
Effect.tryPromise({
  try: () => api.call(),
  catch: (error) => new ApiError(error),
}).pipe(
  Effect.catchTag('ApiError', (error) => {
    toast.error('Error en API');
    return Effect.succeed(null);
  })
);
```

### ¿Cómo debuggeo Effect?

```typescript
Effect.gen(function* () {
  const value = yield* someEffect;
  console.log(value); // Breakpoint aquí
  return value;
}).pipe(
  Effect.tap((value) => console.log('Final:', value))
);
```

---

**Happy Coding! 🚀**
