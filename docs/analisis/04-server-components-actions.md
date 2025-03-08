# Análisis de Server Components y Server Actions

## Estado Actual

El proyecto implementa Server Components y Server Actions según el modelo de Next.js 15, con las siguientes características:

- **Server Components**: Utilizados principalmente en vistas y layouts
- **Server Actions**: Implementados en archivos dentro de `app/actions/`
- **Sistemas Mixtos**: Combinación de Client y Server Components

## Estructura de Server Actions

Las Server Actions siguen un patrón similar:

```typescript
'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { EntityType } from '@/types/entities';
import { revalidatePath } from 'next/cache';

const entityLogger = logger.withContext('EntityActions');

const REVALIDATE_PATHS = ['/settings', '/entities', '/entities/[id]'] as const;

const revalidateAllPaths = () => {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  entityLogger.info('🔄 Rutas revalidadas');
};

// Exportación de acciones públicas
export async function createEntity(data): Promise<EntityType> {
  // Implementación...

  await emit('entity:created', { id });
  revalidateAllPaths();
  return entity;
}
```

## Patrones de Implementación de Server Components

```tsx
// Patrón básico de Server Component
export default async function EntityPage({ params }: { params: { id: string } }) {
  // Obtener datos
  const entity = await getEntity(params.id);

  // Renderizar
  return (
    <div>
      <h1>{entity.name}</h1>
      <EntityClientComponent entity={entity} />
    </div>
  );
}

// Patrón de Client Component en módulo separado
'use client';

export function EntityClientComponent({ entity }) {
  const [state, setState] = useState();

  return (
    // UI interactiva
  );
}
```

## Problemas Identificados

1. **Inconsistencia en Revalidación**:
   - Algunas acciones revalidan rutas específicas, otras no
   - Patrones inconsistentes de revalidación (algunos usan comodines, otros rutas específicas)
   - No hay estrategia clara para minimizar revalidaciones innecesarias

2. **Manejo de Eventos**:
   - Emisión de eventos inconsistente
   - Migración parcial hacia nueva estructura de eventos (según docs/progress.md)
   - Falta de tipado estricto para eventos

3. **Integración Server-Cliente**:
   - Data fetching duplicado entre servidor y cliente
   - No hay estrategia clara para actualización optimista en cliente tras acciones del servidor
   - Errores de Server Actions manejados inconsistentemente

4. **Uso Ineficiente de Server Components**:
   - Algunos componentes que podrían ser Server Components son Client Components
   - Límites de Server/Client Components no claramente definidos
   - Potenciales mejoras de rendimiento no aprovechadas

5. **Manejo de Caché Inconsistente**:
   - Uso limitado de `unstable_cache` y técnicas avanzadas de caché
   - Revalidación excesiva que anula beneficios de caché
   - No hay estrategia clara para datos que cambian con frecuencia vs. datos estáticos

## Recomendaciones

### 1. Estandarización de Server Actions

Implementar un patrón estándar con mejor tipado y manejo de eventos:

```typescript
'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { ServerActionResult } from '@/types/actions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema de validación con Zod
const EntitySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  type: z.enum(['TYPE_A', 'TYPE_B']),
});

// Tipado para acciones
export type EntityCreateInput = z.infer<typeof EntitySchema>;

// Función helper para revalidación
const revalidateEntityPaths = (id?: string) => {
  // Rutas siempre a revalidar
  const basePaths = ['/api/entities', '/settings/entities'];

  // Rutas específicas si hay ID
  const idPaths = id ? [`/entities/${id}`, `/api/entities/${id}`] : [];

  // Revalidar todas las rutas necesarias
  [...basePaths, ...idPaths].forEach(path => revalidatePath(path));
};

// Acción estandarizada con manejo de errores y validación
export async function createEntity(input: EntityCreateInput): Promise<ServerActionResult<EntityType>> {
  try {
    // 1. Validar input
    const validatedData = EntitySchema.parse(input);

    // 2. Ejecutar operación
    const entity = await prisma.entity.create({
      data: validatedData,
    });

    // 3. Emitir evento
    await emit('entity:created', {
      id: entity.id,
      name: entity.name,
      timestamp: new Date().toISOString(),
    });

    // 4. Revalidar rutas afectadas
    revalidateEntityPaths(entity.id);

    // 5. Devolver resultado exitoso
    return { success: true, data: entity };
  } catch (error) {
    // Manejar errores de validación
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          details: error.flatten().fieldErrors,
          code: 'VALIDATION_ERROR',
        }
      };
    }

    // Manejar otros errores
    logger.error('Error creating entity:', error);
    return {
      success: false,
      error: {
        message: 'Failed to create entity',
        code: 'SERVER_ERROR',
      }
    };
  }
}
```

### 2. Mejora de Integración Server-Cliente

Implementar un patrón para actualizaciones optimistas:

```tsx
'use client';

import { createEntity } from '@/app/actions/entity.actions';
import { useOptimisticAction } from '@/hooks/use-optimistic-action';
import { toast } from 'sonner';

export function EntityForm() {
  // Hook personalizado para actualizaciones optimistas
  const { mutate, isPending } = useOptimisticAction({
    action: createEntity,
    onMutate: (variables) => {
      // Actualización optimista (antes de que complete la acción)
      // Ejemplo: queryClient.setQueryData o actualización de store
      return {
        // Contexto para rollback si falla
      };
    },
    onSuccess: (data) => {
      toast.success('Entity created successfully');
    },
    onError: (error, variables, context) => {
      // Revertir cambios optimistas usando contexto
      toast.error(error.message || 'Failed to create entity');
    },
  });

  const handleSubmit = async (formData: FormData) => {
    const input = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
    };

    mutate(input);
  };

  return (
    <form action={handleSubmit}>
      {/* Campos del formulario */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Entity'}
      </button>
    </form>
  );
}
```

