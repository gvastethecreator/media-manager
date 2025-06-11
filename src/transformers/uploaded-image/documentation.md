# Documentación de Transformadores de UploadedImage

## Descripción

Los transformadores de **UploadedImage** permiten mapear, serializar, deserializar y extender la entidad UploadedImage para distintos usos (UI, API, persistencia, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[UploadedImage (Prisma/Raw)] --> B[transformers.ts]
    B -->|toUploadedImageListItem| C[UploadedImageListItem]
    B -->|toUploadedImageCard| D[UploadedImageCard]
    B -->|parseUploadedImageSearchParams| E[Prisma.UploadedImageWhereInput]
    A --> F[transformer.ts]
    F -->|transformUploadedImage| G[UploadedImageComplete]
```

---

## Estructura y Relaciones

- **transformers.ts**: Mapeo, serialización y validación.
- **transformer.ts**: Transformador principal, entrada unificada para conversión y extensión.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { transformUploadedImage } from '@/transformers/uploaded-image/transformer';
import { toUploadedImageListItem } from '@/transformers/uploaded-image/transformers';

const uploaded = transformUploadedImage(rawUploadedImage);
const listItem = toUploadedImageListItem(uploaded);
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
