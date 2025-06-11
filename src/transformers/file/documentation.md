# Documentación de Transformadores de File

## Descripción

Los transformadores de **File** permiten mapear, serializar, deserializar y extender la entidad File para distintos usos (UI, API, persistencia, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[File (Prisma/Raw)] --> B[mappers.ts]
    B -->|toFileListItem| C[FileListItem]
    B -->|toFileCard| D[FileCard]
    B -->|parseFileSearchParams| E[Prisma.FileWhereInput]
    A --> F[serializers.ts]
    F -->|transformFile| G[FileComplete]
```

---

## Estructura y Relaciones

- **mappers.ts**: Mapeo a formatos de UI y búsqueda.
- **serializers.ts**: Serialización/deserialización, validación y extensión.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { transformFile } from '@/transformers/file/serializers';
import { toFileListItem } from '@/transformers/file/mappers';

const file = transformFile(rawFile);
const listItem = toFileListItem(file);
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
