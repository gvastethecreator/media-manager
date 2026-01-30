# Documentación de Transformadores de Metadata

## Descripción

Los transformadores de **Metadata** permiten mapear, serializar, deserializar y extender la entidad Metadata para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Metadata (Drizzle/Raw)] --> B[mappers.ts]
    B -->|toMetadataListItem| C[MetadataListItem]
    B -->|toMetadataCard| D[MetadataCard]
    B -->|parseMetadataSearchParams| E[Drizzle.MetadataWhereInput]
```

---

## Estructura y Relaciones

- **mappers.ts**: Mapeo a formatos de UI y búsqueda.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { toMetadataListItem } from '@/transformers/metadata/mappers';

const listItem = toMetadataListItem(rawMetadata);
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
