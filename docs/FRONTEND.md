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

- **Motion/react**
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

### Organización Actual

```
components/
├── core/          # Componentes base y utilidades
├── features/      # Características específicas
├── layout/        # Componentes de estructura
├── ui/           # Componentes de interfaz reutilizables
└── views/        # Vistas principales
```

### Guidelines generales

- Si se encuentran componentes duplicados, consolidarlos en un solo componente
- Implementar lazy loading en componentes pesados
- Mejorar la documentación de componentes durante el desarrollo
- Establecer patrones claros para props y tipos
- Usar Server Components por defecto
- Marcar explícitamente "use client"
- Props tipadas con TypeScript
- Documentar con JSDoc
- Mantener componentes pequeños
- Usar composition pattern
- En Estado global (Zustand):
  - Separar por dominio
  - Usar slices para mejor organización
  - Implementar persist donde sea necesario
  - Evitar duplicación de estado
- Local
- useState para estado simple
- useReducer para estado complejo
- Context para estado compartido
- Hooks
  - Mantener hooks pequeños y enfocados
  - Documentar efectos secundarios
  - Implementar cleanup functions
  - Evitar dependencias circulares
- Estilos
  - Usar Tailwind para estilos base
  - Componentes Shadcn para UI consistente
  - CSS Modules para estilos específicos
  - Variables CSS para temas

## 🔄 Áreas de Mejora

- Implementar React.memo donde sea beneficioso
- Optimizar re-renders innecesarios
- Mejorar lazy loading de imágenes
- Reducir bundle size
- Mejorar navegación por teclado
- Asegurar contraste adecuado
- Testear con lectores de pantalla
- Implementar tests unitarios
- Añadir tests de integración
- Configurar CI/CD
- Mejorar documentación de componentes
- Documentar patrones comunes
- Mantener changelog actualizado

## 📈 Plan de Mejoras Frontend

### Fase 1: Limpieza

1. Consolidar componentes duplicados cuando se encuentran
2. Reorganizar estructura de archivos si es necesario
3. Actualizar tipos y documentación constantemente
4. Optimizar imports y organizarlos correctamente

### Fase 2: Optimización

1. Implementar lazy loading
2. Mejorar manejo de caché
3. Optimizar bundles
4. Reducir re-renders
