# 📁 Entidad Folder

## Descripción

La entidad `Folder` representa carpetas o directorios virtuales para organizar imágenes, videos, notas y otros recursos. Permite jerarquía, agrupación y navegación estructurada.

## Estructura

```mermaid
graph TD
    A[Folder Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[types.ts]
    C --> C1[mappers.ts]
    C --> C2[serializers.ts]
    C --> C3[transformer.ts]
    D --> D1[documentation.md]
```

## Tipos principales

- `FolderBase`, `FolderComplete`, `FolderExtended`, `FolderExtendedComplete`
- Filtros: `FolderFilters`, `FolderSearchOptions`, `FolderSearchResult`

## Ejemplo de uso

```typescript
import { createFolder, updateFolder, searchFolders } from '@/transformers/folder';

const nuevaCarpeta = await createFolder({ name: 'Proyectos', parentId: null });
const carpetas = await searchFolders({ filters: { search: 'Proyectos' } });
await updateFolder(nuevaCarpeta.id, { name: 'Proyectos 2025' });
```

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createFolder()
    
    Transformer->>DB: prisma.folder.create()
    DB-->>Transformer: Folder
    Transformer-->>API: transformFolder()
    API-->>Client: FolderComplete
```

## Mejores prácticas

- Usar siempre los tipos canónicos (`FolderBase`, `FolderComplete`).
- Validar los datos antes de crear/actualizar (`validateFolder`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

## Integración

Las carpetas pueden contener:

- Imágenes, videos, subcarpetas, notas, etc.

Al eliminar una carpeta, revisar las relaciones para evitar referencias huérfanas.

---

> Última actualización: 2025-06-10
