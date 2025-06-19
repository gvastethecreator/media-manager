# 🔄 Guía de Transformadores

Los transformadores se encargan de convertir los datos entre el formato utilizado por la base de datos y el que utiliza la aplicación.

## 📂 Estructura de archivos

Cada carpeta bajo `src/transformers` incluye los siguientes archivos:

- `mappers.ts`: funciones que preparan datos para operaciones CRUD.
- `serializers.ts`: utilidades para extender, validar y normalizar entidades.
- `transformer.ts`: funciones de transformación principal.
- `index.ts`: punto de entrada que reexporta las utilidades anteriores.
- `documentation.md`: documentación específica de la entidad con diagramas y ejemplos.

## 🧩 Funciones estándar por entidad

Cada transformer debe implementar un conjunto estándar de funciones:

### 🔹 Funciones de mapeo desde/hacia Prisma

```typescript
// Transformación desde modelo Prisma a entidad de dominio
export function fromPrismaEntity(prismaEntity: PrismaEntity): Entity {
  // Transformación y validación
  return {
    // ...mapeo de campos
  };
}

// Para colecciones
export function fromPrismaEntities(prismaEntities: PrismaEntity[]): Entity[] {
  return prismaEntities.map(fromPrismaEntity);
}

// Para operaciones de creación/actualización (opcional)
export function toPrismaEntity(entity: CreateEntityInput): PrismaEntityCreateInput {
  // ...mapeo a formato Prisma
}
```

### 🔹 Funciones de extensión

Estas funciones extienden las entidades con campos computados, derivados o virtuales:

```typescript
// Extensión de una entidad individual
export function extendEntity(entity: Entity): EntityExtended {
  return {
    ...entity,
    // Propiedades calculadas o decoradas
    displayName: entity.name || 'Sin nombre',
    formattedDate: formatDate(entity.createdAt),
    // ... otras propiedades extendidas
  };
}

// Extensión de múltiples entidades
export function extendEntities(entities: Entity[]): EntityExtended[] {
  return entities.map(extendEntity);
}
```

### 🔹 Funciones de validación

```typescript
// Validar entrada para creación/actualización
export function validateEntity(data: unknown): Entity {
  // Validación con Zod u otra librería
  return entitySchema.parse(data);
}
```

## 🛡️ Principios generales

- **Sin Prisma en el cliente**: ningún archivo exportado desde un transformer debe importar `PrismaClient` ni tipos de Prisma. Utiliza los tipos definidos en `src/types`.
- **Funciones puras**: los transformers no contienen lógica de acceso a datos; se limitan a mapear y validar estructuras.
- **Errores unificados**: usa los errores definidos en `src/transformers/errors` para mantener consistencia.
- **Testing**: los tests deben mockear cualquier dependencia externa. Consulta `src/tests/README.md` para los helpers disponibles.

## 🆕 Añadir un nuevo transformer

1. Crea una carpeta `src/transformers/<entidad>`.
2. Define los tipos de dominio en `src/types/entities/<entidad>`.
3. Implementa `serializers.ts`, `mappers.ts` y `transformer.ts` siguiendo el patrón actual.
4. Expón solo las funciones necesarias desde `index.ts` y evita reexportar tipos destinados al servidor.
5. Documenta el módulo en `documentation.md` e incluye diagramas mermaid si son útiles.

### Ejemplo básico de un transformer completo

```typescript
// src/transformers/example/mappers.ts
import type { Example, ExampleCreateInput } from '@/types/entities/example/types';
import type { PrismaExample } from '@/types/entities/example/prisma-types';

export function fromPrismaExample(prismaExample: PrismaExample): Example {
  return {
    id: prismaExample.id,
    name: prismaExample.name,
    createdAt: new Date(prismaExample.createdAt),
    // ... otros campos
  };
}

export function fromPrismaExamples(prismaExamples: PrismaExample[]): Example[] {
  return prismaExamples.map(fromPrismaExample);
}

// src/transformers/example/serializers.ts
import type { Example, ExampleExtended } from '@/types/entities/example/types';

export function extendExample(example: Example): ExampleExtended {
  return {
    ...example,
    displayName: example.name || 'Sin nombre',
    // ... otras propiedades calculadas
  };
}

export function extendExamples(examples: Example[]): ExampleExtended[] {
  return examples.map(extendExample);
}

// src/transformers/example/index.ts
export * from './mappers';
export * from './serializers';
export * from './transformer';

// No exportar tipos internos o funciones de utilidad privadas
```

## 🌟 Buenas prácticas

- Mantén los archivos pequeños y enfocados en una única responsabilidad.
- Añade comentarios explicativos si se realizan transformaciones complejas.
- Incluye tests unitarios por cada función exportada.
- Si detectas dependencias de Prisma en un transformer, repórtalo en `TRANSFORMERS-FIX.md` y corrígelo.
- Documenta todos los edge cases y transformaciones especiales.

## 🔄 Integración con Server Actions

Los transformers son utilizados por las Server Actions para convertir datos antes de devolverlos al cliente:

```typescript
export async function getEntities(): Promise<Entity[]> {
  const prismaEntities = await prisma.entity.findMany();
  return fromPrismaEntities(prismaEntities);
}
```

Luego, en el cliente (como un store de Zustand), se pueden usar las funciones de extensión:

```typescript
import { extendEntities } from '@/transformers/entity';

// En una acción del store
const fetchEntities = async () => {
  try {
    const entities = await getEntities(); // Server Action
    const extendedEntities = extendEntities(entities);
    set({ entities: extendedEntities });
  } catch (error) {
    console.error('Error fetching entities', error);
  }
};
```

Para más información sobre las convenciones de testing revisa `src/tests/README.md`.
