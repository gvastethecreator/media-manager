# ✅ Entidad Task

## Descripción

La entidad `Task` representa tareas, acciones o procesos pendientes/automatizados dentro del sistema. Permite modelar flujos de trabajo, acciones programadas, tareas de procesamiento, etc.

---

## Estructura

```mermaid
graph TD
    A[Task Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[base.ts]
    B --> B2[extended.ts]
    C --> C1[serializers.ts]
    C --> C2[transformer.ts]
    D --> D1[documentation.md]
```

---

## Tipos principales

- `TaskBase`, `TaskComplete`, `TaskCreateInput`, `TaskUpdateInput`
- Filtros: `TaskFilters`, `TaskSearchOptions`, `TaskSearchResult`

---

## Ejemplo de uso

```typescript
import { createTask, updateTask, searchTasks } from '@/transformers/task';

const nuevaTarea = await createTask({ name: 'Procesar imágenes', status: 'pending' });
const tareas = await searchTasks({ filters: { status: 'pending' } });
await updateTask(nuevaTarea.id, { status: 'completed' });
```

---

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createTask()
    API->>Transformer: mapCreateTaskDataToPrisma()
    Transformer->>DB: prisma.task.create()
    DB-->>Transformer: Task
    Transformer-->>API: transformTask()
    API-->>Client: TaskComplete
```

---

## Mejores prácticas

- Usar siempre los tipos canónicos (`TaskCreateInput`, `TaskUpdateInput`, `TaskComplete`).
- Validar los datos antes de crear/actualizar (`validateTask`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

---

## Integración

Las tareas pueden asociarse a:

- Imágenes, álbumes, colecciones, usuarios, procesos automáticos, etc.

Al eliminar una tarea, revisar las relaciones para evitar referencias huérfanas.

---

> Última actualización: 2025-06-10
