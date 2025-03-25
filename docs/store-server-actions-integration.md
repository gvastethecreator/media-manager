# Plan de Integración: Stores y Server Actions

Este documento describe la estrategia para integrar los nuevos stores basados en el patrón de slices con los server actions existentes en la aplicación.

## Estructura actual de Server Actions

```
src/app/actions/
├─ activity/
│  └─ activity.actions.ts
├─ albums/
│  └─ album.actions.ts
├─ characters/
│  └─ character.actions.ts
├─ collections/
│  └─ collection.actions.ts
├─ concepts/
│  └─ concept.actions.ts
├─ favorites/
│  └─ favorite.actions.ts
├─ files/
│  └─ file.actions.ts
├─ folders/
│  ├─ folder-crud.actions.ts
│  ├─ folder-indexing.actions.ts
│  ├─ folder-processing.actions.ts
│  └─ ...
├─ images/
│  ├─ image-crud.actions.ts
│  ├─ image-processing.actions.ts
│  └─ ...
├─ notes/
│  └─ note.actions.ts
├─ places/
│  └─ place.actions.ts
└─ ...
```

## Estructura objetivo de la integración

```
src/app/actions/[entidad]/
├─ [entidad].actions.ts       # Acciones principales (CRUD)
├─ [entidad]-utils.actions.ts # Utilidades específicas
└─ index.ts                   # Exportaciones
```

## Estrategia de integración

### Fase 1: Adaptadores y transformadores

1. **Crear adaptadores** entre el formato de datos de los server actions y los nuevos stores
2. **Integrar transformadores** en los server actions para serialización/deserialización
3. **Actualizar tipos** en los server actions para usar los tipos definidos en `/types/entities/`

### Fase 2: Refactorización incremental

1. **Adaptar gradualmente** cada server action para usar los nuevos transformadores
2. **Mantener compatibilidad** con código existente durante la transición
3. **Implementar tests** para verificar que la refactorización mantiene la funcionalidad

### Fase 3: Conectar con los stores

1. **Actualizar los stores** para llamar a los server actions
2. **Reemplazar mocks** con llamadas reales a los server actions
3. **Implementar manejo de errores** consistente entre stores y server actions

## Plan de acción por entidad

### 1. VisualPreset (Prioridad: Alta)

Integrar `src/store/entities/visual-preset/` con los server actions existentes:

1. Identificar los server actions relacionados con presets visuales
2. Integrar transformadores:
   ```typescript
   // En visual-presets.actions.ts
   import { serializeVisualPreset, deserializeVisualPreset } from '@/transformers/visual-preset';
   import type { VisualPresetDto, VisualPresetExtended } from '@/types/entities/visual-preset';

   export async function getVisualPresets(): Promise<ActionResponse<VisualPresetExtended[]>> {
     try {
       const presets = await prisma.visualPreset.findMany({...});

       // Transformar datos con los nuevos transformadores
       const transformedPresets = presets.map(deserializeVisualPreset);

       return {
         success: true,
         data: transformedPresets,
         message: 'Presets obtenidos con éxito'
       };
     } catch (error) {
       // Manejo de errores
     }
   }
   ```

3. Actualizar el store para usar los server actions:
   ```typescript
   // En src/store/entities/visual-preset/slices/core.ts
   import { getVisualPresets, getVisualPresetById } from '@/app/actions/visual-presets/visual-presets.actions';

   export const createCoreSlice: StateCreator<...> = (set) => ({
     // ...
     fetchPresets: async () => {
       try {
         set({ loading: true, error: null });

         // Reemplazar mock con llamada real
         const response = await getVisualPresets();

         if (response.success) {
           set({ presets: response.data || [], loading: false });
         } else {
           set({ error: response.message, loading: false });
         }
       } catch (error) {
         // Manejo de errores
       }
     },
     // ...
   });
   ```

### 2. Image (Prioridad: Alta)

Integración con múltiples server actions en `/app/actions/images/`:

1. Revisar estructura de acciones existentes:
   - `image-crud.actions.ts`
   - `image-processing.actions.ts`
   - `image-stats.actions.ts`

2. Coordinar transformadores con múltiples acciones:
   ```typescript
   // En image-crud.actions.ts
   import { deserializeImage, serializeImageInput } from '@/transformers/image';
   import type { ImageDto, ImageExtended } from '@/types/entities/image';

   export async function getImages(params: GetImagesParams): Promise<ActionResponse<ImageExtended[]>> {
     try {
       // Implementación existente
       // ...

       // Transformar datos
       const transformedImages = images.map(deserializeImage);

       return {
         success: true,
         data: transformedImages,
         // ...
       };
     } catch (error) {
       // Manejo de errores
     }
   }
   ```

### 3. Folder (Prioridad: Alta)

Integración con múltiples server actions en `/app/actions/folders/`:

1. Evaluar las diferentes acciones:
   - `folder-crud.actions.ts`
   - `folder-indexing.actions.ts`
   - `folder-processing.actions.ts`

2. Crear una estrategia de integración gradual:
   ```typescript
   // En folder-crud.actions.ts
   import { deserializeFolder, serializeFolderInput } from '@/transformers/folder';

   // Actualizar actions existentes...
   ```