### 3. Optimización de Server Components

Implementar límites claros entre Server y Client Components:

```tsx
// components/ServerEntityList.tsx
import { getEntities } from '@/app/actions/entity.actions';
import { EntityCard } from './EntityCard';

// Component puramente de servidor para obtener y mostrar datos
export async function ServerEntityList() {
  // Obtener datos directamente en el servidor
  const entities = await getEntities();

  return (
    <div className="grid grid-cols-3 gap-4">
      {entities.map(entity => (
        // Pasar sólo los datos necesarios a componentes cliente
        <EntityCard
          key={entity.id}
          entity={entity}
          initialIsExpanded={false}
        />
      ))}
    </div>
  );
}

// components/EntityCard.tsx
'use client';

// Componente cliente sólo para interactividad
export function EntityCard({ entity, initialIsExpanded }) {
  const [isExpanded, setIsExpanded] = useState(initialIsExpanded);

  return (
    <div className="card">
      <h3>{entity.name}</h3>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>

      {isExpanded && (
        <div className="card-details">
          {/* Detalles */}
        </div>
      )}
    </div>
  );
}
```

### 4. Estrategia Avanzada de Caché

Implementar un sistema de caché de múltiples niveles:

```typescript
'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// 1. Caché para datos estáticos (revalidación poco frecuente)
export const getGlobalSettings = unstable_cache(
  async () => {
    const settings = await prisma.settings.findFirst();
    return settings;
  },
  ['global-settings'],
  { revalidate: 3600 } // 1 hora
);

// 2. Caché para datos semi-estáticos (revalidación moderada)
export const getEntityTypes = unstable_cache(
  async () => {
    const types = await prisma.entityType.findMany();
    return types;
  },
  ['entity-types'],
  { revalidate: 300 } // 5 minutos
);

// 3. Caché para datos por usuario (con segmentación)
export const getUserSettings = unstable_cache(
  async (userId: string) => {
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });
    return settings;
  },
  ['user-settings'],
  { revalidate: 60 } // 1 minuto
);

// 4. Request-level cache con React.cache
export const getCurrentUser = cache(async () => {
  // Este resultado se cachea durante la renderización de una solicitud
  const user = await getUser();
  return user;
});
```

### 5. Sistema de Eventos Mejorado

```typescript
// Tipos estrictos para eventos
type EntityEvent =
  | { type: 'entity:created'; data: { id: string; name: string } }
  | { type: 'entity:updated'; data: { id: string; changes: Record<string, unknown> } }
  | { type: 'entity:deleted'; data: { id: string } };

type SystemEvent =
  | { type: 'system:cache-cleared'; data: { target: string } }
  | { type: 'system:error'; data: { message: string; code: string } };

type AppEvent = EntityEvent | SystemEvent;

// Sistema de emisión tipado
export async function emitEvent<T extends AppEvent>(event: T): Promise<void> {
  'use server';

  // Logging estructurado
  logger.info(`Event emitted: ${event.type}`, {
    eventType: event.type,
    eventData: event.data,
    timestamp: new Date().toISOString(),
  });

  // Revalidación basada en tipo de evento
  const pathsToRevalidate = getPathsForEventType(event.type);
  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }

  // Persistir evento si es necesario
  if (shouldPersistEvent(event.type)) {
    await prisma.eventLog.create({
      data: {
        type: event.type,
        data: JSON.stringify(event.data),
        timestamp: new Date(),
      },
    });
  }
}

// Función helper para obtener rutas afectadas por tipo de evento
function getPathsForEventType(eventType: string): string[] {
  // Mapa de tipos de eventos a rutas
  const EVENT_PATHS: Record<string, string[]> = {
    'entity:created': ['/entities', '/api/entities'],
    'entity:updated': ['/entities', '/api/entities'],
    'entity:deleted': ['/entities', '/api/entities'],
    // Otros eventos...
  };

  return EVENT_PATHS[eventType] || [];
}
```

## Plan de Implementación

1. **Fase 1: Finalizar Migración del Sistema de Eventos**
   - Completar tareas pendientes del documento de progreso
   - Implementar tipado estricto para eventos
   - Estandarizar emisión y manejo de eventos

2. **Fase 2: Estandarizar Server Actions**
   - Refactorizar para seguir el nuevo patrón con Zod y manejo de errores
   - Implementar estrategia consistente de revalidación
   - Documentar patrones aprobados

3. **Fase 3: Optimizar Server/Client Components**
   - Auditar y refactorizar componentes para aprovechar Server Components
   - Implementar límites claros entre Server y Client Components
   - Reducir JavaScript innecesario en el cliente

4. **Fase 4: Mejorar Integración Server-Cliente**
   - Implementar hooks para actualizaciones optimistas
   - Mejorar manejo de errores entre servidor y cliente
   - Establecer patrones para formularios y mutaciones

## Conclusión

La implementación actual de Server Components y Server Actions es funcional pero presenta oportunidades significativas de mejora. Estandarizar patrones, mejorar la integración servidor-cliente y optimizar la estrategia de caché resultaría en una aplicación más rápida, mantenible y con mejor experiencia de usuario.

Estos cambios aprovecharían mejor las capacidades del modelo de Next.js 15 y su arquitectura de aplicaciones React modernas.