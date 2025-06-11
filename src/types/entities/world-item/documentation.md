# 🌍 Entidad WorldItem

## Descripción

La entidad `WorldItem` representa objetos, artefactos, recursos o elementos del mundo que pueden asociarse a personajes, lugares, notas, imágenes y más. Permite modelar inventarios, recursos, artefactos mágicos, etc.

## Estructura

```mermaid
graph TD
    A[WorldItem Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[types.ts]
    B --> B2[base.ts]
    B --> B3[extended.ts]
    C --> C1[mappers.ts]
    C --> C2[serializers.ts]
    C --> C3[transformer.ts]
    D --> D1[documentation.md]
```

## Tipos principales

- `WorldItemBase`, `WorldItemComplete`, `WorldItemCreateInput`, `WorldItemUpdateInput`
- Filtros: `WorldItemFilters`, `WorldItemSearchOptions`, `WorldItemSearchResult`

### Campos principales

- **id**: identificador único del objeto
- **name**: nombre descriptivo
- **type**: categoría del objeto (`weapon`, `tool`, `artifact`, ...)
- **rarity**: rareza (`COMMON`, `RARE`, etc.)
- **stats**: objeto con estadísticas numéricas y efectos
- **properties**: lista de `WorldItemProperty`
- **createdAt** y **updatedAt**: timestamps de auditoría

## Ejemplo de uso

```typescript
import { createWorldItem, updateWorldItem, searchWorldItems } from '@/transformers/world-item';

const nuevoItem = await createWorldItem({ name: 'Espada legendaria', type: 'arma' });
const items = await searchWorldItems({ filters: { search: 'Espada' } });
await updateWorldItem(nuevoItem.id, { description: 'Una espada con poderes mágicos.' });
```

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createWorldItem()
    API->>Transformer: mapCreateWorldItemDataToPrisma()
    Transformer->>DB: prisma.worldItem.create()
    DB-->>Transformer: WorldItem
    Transformer-->>API: transformWorldItem()
    API-->>Client: WorldItemComplete
```

## Mejores prácticas

- Usar siempre los tipos canónicos (`WorldItemCreateInput`, `WorldItemUpdateInput`, `WorldItemComplete`).
- Validar los datos antes de crear/actualizar (`validateWorldItem`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

## Integración

Los WorldItems pueden asociarse a:

- Personajes, lugares, notas, imágenes, álbumes, conceptos, prompts, grupos, etc.

Al eliminar un WorldItem, revisar las relaciones para evitar referencias huérfanas.

---

> Última actualización: 2025-06-11
