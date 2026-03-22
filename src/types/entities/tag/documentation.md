# 🏷️ Entidad Tag

## ✅ Descripción

La entidad `Tag` representa etiquetas que pueden asociarse a otras entidades del sistema. Ha sido refactorizada para usar el patrón **`EntityWithStats`**, lo que significa que cada objeto `Tag` viene enriquecido con metadatos y estadísticas calculadas para un rendimiento y consistencia óptimos.

## 🏗️ Estructura de Archivos

```mermaid
graph TD
    subgraph "src/types/entities/tag"
        A[base.ts]
        B[index.ts]
        C[schema.ts]
        D[documentation.md]
    end
    subgraph "src/transformers/tag"
        E[mappers.ts]
        F[index.ts]
    end
    subgraph "src/app/actions/tags"
        G[crud.actions.ts]
        H[query.actions.ts]
    end
    subgraph "src/store/entities/tag"
        I[index.ts]
        J[types.ts]
        K[core.slice.ts]
    end

    A -- "Tipos Canónicos" --> B
    E -- "Mappers" --> F
    G & H -- "Server Actions" --> I
    J -- "Tipos del Store" --> K
```

## ✨ Tipos Principales (Canonical Types)

- `TagBase`: El tipo base generado por Drizzle.
- `TagWithStats`: El tipo canónico para la aplicación. Extiende `TagBase` con un objeto `stats` que contiene métricas calculadas.

## 🚀 Ejemplo de Uso (Server Actions)

```typescript
import { createTag, getTags } from '@/app/actions/tags/crud.actions';

// 1. Crear un nuevo tag
const newTagData = {
	name: 'Estilo Artístico',
	emoji: '🎨',
	color: '#8b5cf6',
	category: 'style',
	description: 'Tags relacionados con estilos artísticos y visuales.',
};
const newTag = await createTag(newTagData);
// newTag es de tipo TagWithStats

console.log(newTag.stats.popularity); // Acceder a estadísticas calculadas

// 2. Obtener todos los tags
const allTags = await getTags(); // Retorna Promise<TagWithStats[]>
```

## 🌊 Flujo de Datos

El flujo sigue un patrón `Server Action -> Mapper -> Drizzle`.

```mermaid
sequenceDiagram
    participant Client
    participant ServerAction
    participant Mapper
    participant Drizzle
    participant DB

    Client->>+ServerAction: Llama a getTag("some-id")
    ServerAction->>+Drizzle: select().from().where().with(relations)
    Drizzle->>+DB: SELECT con conteos de relaciones
    DB-->>-Drizzle: Retorna datos del tag con conteos
    Drizzle-->>-ServerAction: Retorna TagWithCounts
    ServerAction->>+Mapper: Llama a toTagWithStats(drizzleData)
    Mapper-->>-ServerAction: Retorna TagWithStats (con stats calculadas)
    ServerAction-->>-Client: Retorna Promise<TagWithStats>
```

## 📋 Mejores Prácticas

- **Usar `TagWithStats`**: Es el tipo de dato principal que debe fluir por la aplicación.
- **Server Actions**: Toda la lógica de negocio y acceso a datos debe realizarse a través de las server actions refactorizadas.
- **Consultas Eficientes**: Utilizar siempre `with(relations)` en las consultas de Drizzle para obtener los datos necesarios para las estadísticas sin cargar las relaciones completas.
- **Tipos de Input de Drizzle**: Para crear o actualizar, usar los tipos `TagCreateInput` y `TagUpdateInput`.
- **Estado en el cliente**: El store de Zustand (`useTagStore`) está optimizado para manejar `TagWithStats`.

## 🔄 Estado de la Migración

✅ **COMPLETADO**: La entidad `Tag` ha sido completamente refactorizada al patrón `EntityWithStats` y migrada a Drizzle. Se han actualizado tipos, transformadores, server actions y el store de Zustand. Se eliminaron los archivos legacy.

---

> Última actualización: 2025-01-27
