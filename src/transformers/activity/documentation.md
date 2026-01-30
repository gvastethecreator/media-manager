# Documentación de Transformadores de Activity

## Descripción

Los transformadores de **Activity** permiten mapear, serializar, deserializar y extender la entidad Activity para distintos usos (UI, API, persistencia, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Activity (Drizzle/Local)] --> B[mappers.ts]
    B -->|mapCreateActivityDataToDrizzle| C[DrizzleCreateActivityData]
    B -->|mapActivityFiltersToDrizzle| D[DrizzleFindManyArgs]
    B -->|generateActivityDescription| E[String]
    A --> F[serializers.ts]
    F -->|extendActivity| G[Activity]
    F -->|extendActivities| H[Activity[]]
    F -->|getActivityEmoji| I[String]
    F -->|getActivityColor| J[String]
    F -->|getActivityCategory| K[String]
    F -->|parseActivityMetadata| L[ActivityMetadata]
    F -->|serializeActivity| M[Object]
    F -->|deserializeActivity| N[Activity]
    F -->|serializeActivityListResponse| O[Object]

    A --> P[validators.ts]
    P -->|validateCreateActivityData| Q[CreateActivitySchemaType]
    P -->|validateActivity| R[ActivitySchemaType]
    P -->|validateActivityFilters| S[ActivityFiltersSchemaType]
    P -->|normalizeActivityFilters| T[ActivityFilters]

    A --> U[schema.ts]
    U -->|activitySchema| V[ZodSchema]
    U -->|createActivitySchema| W[ZodSchema]
    U -->|activityFiltersSchema| X[ZodSchema]
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
