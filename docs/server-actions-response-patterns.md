# Patrones de Respuesta en Server Actions

Este documento describe los patrones de respuesta utilizados en las Server Actions del proyecto, con especial atención a la reciente estandarización del formato de respuesta para evitar errores de tipado y mantener consistencia en la capa de interfaz.

## Patrón Actual (junio 2025)

Las Server Actions ahora devuelven directamente los datos transformados, sin envolverlos en objetos con propiedades `success`, `data` o `error`. Este enfoque simplifica el consumo de las respuestas y aprovecha el sistema nativo de manejo de errores de JavaScript.

### ✅ Patrón correcto

```typescript
// En la Server Action
export async function getEntity(id: string): Promise<Entity | null> {
  try {
    const entity = await prisma.entity.findUnique({ where: { id } });
    if (!entity) return null;
    return fromPrismaEntity(entity);
  } catch (error) {
    logger.error('Error fetching entity', { error });
    throw new Error('Failed to fetch entity');
  }
}

// En el consumidor (store, componente, etc.)
const entity = await getEntity(id);
if (entity) {
  // Procesar la entidad
} else {
  // Manejar caso de entidad no encontrada
}
```

### ❌ Patrón obsoleto (no usar)

```typescript
// Formato antiguo - NO USAR
export async function getEntity(id: string): Promise<{ success: boolean; data?: Entity; error?: string }> {
  try {
    const entity = await prisma.entity.findUnique({ where: { id } });
    if (!entity) return { success: false, error: 'Entity not found' };
    return { success: true, data: fromPrismaEntity(entity) };
  } catch (error) {
    logger.error('Error fetching entity', { error });
    return { success: false, error: 'Failed to fetch entity' };
  }
}

// Consumidor con patrón antiguo - NO USAR
const response = await getEntity(id);
if (response.success && response.data) {
  // Procesar la entidad
} else {
  // Manejar error
}
```

## Manejo de errores

### En las Server Actions

Las Server Actions deben lanzar excepciones para indicar errores, en lugar de devolver objetos con estados de error:

```typescript
export async function updateEntity(id: string, data: UpdateData): Promise<Entity> {
  try {
    if (!id) {
      throw new Error('ID is required');
    }

    const updated = await prisma.entity.update({
      where: { id },
      data: mapUpdateDataToPrisma(data),
    });

    return fromPrismaEntity(updated);
  } catch (error) {
    logger.error('Error updating entity', { id, error });
    throw error; // Propagar el error para que sea manejado por el cliente
  }
}
```

### En los consumidores (stores)

Los stores y otros consumidores deben usar bloques `try/catch` para manejar errores:

```typescript
export const createEntityStore = (set, get) => ({
  updateEntity: async (id, data) => {
    get().setLoading(true);
    try {
      const entity = await updateEntity(id, data);
      get().setEntity(entity);
      return entity;
    } catch (error) {
      get().setError('Failed to update entity');
      console.error('Error updating entity:', error);
      return null;
    } finally {
      get().setLoading(false);
    }
  }
});
```

## Extendiendo entidades en el cliente

Para entidades que requieren procesamiento adicional en el cliente (como cálculos, formateo o unión de datos):

1. Las Server Actions devuelven datos sin procesar o parcialmente procesados
2. Los stores utilizan funciones utilitarias (como `extendEntity` o `extendEntities`) para completar los datos

```typescript
// En el store
import { extendEntity } from '@/transformers/entity';

export const createEntityStore = (set, get) => ({
  fetchEntity: async (id) => {
    get().setLoading(true);
    try {
      const response = await getEntity(id);
      if (response) {
        const extended = extendEntity(response);
        get().setEntity(extended);
        return extended;
      }
      return null;
    } catch (error) {
      get().setError('Failed to fetch entity');
      return null;
    } finally {
      get().setLoading(false);
    }
  }
});
```

## Conclusión

Este enfoque simplifica el código, reduce errores de tipado, y aprovecha mejor las características nativas de JavaScript/TypeScript para manejo de errores y datos opcionales.

### Migración de código existente

Al encontrar código que utilice el patrón antiguo:

1. Modificar la Server Action para que devuelva directamente la entidad o `null`
2. Modificar la Server Action para que lance excepciones en caso de error
3. Actualizar los consumidores para que manejen directamente la entidad y utilicen bloques `try/catch`
4. Agregar funciones `extendEntity` si es necesario para completar datos en el cliente
