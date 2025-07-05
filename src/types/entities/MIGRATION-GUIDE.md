# 🏗️ Guía de Migración a Tipos Canónicos

## Resumen



> **⚠️ NOTA DE MIGRACIÓN**: Este proyecto está migrando gradualmente de Prisma a Drizzle ORM. Durante la transición, ambos ORMs coexisten. Ver [Guía de Coexistencia](../../../docs/migration-drizzle/02-coexistence-guide.md) para detalles sobre la migración en curso.

## ✅ Entidades migradas

- ✅ `Place`: Completada
- ✅ `Property`: Completada
- ✅ `WorldItem`: Completada
- ✅ `Album`: Completada
- ✅ `Tag`: Completada

## 📝 Patrón de migración

Para cada entidad, seguimos este patrón:

1. **Actualizar `types.ts`**:
   - Usar el tipo Prisma como base canónica (`export type EntityBase = PrismaEntity`)
   - Definir interfaces para estructuras adicionales (relaciones, contadores)
   - Crear interfaces para inputs de creación/actualización
   - Mantener alias de tipos para compatibilidad con código existente

2. **Actualizar `index.ts`**:
   - Exportar todos los tipos desde un punto central
   - Mantener re-exportaciones explícitas para compatibilidad con código legacy
   - Agregar tipos de configuración visual si son necesarios

3. **Actualizar archivos relacionados**:
   - Transformadores/mappers
   - Components UI que utilizan estos tipos
   - Server actions
   - Store y slices

4. **Eliminar archivos redundantes**:
   - `validators.ts` (reemplazado por Zod schemas en `schema.ts`)
   - `extended.ts` (funcionalidad incorporada en interfaces adicionales en `types.ts`)
   - Transformadores obsoletos en store

## 🛠️ Pasos técnicos

1. **Importar el tipo Prisma**:

   ```typescript
   import type { Entity as PrismaEntity } from '@prisma/client';
   ```

2. **Definir el tipo base**:

   ```typescript
   export type EntityBase = PrismaEntity;
   ```

3. **Crear interfaces para relaciones**:

   ```typescript
   export interface EntityRelations {
     images?: Image[];
     // otras relaciones
   }
   ```

4. **Crear interfaces para contadores**:

   ```typescript
   export interface EntityCounts {
     images?: number;
     // otros contadores
   }
   ```

5. **Definir tipos para inputs**:

   ```typescript
   export interface EntityCreateInput {
     name: string;
     // otros campos requeridos
     images?: { connect: { id: string }[] };
   }

   export interface EntityUpdateInput {
     name?: string;
     // campos opcionales
     images?: { set?: { id: string }[] };
   }
   ```

6. **Definir el tipo principal**:

   ```typescript
   export type Entity = EntityBase;
   ```

7. **Agregar alias para compatibilidad**:

   ```typescript
   export type { EntityCreateInput as CreateEntityData };
   ```

## 📊 Beneficios

- Jerarquía de tipos más clara y consistente
- Reducción de duplicación
- Mejor tipado para operaciones CRUD
- Más fácil mantenimiento
- Resolución de errores de TypeScript

## 📚 Próximos pasos

1. Continuar con la migración de las entidades restantes
2. Actualizar la documentación
3. Agregar tests para validar los tipos

## 🔍 Modo de uso

```typescript
import { Entity, EntityCreateInput, EntityUpdateInput } from '@/types/entities/entity';

// Crear nueva entidad
const createInput: EntityCreateInput = {
  name: 'Nueva entidad',
  // otros campos
};

// Actualizar entidad
const updateInput: EntityUpdateInput = {
  name: 'Nombre actualizado',
  // otros campos
};

// Usar el tipo base
const entity: Entity = {
  id: '123',
  name: 'Entidad',
  // otros campos requeridos por Drizzle
};
```
