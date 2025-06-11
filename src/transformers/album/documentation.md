# Documentación de Transformadores de Album

## Descripción

Los transformadores de **Album** permiten mapear, serializar, deserializar y extender la entidad Album para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Album (Prisma/Raw)] --> B[serializers.ts]
    B -->|toPrismaAlbum| C[Prisma.AlbumCreateInput]
    B -->|fromPrismaAlbum| D[AlbumComplete]
    B -->|extendAlbum| E[AlbumComplete]
    B -->|validateAlbum| F[Validación Zod]
    B -->|toExtendedAlbum| G[AlbumComplete]
    A --> H[mappers.ts]
    H -->|toAlbumListItem| I[AlbumListItem]
    H -->|toAlbumCard| J[AlbumCard]
    H -->|parseAlbumSearchParams| K[Prisma.AlbumWhereInput]
    A --> L[transformer.ts]
    L -->|transformAlbum| D
    L -->|transformAlbumToWithStats| M[AlbumWithStats]
    L -->|transformAlbumToExtended| N[AlbumExtended]
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
import { transformAlbum, transformAlbumToWithStats } from '@/transformers/album/transformer';
import { toAlbumListItem } from '@/transformers/album/mappers';
import { toPrismaAlbum } from '@/transformers/album/serializers';

const album = transformAlbum(rawAlbum);
const albumStats = transformAlbumToWithStats(album);
const listItem = toAlbumListItem(album);
const prismaInput = toPrismaAlbum(album);
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