## Guía de implementación por pasos

### Paso 1: Preparación

1. **Revisar** los server actions existentes para cada entidad
2. **Identificar** patrones comunes y puntos de integración
3. **Documentar** la API actual y los formatos de datos

### Paso 2: Implementación de adaptadores

1. **Crear** archivos adaptadores en `src/adapters/[entidad]/`
2. **Implementar** funciones para transformar entre formatos
3. **Testear** los adaptadores con casos límite

### Paso 3: Actualización de Server Actions

1. **Integrar** adaptadores en server actions de forma gradual
2. **Refactorizar** manteniendo compatibilidad hacia atrás
3. **Verificar** que los datos transformados son correctos

### Paso 4: Conexión con Stores

1. **Actualizar** los stores para usar server actions reales
2. **Implementar** manejo de errores consistente
3. **Testear** el flujo completo de datos

### Paso 5: Validación y Clean-up

1. **Verificar** que todas las integraciones funcionan correctamente
2. **Eliminar** código duplicado y mocks
3. **Documentar** la nueva arquitectura integrada

## Plantilla de integración de Server Action

```typescript
// src/app/actions/[entidad]/[entidad].actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import {
  serialize[Entidad],
  deserialize[Entidad]
} from '@/transformers/[entidad]';
import type {
  [Entidad]Dto,
  [Entidad]Extended
} from '@/types/entities/[entidad]';
import { validate[Entidad] } from '@/utils/[entidad]/validators';

const logger = serverLogger.withContext('[Entidad]Actions');

export interface ActionResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * Obtiene todas las [entidades] con filtros opcionales
 */
export async function get[Entidades](params?: {
  search?: string;
  category?: string;
  // etc...
}): Promise<ActionResponse<[Entidad]Extended[]>> {
  try {
    logger.info('🔍 Obteniendo [entidades]', params);

    // Implementar filtros y consulta
    const [entidades] = await prisma.[entidad].findMany({
      // Configuración de la consulta
    });

    // Transformar datos usando los nuevos transformadores
    const transformed[Entidades] = [entidades].map(deserialize[Entidad]);

    return {
      success: true,
      message: '[Entidades] obtenidas correctamente',
      data: transformed[Entidades]
    };
  } catch (error) {
    logger.error('❌ Error obteniendo [entidades]:', error);
    return {
      success: false,
      message: 'Error al obtener las [entidades]'
    };
  }
}

/**
 * Obtiene una [entidad] específica por ID
 */
export async function get[Entidad]ById(id: string): Promise<ActionResponse<[Entidad]Extended>> {
  try {
    logger.info(`🔍 Obteniendo [entidad] con ID: ${id}`);

    const [entidad] = await prisma.[entidad].findUnique({
      where: { id }
    });

    if (!element) {
      return {
        success: false,
        message: '[Entidad] no encontrada'
      };
    }

    // Transformar datos
    const transformed[Entidad] = deserialize[Entidad]([entidad]);

    return {
      success: true,
      message: '[Entidad] obtenida correctamente',
      data: transformed[Entidad]
    };
  } catch (error) {
    logger.error(`❌ Error obteniendo [entidad] con ID ${id}:`, error);
    return {
      success: false,
      message: 'Error al obtener la [entidad]'
    };
  }
}

/**
 * Crea una nueva [entidad]
 */
export async function create[Entidad](data: [Entidad]Dto): Promise<ActionResponse<[Entidad]Extended>> {
  try {
    logger.info('➕ Creando nueva [entidad]');

    // Validar datos de entrada
    const validationResult = validate[Entidad](data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Datos de [entidad] inválidos',
        errors: validationResult.error
      };
    }

    // Preparar datos para Prisma
    const dbData = serialize[Entidad](data);

    // Crear registro
    const new[Entidad] = await prisma.[entidad].create({
      data: dbData
    });

    // Transformar resultado
    const transformed[Entidad] = deserialize[Entidad](new[Entidad]);

    return {
      success: true,
      message: '[Entidad] creada correctamente',
      data: transformed[Entidad]
    };
  } catch (error) {
    logger.error('❌ Error creando [entidad]:', error);
    return {
      success: false,
      message: 'Error al crear la [entidad]'
    };
  }
}

// Implementar otras acciones (update, delete, etc)...
```

## Recomendaciones generales

1. **Implementación gradual**: Comenzar con entidades simples e ir avanzando hacia las más complejas
2. **Tests**: Crear tests para asegurar que la funcionalidad se mantiene durante la refactorización
3. **Compatibilidad**: Mantener versiones compatibles durante la transición
4. **Documentación**: Actualizar la documentación a medida que se realizan cambios
5. **Revisión de código**: Realizar revisiones de código regulares para asegurar la consistencia

## Próximos pasos

1. Crear los adaptadores para las entidades prioritarias (VisualPreset, Image, Folder)
2. Implementar versiones de prueba de integración en ambientes de desarrollo
3. Planificar la migración gradual del resto de entidades
4. Establecer un plan de seguimiento para identificar y corregir problemas durante la transición