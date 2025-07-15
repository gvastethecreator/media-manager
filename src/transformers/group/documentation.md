# Documentación de Transformadores de Group

## Descripción

Los transformadores de **Group** permiten mapear, serializar, deserializar y extender la entidad Group para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Group (Drizzle/Raw)] --> B[serializers.ts]
    B -->|toDrizzleGroup| C[Drizzle.GroupCreateInput]
    B -->|fromDrizzleGroup| D[GroupComplete]
    B -->|extendGroup| E[GroupComplete]
    B -->|validateGroup| F[Validación Zod]
    B -->|toExtendedGroup| G[GroupComplete]
    A --> H[mappers.ts]
    H -->|toGroupListItem| I[GroupListItem]
    H -->|toGroupCard| J[GroupCard]
    H -->|parseGroupSearchParams| K[Drizzle.GroupWhereInput]
    A --> L[transformer.ts]
    L -->|transformGroup| D
    L -->|transformGroupToWithStats| M[GroupWithStats]
    L -->|transformGroupToExtended| N[GroupExtended]
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
import { transformGroup, transformGroupToWithStats } from '@/transformers/group/transformer';
import { toGroupListItem } from '@/transformers/group/mappers';
import { toDrizzleGroup } from '@/transformers/group/serializers';

const group = transformGroup(rawGroup);
const groupStats = transformGroupToWithStats(group);
const listItem = toGroupListItem(group);
const DrizzleInput = toDrizzleGroup(group);
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

- Fecha: 2024-06-10
- Estado: ✅ Auditado, sin errores TS, documentación y diagramas actualizados.
