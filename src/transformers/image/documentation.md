# Documentación de Transformadores de Image

## Descripción

Los transformadores de **Image** permiten mapear, serializar, deserializar y extender la entidad Image para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Image (Prisma/Raw)] --> B[serializers.ts]
    B -->|toPrismaImage| C[Prisma.ImageCreateInput]
    B -->|fromPrismaImage| D[ImageComplete]
    B -->|extendImage| E[ImageComplete]
    B -->|validateImage| F[Validación Zod]
    B -->|toExtendedImage| G[ImageComplete]
    A --> H[mappers.ts]
    H -->|toImageListItem| I[ImageListItem]
    H -->|toImageCard| J[ImageCard]
    H -->|parseImageSearchParams| K[Prisma.ImageWhereInput]
    A --> L[transformer.ts]
    L -->|transformImage| D
    L -->|transformImageToWithStats| M[ImageWithStats]
    L -->|transformImageToExtended| N[ImageExtended]
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
import { transformImage, transformImageToWithStats } from '@/transformers/image/transformer';
import { toImageListItem } from '@/transformers/image/mappers';
import { toPrismaImage } from '@/transformers/image/serializers';

const image = transformImage(rawImage);
const imageStats = transformImageToWithStats(image);
const listItem = toImageListItem(image);
const prismaInput = toPrismaImage(image);
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
