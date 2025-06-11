# 🏷️ Entidad Property

## Descripción

La entidad `Property` representa atributos, características o propiedades que pueden asociarse a imágenes, notas, personajes, conceptos, world items y más. Permite modelar metadatos, atributos personalizados, etc.

## Estructura

```mermaid
graph TD
    A[Property Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[types.ts]
    C --> C1[mappers.ts]
    C --> C2[serializers.ts]
    C --> C3[transformer.ts]
    D --> D1[documentation.md]
```

## Tipos principales

- `PropertyBase`, `PropertyComplete`, `PropertyCreateInput`, `PropertyUpdateInput`
- Filtros: `PropertyFilters`, `PropertySearchOptions`, `PropertySearchResult`

## Ejemplo de uso

```typescript
import { createProperty, updateProperty, searchProperties } from '@/transformers/property';

const nuevaProp = await createProperty({ name: 'Rareza', value: 'Épica' });
const props = await searchProperties({ filters: { search: 'Rareza' } });
await updateProperty(nuevaProp.id, { value: 'Legendaria' });
```

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createProperty()
    API->>Transformer: mapCreatePropertyDataToPrisma()
    Transformer->>DB: prisma.property.create()
    DB-->>Transformer: Property
    Transformer-->>API: transformProperty()
    API-->>Client: PropertyComplete
```

## Mejores prácticas

- Usar siempre los tipos canónicos (`PropertyCreateInput`, `PropertyUpdateInput`, `PropertyComplete`).
- Validar los datos antes de crear/actualizar (`validateProperty`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

## Integración

Las propiedades pueden asociarse a:

- Imágenes, notas, álbumes, personajes, conceptos, world items, prompts, grupos, etc.

Al eliminar una propiedad, revisar las relaciones para evitar referencias huérfanas.

---

> Última actualización: 2025-06-10
