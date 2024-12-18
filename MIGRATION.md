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
- [x] Actualizar dependencias a las últimas versiones estables
- [ ] Configurar Prisma con PostgreSQL
- [ ] Configurar shadcn/ui con tema personalizado
- [ ] Configurar Tailwind con diseño sistema
- [x] Actualizar tsconfig.json con paths

### Fase 2: Migración de Componentes
- [x] Crear estructura base de directorios
- [x] Mover componentes a sus nuevas ubicaciones
- [x] Crear archivos index.ts básicos
- [ ] Actualizar todas las importaciones
- [ ] Verificar y corregir tipos
- [ ] Crear pruebas unitarias

### Fase 3: Mejoras y Optimizaciones
- [ ] Implementar lazy loading para componentes pesados
- [ ] Optimizar manejo de imágenes
- [ ] Mejorar sistema de caché
- [ ] Implementar error boundaries
- [ ] Agregar logging y monitoreo

### Fase 4: Documentación y Mantenimiento
- [ ] Documentar componentes principales
- [ ] Crear guías de contribución
- [ ] Establecer estándares de código
- [ ] Configurar CI/CD

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