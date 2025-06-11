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
    B --> B2[base.ts]
    B --> B3[extended.ts]
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
const notas = await searchNotes({ filters: { search: 'Idea' } });
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
    Transformer->>DB: prisma.note.create()
    DB-->>Transformer: Note
    Transformer-->>API: transformNote()
    API-->>Client: NoteComplete
```

## Mejores prácticas

- Usar siempre los tipos canónicos (`NoteCreateInput`, `NoteUpdateInput`, `NoteComplete`).
- Validar los datos antes de crear/actualizar (`validateNote`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

## Integración

Las notas pueden asociarse a:

- Imágenes, videos, álbumes, colecciones
- Personajes, conceptos, prompts, propiedades, grupos, etc.

Al eliminar una nota, revisar las relaciones para evitar referencias huérfanas.

---

> Última actualización: 2025-06-10
