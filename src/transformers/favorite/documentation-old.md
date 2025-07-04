# Documentación de Transformadores de Favorite

## Descripción

Los transformadores de **Favorite** permiten mapear, serializar, deserializar y extender la entidad Favorite para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Favorite (Prisma/Raw)] --> B[serializers.ts]
    B -->|toPrismaFavorite| C[Prisma.FavoriteCreateInput]
    B -->|fromPrismaFavorite| D[FavoriteComplete]
    B -->|extendFavorite| E[FavoriteComplete]
    B -->|validateFavorite| F[Validación Zod]
    B -->|toExtendedFavorite| G[FavoriteComplete]
    A --> H[mappers.ts]
    H -->|toFavoriteListItem| I[FavoriteListItem]
    H -->|toFavoriteCard| J[FavoriteCard]
    H -->|parseFavoriteSearchParams| K[Prisma.FavoriteWhereInput]
    A --> L[transformer.ts]
    L -->|transformFavorite| D
    L -->|transformFavoriteToWithStats| M[FavoriteWithStats]
    L -->|transformFavoriteToExtended| N[FavoriteExtended]
```

---

## Estructura y Relaciones

- **mappers.ts**: Mapeo a formatos de UI y búsqueda.
- **serializers.ts**: Serialización/deserialización, validación y extensión.
- **transformer.ts**: Transformador principal, entrada unificada para conversión y extensión.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { transformFavorite, transformFavoriteToWithStats } from '@/transformers/favorite/transformer';
import { toFavoriteListItem } from '@/transformers/favorite/mappers';
import { toPrismaFavorite } from '@/transformers/favorite/serializers';

const favorite = transformFavorite(rawFavorite);
const favoriteStats = transformFavoriteToWithStats(favorite);
const listItem = toFavoriteListItem(favorite);
const prismaInput = toPrismaFavorite(favorite);
```

---

## Buenas Prácticas

- Usar **solo** los tipos y funciones canónicas exportadas.
- No modificar los tipos base ni duplicar lógica de transformación.
- Validar siempre los datos con los esquemas y funciones provistas.
- Mantener el barrel (`index.ts`) limpio y sin duplicados.

---

## Notas

- Todos los mapeos y serializaciones gestionan errores y validaciones de forma robusta.
- No existen tipos legacy ni duplicados en este módulo.

---

## Última revisión

- Fecha: 2025-06-10
- Estado: ✅ Auditado, sin errores TS, documentación y diagramas actualizados.
