# Documentación de Transformadores de Task

## Descripción

Los transformadores de **Task** permiten mapear, serializar, deserializar y extender la entidad Task para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Task (Prisma/Raw)] --> B[serializers.ts]
    B -->|toPrismaTask| C[Prisma.TaskCreateInput]
    B -->|fromPrismaTask| D[TaskComplete]
    B -->|extendTask| E[TaskComplete]
    B -->|validateTask| F[Validación Zod]
    B -->|toExtendedTask| G[TaskComplete]
    A --> H[transformer.ts]
    H -->|transformTask| D
    H -->|transformTaskToWithStats| M[TaskWithStats]
    H -->|transformTaskToExtended| N[TaskExtended]
```

---

## Estructura y Relaciones

- **serializers.ts**: Serialización/deserialización, validación y extensión.
- **transformer.ts**: Transformador principal, entrada unificada para conversión y extensión.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { transformTask, transformTaskToWithStats } from '@/transformers/task/transformer';
import { toPrismaTask } from '@/transformers/task/serializers';

const task = transformTask(rawTask);
const taskStats = transformTaskToWithStats(task);
const prismaInput = toPrismaTask(task);
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
