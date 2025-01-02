# 🎨 Frontend Stack & Guidelines

## 📚 Stack Tecnológico

### Core
- **Next.js 15**
  - App Router
  - Server Components
  - Server Actions
  - Metadata API
  - Image Optimization

- **React 19**
  - Use Server
  - Use Client
  - Suspense
  - Server Components
  - Hooks Avanzados

- **TypeScript 5.3+**
  - Strict Mode
  - Path Aliases
  - Type Checking

### Styling
- **Tailwind CSS 3.4+**
  - JIT Compiler
  - Custom Plugins
  - CSS Variables

- **Shadcn**
  - Componentes base
  - Temas personalizables
  - Radix UI

  **Motion/react**
  - Animaciones

### State Management
- **Zustand 4+**
  - Middleware
  - Persist
  - Devtools

- **TanStack Query v5**
  - Server State
  - Caching
  - Mutations

## 🏗️ Estructura de Componentes

[ por revisar ]

## 💡 Patrones de Implementación

### 1. Vistas
```typescript
// src/components/views/all-images/index.tsx
export default function AllImagesView() {
  return (
    <MainLayout>
      <LeftPanel>
        <Navigation />
      </LeftPanel>

      <main className="flex-1">
        <ImageGrid />
      </main>

      <RightPanel>
        <ImageDetails />
      </RightPanel>
    </MainLayout>
  )
}
```

### 2. Features
```typescript
// src/components/features/image-viewer/index.tsx
interface ImageViewerProps {
  src: string
  alt: string
  onZoom?: (scale: number) => void
}

export function ImageViewer({ src, alt, onZoom }: ImageViewerProps) {
  const { scale, position, handlers } = useImageControls()

  return (
    <div className="image-viewer" {...handlers}>
      <ViewerControls onZoom={onZoom} />
      <Image
        src={src}
        alt={alt}
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`
        }}
      />
    </div>
  )
}
```

### 3. Layout
```typescript
// src/components/layout/main-layout/index.tsx
interface MainLayoutProps {
  children: React.ReactNode
  showLeftPanel?: boolean
  showRightPanel?: boolean
}

export function MainLayout({
  children,
  showLeftPanel = true,
  showRightPanel = true
}: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      {showLeftPanel && <LeftPanel />}
      <main className="flex-1">{children}</main>
      {showRightPanel && <RightPanel />}
    </div>
  )
}
```

## 🎯 Guías de Desarrollo

### 1. Componentes
- Usar Server Components por defecto
- Marcar explícitamente "use client"
- Props tipadas con TypeScript
- Documentar con JSDoc
- Mantener componentes pequeños
- Usar composition pattern

### 2. Estado
```typescript
// src/store/features/images.ts
interface ImagesState {
  images: Image[]
  selectedId: string | null
  view: 'grid' | 'list'
  sortBy: 'name' | 'date' | 'size'

  select: (id: string) => void
  setView: (view: 'grid' | 'list') => void
  setSortBy: (sort: 'name' | 'date' | 'size') => void
}

export const useImagesStore = create<ImagesState>((set) => ({
  images: [],
  selectedId: null,
  view: 'grid',
  sortBy: 'date',

  select: (id) => set({ selectedId: id }),
  setView: (view) => set({ view }),
  setSortBy: (sortBy) => set({ sortBy })
}))
```

### 3. Hooks
```typescript
// src/hooks/features/use-image-viewer.ts
export function useImageViewer(imageId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['image', imageId],
    queryFn: () => getImage(imageId)
  })

  const { mutate: updateMetadata } = useMutation({
    mutationFn: (metadata: ImageMetadata) =>
      updateImageMetadata(imageId, metadata)
  })

  return {
    image: data,
    isLoading,
    updateMetadata
  }
}
```

### 4. Estilos
```typescript
// Tailwind con clsx y cva
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'rounded-md px-4 py-2 font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)
```

## 🔧 Scripts y Configuración

### 1. TypeScript
```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2. Tailwind
```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
    },
  },
}
```

## 🧪 Testing

```typescript
// src/components/features/image-viewer/image-viewer.test.tsx
import { render, fireEvent } from '@testing-library/react'
import { ImageViewer } from './image-viewer'

describe('ImageViewer', () => {
  it('should handle zoom controls correctly', () => {
    const onZoom = jest.fn()
    const { getByRole } = render(
      <ImageViewer
        src="/test.jpg"
        alt="Test Image"
        onZoom={onZoom}
      />
    )

    const zoomInButton = getByRole('button', { name: /zoom in/i })
    fireEvent.click(zoomInButton)

    expect(onZoom).toHaveBeenCalledWith(1.5)
  })
})
```