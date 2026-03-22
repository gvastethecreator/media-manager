# 🕒 Entidad QueueJob

## Descripción

La entidad `QueueJob` representa trabajos encolados o tareas asíncronas dentro del sistema, como procesamiento de imágenes, generación de miniaturas, tareas de IA, etc.

---

## Estructura

```mermaid
graph TD
    A[QueueJob Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[types.ts]
    B --> B2[schema.ts]
    C --> C1[queue-job-transformers.ts]
    D --> D1[documentation.md]
```

---

## Tipos principales

- `QueueJobBase`, `QueueJobComplete`, `QueueJobCreateInput`, `QueueJobUpdateInput`
- Filtros: `QueueJobFilters`, `QueueJobSearchOptions`, `QueueJobSearchResult`

---

## Ejemplo de uso

```typescript
import { createQueueJob, updateQueueJob, searchQueueJobs } from '@/transformers/queue-job/queue-job-transformers';

const job = await createQueueJob({ type: 'thumbnail', status: 'pending' });
const jobs = await searchQueueJobs({ filters: { status: 'pending' } });
await updateQueueJob(job.id, { status: 'completed' });
```

---

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createQueueJob()

    Transformer->>DB: db.queueJob.create()
    DB-->>Transformer: QueueJob
    Transformer-->>API: transformQueueJob()
    API-->>Client: QueueJobComplete
```

---

## Mejores prácticas

- Usar siempre los tipos canónicos (`QueueJobCreateInput`, `QueueJobUpdateInput`, `QueueJobComplete`).
- Validar los datos antes de crear/actualizar (`validateQueueJob`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

---

## Integración

Los QueueJobs pueden asociarse a:

- Imágenes, álbumes, colecciones, procesos automáticos, etc.

Al eliminar un QueueJob, revisar las relaciones para evitar referencias huérfanas.

---

> Última actualización: 2025-06-10
