# 🔄 Workflow Actions

> ✅ **FUNCIONALIDAD ACTIVA** - Módulo completamente funcional

## 📁 Estructura

```
src/app/actions/workflow/
├── workflow.actions.ts   # Server Actions principales
├── crud.actions.ts      # Operaciones CRUD (si existe)
└── README.md           # Esta documentación
```

## 🔧 Funciones Disponibles

### Consultas (GET)

- `getWorkflows()` - Obtener todos los workflows ordenados por fecha de creación
- `getWorkflowById(id: string)` - Obtener workflow específico por ID

### Mutaciones (CREATE/UPDATE/DELETE)

- `createWorkflow(data: WorkflowFormData)` - Crear nuevo workflow
- `updateWorkflow(id: string, data: WorkflowFormData)` - Actualizar workflow existente
- `deleteWorkflow(id: string)` - Eliminar workflow

## 📝 Tipos TypeScript

### WorkflowFormData

```typescript
interface WorkflowFormData {
  name?: string;
  filePath?: string;
  content?: string;
}
```

## 🛡️ Manejo de Errores

- **Sistema unificado**: Usa `toServiceError` para manejo consistente de errores
- **Errores Prisma**: Mapeo automático de códigos Prisma a ServiceError
- **Logging**: Registro automático de errores con contexto
- **Validación**: Valores por defecto para campos opcionales

### Códigos de Error Comunes

- `ENTITY_NOT_FOUND` - Workflow no encontrado
- `DATABASE_QUERY_ERROR` - Error en consulta de base de datos
- `UNIQUE_CONSTRAINT_VIOLATION` - Violación de restricción única

## 🔄 Revalidación de Caché

- **Crear/Actualizar**: Revalida `/workflow` y `/workflow/[id]`
- **Eliminar**: Revalida `/workflow`

## 🏗️ Transformers

- `fromPrismaWorkflow()` - Convierte datos Prisma a formato UI
- `fromPrismaWorkflows()` - Convierte array de datos Prisma

## 📊 Estado de Completitud

| Aspecto | Estado | Notas |
|---------|--------|-------|
| ✅ Server Actions | Completo | Todas las operaciones CRUD |
| ✅ Manejo de Errores | Completo | Sistema unificado |
| ✅ Tipos TypeScript | Completo | Sin errores de compilación |
| ✅ Transformers | Completo | Conversión Prisma ↔ UI |
| ✅ Revalidación | Completo | Caché Next.js |
| ✅ Logging | Completo | Errores registrados |

## 🔗 Relaciones

- **Base de datos**: Modelo `Workflow` en Prisma
- **Transformers**: `src/transformers/workflow/`
- **Tipos**: `src/types/entities/workflow/`
- **Errores**: `src/utils/errors/service-errors.ts`

---

**Estado**: ✅ Completamente funcional | ✅ Sin errores TypeScript
