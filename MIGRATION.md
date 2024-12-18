# Plan de Migración y Reestructuración del Proyecto

## 1. Tecnologías y Convenciones

### 1.1 Stack Tecnológico
- Next.js 15
- React 19
- Tailwind CSS
- Shadcn/ui
- Zustand
- Prisma

### 1.2 Convenciones
- Nomenclatura: kebab-case para archivos y directorios
- Componentes: PascalCase para nombres de componentes
- Hooks: camelCase comenzando con 'use'
- Types/Interfaces: PascalCase
- Constantes: SCREAMING_SNAKE_CASE

## 2. Nueva Estructura del Proyecto

```
src/
├── app/                    # App router pages
│   ├── (auth)/            # Rutas autenticadas
│   └── api/               # API routes
├── components/
│   ├── ui/                # Componentes shadcn/ui (NO MODIFICAR)
│   ├── core/              # Componentes base personalizados
│   │   ├── data-display/  # Tablas, cards, listas personalizadas
│   │   ├── inputs/        # Inputs personalizados
│   │   └── layout/        # Layouts personalizados
│   └── features/          # Componentes específicos de características
├── lib/                   # Utilidades y configuraciones
├── hooks/                 # Hooks personalizados
├── store/                 # Estado global (Zustand)
├── types/                 # TypeScript types
├── styles/                # Estilos globales
└── server/                # Lógica del servidor
```

## 3. Plan de Migración por Fases

