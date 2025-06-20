# 📋 Task Actions - DESHABILITADO

> ⚠️ **FUNCIONALIDAD DESHABILITADA** - El modelo `ScheduledTask` no existe en el esquema de Prisma

## 📁 Estructura

```
src/app/actions/tasks/
├── index.ts              # Exportaciones principales (MOCK)
├── control.actions.ts    # Control de tareas (MOCK)
├── crud.actions.ts       # Operaciones CRUD (MOCK)
├── process.actions.ts    # Procesamiento (MOCK)
├── query.actions.ts      # Consultas (MOCK)
├── stats.actions.ts      # Estadísticas (MOCK)
└── README.md            # Esta documentación
```

## 🚨 Estado Actual

**TODOS LOS ARCHIVOS SON MOCKS** que lanzan errores indicando que la funcionalidad está deshabilitada.

### Razón de la Deshabilitación

- El modelo `ScheduledTask` no existe en `prisma/schema.prisma`
- Las funciones están implementadas como mocks para evitar errores de importación
- Todas las funciones lanzan: `'Task functionality disabled - ScheduledTask model not implemented'`

## 🔧 Funciones Disponibles (MOCK)

### Control (`control.actions.ts`)

- `startTask()` - Iniciar tarea
- `pauseTask()` - Pausar tarea
- `cancelTask()` - Cancelar tarea
- `resumeTask()` - Reanudar tarea
- `stopTask()` - Detener tarea
- `restartTask()` - Reiniciar tarea

### CRUD (`crud.actions.ts`)

- `createTask()` - Crear tarea
- `updateTask()` - Actualizar tarea
- `deleteTask()` - Eliminar tarea
- `getTasks()` - Obtener tareas
- `getTask()` - Obtener tarea por ID

### Procesamiento (`process.actions.ts`)

- `processNextTask()` - Procesar siguiente tarea
- `processTaskById()` - Procesar tarea específica
- `executeTask()` - Ejecutar tarea
- `retryTask()` - Reintentar tarea

### Consultas (`query.actions.ts`)

- `getTasks()` - Obtener tareas con filtros
- `getTaskById()` - Obtener tarea por ID
- `getPendingTasks()` - Obtener tareas pendientes
- `searchTasks()` - Buscar tareas
- `getTasksByStatus()` - Obtener por estado
- `getTasksByType()` - Obtener por tipo

### Estadísticas (`stats.actions.ts`)

- `getTaskStats()` - Estadísticas generales
- `getTaskCounts()` - Contadores de tareas
- `getTaskMetrics()` - Métricas de rendimiento
- `getTaskPerformance()` - Rendimiento de tareas

## 🛠️ Para Habilitar la Funcionalidad

1. **Crear el modelo en Prisma:**

```prisma
model ScheduledTask {
  id          String   @id @default(cuid())
  name        String
  description String?
  status      TaskStatus @default(PENDING)
  type        String
  payload     Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  scheduledAt DateTime?
  startedAt   DateTime?
  completedAt DateTime?
  error       String?

  @@map("scheduled_tasks")
}

enum TaskStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
  PAUSED
}
```

2. **Ejecutar migración:**

```bash
pnpm prisma migrate dev --name add-scheduled-task
```

3. **Implementar las funciones reales** en cada archivo de actions

4. **Actualizar los tipos** en `src/types/entities/task/`

## 📝 Tipos TypeScript

Los tipos están definidos en `src/types/entities/task/types.ts` pero pueden necesitar actualización cuando se implemente la funcionalidad real.

---

**Estado**: ✅ Errores TypeScript corregidos | ❌ Funcionalidad deshabilitada
