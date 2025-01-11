# Guía de Desarrollo

## Estructura del Proyecto

### Organización de Carpetas

```
src/
├── components/        # Componentes React
│   ├── core/         # Componentes base
│   ├── features/     # Componentes de características
│   ├── panels/       # Paneles de la interfaz
│   ├── ui/           # Componentes de UI
│   └── views/        # Vistas principales
├── hooks/            # Hooks personalizados
├── lib/              # Utilidades y helpers
├── services/         # Servicios de la aplicación
└── store/            # Estado global (Zustand)
```

## Convenciones de Código

### Nombrado

- **Componentes**: PascalCase (ej: `ImageCard.tsx`)
- **Hooks**: camelCase con prefijo "use" (ej: `useImageViewer.ts`)
- **Servicios**: camelCase con sufijo "service" (ej: `imageService.ts`)
- **Utilidades**: camelCase (ej: `formatBytes.ts`)
- **Tipos**: PascalCase con sufijo descriptivo (ej: `ImageMetadata.ts`)

### Estructura de Componentes

```typescript
// Imports agrupados
import { type FC } from "react"
import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"

// Interfaces/Types
interface ComponentProps {
  // ...
}

// Componente
export const Component: FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Estados
  const [state, setState] = useState()

  // Callbacks
  const handleEvent = useCallback(() => {
    // ...
  }, [])

  // Renderizado
  return (
    // ...
  )
}
```

### Manejo de Datos

#### Prisma

```typescript
// Consultas
const data = await prisma.model.findMany({
  where: {
    field: value
  },
  include: {
    relation: true
  }
})

// Transacciones
await prisma.$transaction([
  prisma.model.create({ ... }),
  prisma.model.update({ ... })
])
```

#### Estado Global (Zustand)

```typescript
interface Store {
	data: Data[];
	addData: (item: Data) => void;
}

export const useStore = create<Store>((set) => ({
	data: [],
	addData: (item) =>
		set((state) => ({
			data: [...state.data, item],
		})),
}));
```

## Mejores Prácticas

### Rendimiento

1. Usar React.memo para componentes puros
2. Implementar virtualización para listas largas
3. Optimizar imágenes y assets
4. Usar lazy loading cuando sea apropiado

### Seguridad

1. Validar entrada de usuarios
2. Sanitizar datos antes de renderizar
3. Usar variables de entorno para secretos
4. Implementar rate limiting en APIs

### Testing

1. Escribir tests unitarios para utilidades
2. Crear tests de integración para flujos críticos
3. Usar mocks para servicios externos
4. Mantener buena cobertura de código

## Flujos de Trabajo

### Desarrollo de Características

1. Crear rama feature/nombre-caracteristica
2. Implementar cambios siguiendo guías
3. Escribir tests necesarios
4. Actualizar documentación
5. Crear PR con descripción detallada

### Manejo de Base de Datos

1. Crear/modificar modelos en schema.prisma
2. Generar tipos con prisma generate
3. Actualizar el seed si es necesario
4. Documentar cambios en schema.md
5. Actualizar migraciones

## Debugging

### Herramientas Recomendadas

- React Developer Tools
- VS Code Debugger
- Prisma Studio
- React Query Devtools

### Logging

```typescript
import { logger } from "@/lib/logger";

const componentLogger = logger.withContext("ComponentName");

componentLogger.info("Mensaje informativo");
componentLogger.error("Error en componente", { error });
```

## Despliegue

1. Ejecutar build de producción
2. Verificar variables de entorno
3. Ejecutar migraciones de base de datos
4. Validar rutas y APIs
5. Monitorear logs y rendimiento

## Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Guía de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs)
