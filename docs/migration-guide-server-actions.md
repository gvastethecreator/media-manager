# 🔄 Guía de Migración de Server Actions y Stores

Esta guía proporciona instrucciones paso a paso para migrar código existente al nuevo patrón de respuesta en Server Actions y la integración con Stores.

## 📌 Contexto del cambio

Hasta mayo de 2025, las Server Actions devolvían objetos con la estructura `{ success: boolean; data?: T; error?: string }`. A partir de junio 2025, las Server Actions devuelven directamente los datos transformados y utilizan excepciones para manejar errores.

## 🚀 Pasos para migrar Server Actions

### 1️⃣ Migración de Server Action

#### Antes

```typescript
// Patrón antiguo
export async function getEntity(id: string): Promise<{ success: boolean; data?: Entity; error?: string }> {
  try {
    const entity = await prisma.entity.findUnique({ where: { id } });
    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }
    return {
      success: true,
      data: fromPrismaEntity(entity)
    };
  } catch (error) {
    console.error('Error fetching entity', error);
    return { success: false, error: 'Failed to fetch entity' };
  }
}
```

#### Después

```typescript
// Nuevo patrón
export async function getEntity(id: string): Promise<Entity | null> {
  try {
    const entity = await prisma.entity.findUnique({ where: { id } });
    if (!entity) {
      return null;
    }
    return fromPrismaEntity(entity);
  } catch (error) {
    console.error('Error fetching entity', error);
    throw new Error('Failed to fetch entity');
  }
}
```

### 2️⃣ Migración de Store o Cliente

#### Antes

```typescript
// Store usando el patrón antiguo
export const createEntityStore = (set, get) => ({
  fetchEntity: async (id) => {
    set({ loading: true });
    const response = await getEntity(id);

    if (response.success && response.data) {
      set({
        entity: response.data,
        error: null,
        loading: false
      });
      return response.data;
    } else {
      set({
        error: response.error || 'Error desconocido',
        loading: false
      });
      return null;
    }
  }
});
```

#### Después

```typescript
// Store usando el nuevo patrón
export const createEntityStore = (set, get) => ({
  fetchEntity: async (id) => {
    set({ loading: true });
    try {
      const entity = await getEntity(id);
      if (entity) {
        set({
          entity,
          error: null
        });
        return entity;
      } else {
        set({ error: 'Entity not found' });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Error desconocido' });
      return null;
    } finally {
      set({ loading: false });
    }
  }
});
```

## 🔍 Casos particulares

### Múltiples entidades (arrays)

#### Antes

```typescript
// Antiguo
export async function getEntities(): Promise<{ success: boolean; data?: Entity[]; error?: string }> {
  // ...
  return { success: true, data: entities };
}

// Consumo
const response = await getEntities();
if (response.success && response.data) {
  const extendedEntities = extendEntities(response.data);
  set({ entities: extendedEntities });
}
```

#### Después

```typescript
// Nuevo
export async function getEntities(): Promise<Entity[]> {
  // ...
  return entities;
}

// Consumo
try {
  const entities = await getEntities();
  const extendedEntities = extendEntities(entities);
  set({ entities: extendedEntities });
} catch (error) {
  set({ error: error.message });
}
```

### Operaciones CRUD (crear, actualizar, eliminar)

#### Antes

```typescript
// Antiguo
export async function updateEntity(id: string, data: UpdateData): Promise<{ success: boolean; data?: Entity; error?: string }> {
  // ...
  return { success: true, data: updatedEntity };
}

// Consumo
const response = await updateEntity(id, data);
if (response.success) {
  // Éxito
} else {
  // Error
}
```

#### Después

```typescript
// Nuevo
export async function updateEntity(id: string, data: UpdateData): Promise<Entity> {
  // Si hay un error, lanzará una excepción
  // ...
  return updatedEntity;
}

// Consumo
try {
  const entity = await updateEntity(id, data);
  // Éxito
} catch (error) {
  // Error
}
```

## 🔍 Detección de código para migrar

Puedes utilizar estas búsquedas en tu IDE para encontrar código que necesite ser migrado:

1. `.success &&` - Probablemente código que verifica éxito en respuestas de Server Actions
2. `.data?` o `.data!` - Acceso a la propiedad data de respuestas
3. `.error` - Acceso a errores en formato antiguo
4. `Promise<{ success: boolean` - Tipo de retorno antiguo en Server Actions

## 🧪 Prueba después de migrar

Después de migrar cada archivo:

1. Ejecuta la validación de tipos con TypeScript
2. Prueba la funcionalidad en la UI para verificar que todo funcione correctamente
3. Actualiza las pruebas unitarias y de integración si existen

## 🚨 Errores comunes

- **Error**: Acceder a `.data` o `.success` en respuestas sin wrapper
  **Solución**: Usar directamente la respuesta

- **Error**: No manejar excepciones
  **Solución**: Agregar bloques try/catch en el consumidor

- **Error**: Lógica mezclada de los dos patrones
  **Solución**: Migrar completamente a un patrón, no mezclar

## 📅 Calendario de migración

- **Fase 1**: Migrar nuevas entidades y sus dependencias (Completado)
- **Fase 2**: Migrar entidades core (En progreso)
- **Fase 3**: Migrar todo el código restante (Pendiente)

Para dudas técnicas sobre la migración, consulta `docs/server-actions-response-patterns.md` o contacta al equipo de arquitectura.
