# 📝 Entidad Note

## Descripción

La entidad `Note` representa notas en el sistema, asociables a imágenes, personajes, conceptos y más. Permite organización, documentación y recordatorios avanzados.

## Estructura

```mermaid
graph TD
    A[Note Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[types.ts]
    C --> C1[mappers.ts]
    C --> C2[serializers.ts]
    C --> C3[transformer.ts]
    D --> D1[documentation.md]
```

## Tipos principales

- `NoteBase`, `NoteComplete`, `NoteCreateInput`, `NoteUpdateInput`
- Filtros: `NoteFilters`, `NoteSearchOptions`, `NoteSearchResult`

## Ejemplo de uso

```typescript
import { createNote, updateNote, searchNotes } from '@/transformers/note';

const nuevaNota = await createNote({ title: 'Idea', content: 'Texto', category: 'general' });
const notas = await searchNotes({ filters: { searchQuery: 'Idea' } });
await updateNote(nuevaNota.id, { content: 'Actualizado' });
```

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createNote()
    API->>Transformer: mapCreateNoteDataToPrisma()

    DB-->>Transformer: Note
    Transformer-->>API: transformNote()
    API-->>Client: NoteComplete
```

## Mejores prácticas

- Usar siempre los tipos canónicos (`NoteCreateInput`, `NoteUpdateInput`, `NoteComplete`).
- Validar los datos antes de crear/actualizar (`validateNote`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

## ⚠️ Advertencia

**No importar tipos de base de datos legacy. Usar solo los tipos de `types.ts`.**
