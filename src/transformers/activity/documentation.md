# Documentación de Transformadores de Activity

## Descripción

Los transformadores de **Activity** permiten mapear, serializar, deserializar y extender la entidad Activity para distintos usos (UI, API, persistencia, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Activity (Prisma/Raw)] --> B[mappers.ts]
    B -->|toActivityListItem| C[ActivityListItem]
    B -->|toActivityCard| D[ActivityCard]
    B -->|parseActivitySearchParams| E[Prisma.ActivityWhereInput]
    A --> F[serializers.ts]
    F -->|transformActivity| G[ActivityComplete]
    F -->|validateActivity| H[Validación Zod]
    F -->|extendActivity| I[ActivityComplete]
    F -->|toExtendedActivity| J[ActivityComplete]
    F -->|toActivityWithStats| K[ActivityWithStats]
    F -->|toActivitySearchResult| L[ActivitySearchResult]
    F -->|toActivityFilters| M[ActivityFilters]
    F -->|toActivitySearchOptions| N[ActivitySearchOptions]
    F -->|toActivityCreateInput| O[ActivityCreateInput]
    F -->|toActivityUpdateInput| P[ActivityUpdateInput]
    F -->|toActivityBase| Q[ActivityBase]
    F -->|toActivityComplete| R[ActivityComplete]
    F -->|toActivityRelations| S[ActivityRelations]
    F -->|toActivityCount| T[ActivityCount]
    F -->|toActivityTransformerOptions| U[ActivityTransformerOptions]
    F -->|toActivityViewMode| V[ActivityViewMode]
    F -->|toActivitySortCriteria| W[ActivitySortCriteria]
    F -->|toActivityListOptions| X[ActivityListOptions]
    F -->|toActivityAdvancedFilter| Y[ActivityAdvancedFilter]
    F -->|toActivityCacheConfig| Z[ActivityCacheConfig]
    F -->|toActivityStats| AA[ActivityStats]
    F -->|toActivityRelationsSchema| AB[ActivityRelationsSchema]
    F -->|toActivitySearchOptionsSchema| AC[ActivitySearchOptionsSchema]
    F -->|toActivityListOptionsSchema| AD[ActivityListOptionsSchema]
    F -->|toActivityAdvancedFilterSchema| AE[ActivityAdvancedFilterSchema]
    F -->|toActivityFilterSchema| AF[ActivityFilterSchema]
    F -->|toActivitySchema| AG[ActivitySchema]
    F -->|toCreateActivitySchema| AH[CreateActivitySchema]
    F -->|toUpdateActivitySchema| AI[UpdateActivitySchema]
```

---

## Estructura y Relaciones

- **mappers.ts**: Mapeo a formatos de UI y búsqueda.
- **serializers.ts**: Serialización/deserialización, validación y extensión.
- **validators.ts**: Validación adicional.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { transformActivity } from '@/transformers/activity/serializers';
import { toActivityListItem } from '@/transformers/activity/mappers';

const activity = transformActivity(rawActivity);
const listItem = toActivityListItem(activity);
```

---

## Buenas Prácticas

- Usar **solo** los tipos y funciones canónicas exportadas.
- No modificar los tipos base ni duplicar lógica de transformación.
- Validar siempre los datos con los esquemas y funciones provistas.
- Mantener el barrel (`index.ts`) limpio y sin duplicados.

---

## Notas

- Todos los mapeos gestionan errores y validaciones de forma robusta.
- No existen tipos legacy ni duplicados en este módulo.

---

## Última revisión

- Fecha: 2025-06-10
- Estado: ✅ Auditado, sin errores TS, documentación y diagramas actualizados.