### Fase 1: Configuración Base
- [ ] Actualizar dependencias a las últimas versiones estables
- [ ] Configurar Prisma con PostgreSQL
- [ ] Configurar shadcn/ui con tema personalizado
- [ ] Configurar Tailwind con diseño sistema
- [ ] Actualizar tsconfig.json con paths
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/server/*": ["./src/server/*"]
    }
  }
}
```

### Fase 2: Migración de Componentes

#### 2.1 Componentes Core (Personalizados)
```
src/components/core/
├── data-display/
│   ├── image-card/
│   │   ├── image-card.tsx
│   │   └── index.ts
│   ├── file-grid/
│   └── file-list/
├── inputs/
│   ├── search-bar/
│   └── file-upload/
└── layout/
    ├── main-container/
    └── split-view/
```

#### 2.2 Componentes Features
```
src/components/features/
├── file-management/
│   ├── file-browser/
│   │   ├── components/
│   │   │   ├── file-item.tsx      # Usa componentes de ui/ y core/
│   │   │   ├── file-grid.tsx
│   │   │   └── file-list.tsx
│   │   ├── hooks/
│   │   │   └── use-file-browser.ts
│   │   └── index.tsx
│   └── file-upload/
├── image-viewer/
│   ├── components/
│   │   ├── viewer-controls.tsx
│   │   └── viewer-toolbar.tsx
│   └── hooks/
│       └── use-image-viewer.ts
├── navigation/
│   ├── left-sidebar/
│   │   ├── components/
│   │   │   ├── category-list.tsx
│   │   │   ├── collection-item.tsx
│   │   │   └── tag-cloud.tsx
│   │   └── index.tsx
│   └── breadcrumbs/
└── settings/
    ├── components/
    └── hooks/
```

### Guía de Uso de Componentes

1. **Componentes UI (shadcn)**:
   - NO modificar los componentes en `components/ui/`
   - Usar como base para construir componentes más complejos
   - Ejemplo: Button, Dialog, DropdownMenu, etc.

2. **Componentes Core**:
   - Componentes personalizados reutilizables
   - Pueden usar componentes de shadcn/ui como base
   - Mantener independientes de la lógica de negocio
   ```typescript
   // src/components/core/data-display/image-card/image-card.tsx
   import { Card } from "@/components/ui/card"
   import { OptimizedImage } from "@/components/core/data-display/optimized-image"

   export interface ImageCardProps {
     src: string
     alt: string
     title: string
     onSelect?: () => void
   }

   export function ImageCard({ src, alt, title, onSelect }: ImageCardProps) {
     return (
       <Card
         onClick={onSelect}
         className="group hover:bg-accent transition-colors"
       >
         <OptimizedImage
           src={src}
           alt={alt}
           className="aspect-square rounded-t-lg"
         />
         <div className="p-3">
           <h3 className="text-sm font-medium">{title}</h3>
         </div>
       </Card>
     )
   }
   ```

3. **Componentes Features**:
   - Usar componentes de `ui/` y `core/`
   - Contener lógica específica de la característica
   - Mantener la composición sobre la herencia
   ```typescript
   // src/components/features/file-management/file-browser/components/file-item.tsx
   import { ImageCard } from "@/components/core/data-display/image-card"
   import { useFileSelection } from "../hooks/use-file-selection"

   export function FileItem({ file }) {
     const { handleSelect } = useFileSelection()

     return (
       <ImageCard
         src={file.thumbnailUrl}
         alt={file.name}
         title={file.name}
         onSelect={() => handleSelect(file.id)}
       />
     )
   }
   ```

### Mejores Prácticas

1. **Composición de Componentes**:
   - Construir componentes complejos usando componentes más simples
   - Mantener la separación de responsabilidades
   - Usar props para personalización

2. **Reutilización**:
   - Componentes en `core/` deben ser altamente reutilizables
   - Evitar dependencias directas con el estado global
   - Usar render props o componentes hijos cuando sea necesario

3. **Tipado**:
   - Exportar interfaces de props
   - Usar tipos estrictos
   - Documentar props complejas

### Fase 3: Estado Global con Zustand

```typescript
// src/store/slices/files.ts
interface FileState {
  files: File[];
  selectedFiles: string[];
  actions: {
    addFiles: (files: File[]) => void;
    selectFiles: (ids: string[]) => void;
  }
}

// src/store/index.ts
import { create } from 'zustand'
import { fileSlice } from './slices/files'
import { uiSlice } from './slices/ui'

export const useStore = create<FileState & UIState>()((...a) => ({
  ...fileSlice(...a),
  ...uiSlice(...a),
}))
```

### Fase 4: Optimizaciones de Rendimiento

#### 4.1 Implementación de React Suspense
```typescript
// src/app/layout.tsx
import { Suspense } from 'react'
import { Loading } from '@/components/ui/loading'

export default function Layout({ children }) {
  return (
    <Suspense fallback={<Loading />}>
      {children}
    </Suspense>
  )
}
```

#### 4.2 Optimización de Imágenes
```typescript
// src/components/features/image-viewer/components/image.tsx
import NextImage from 'next/image'
import { cn } from '@/lib/utils'

export function OptimizedImage({ src, alt, className }) {
  return (
    <NextImage
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      quality={85}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}
```

## 4. Mejoras Específicas

### 4.1 Server Actions y API Routes
```typescript
// src/app/api/files/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET() {
  const files = await db.file.findMany()
  return NextResponse.json(files)
}
```

### 4.2 Hooks Personalizados
```typescript
// src/hooks/use-debounced-callback.ts
import { useCallback, useRef } from 'react'

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T
}
```

## 5. Control de Calidad

### 5.1 ESLint y Prettier
```javascript
// eslint.config.mjs
export default {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc' }
    }]
  }
}
```

### 5.2 Testing con Vitest
```typescript
// src/components/features/file-browser/__tests__/file-browser.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileBrowser } from '../file-browser'

describe('FileBrowser', () => {
  it('renders file list correctly', () => {
    render(<FileBrowser />)
    expect(screen.getByRole('list')).toBeInTheDocument()
  })
})
```

## 6. Orden de Implementación

1. Configuración del proyecto y dependencias
2. Migración de componentes UI base
3. Implementación de store con Zustand
4. Migración de features principales
5. Optimizaciones de rendimiento
6. Testing y documentación

## 7. Consideraciones de Rendimiento

- Implementar virtualización para listas largas (react-virtual)
- Usar React.memo para componentes puros
- Implementar lazy loading para rutas y componentes pesados
- Optimizar assets y carga de imágenes
- Utilizar Server Components donde sea posible
- Implementar caching efectivo con Next.js