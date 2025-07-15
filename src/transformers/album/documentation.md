# Documentación de Transformadores de Album

## Descripción

Los transformadores de **Album** permiten mapear, serializar, deserializar y extender la entidad Album para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos Drizzle y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Album (Drizzle/Local)] --> B[mappers.ts]
    B -->|toAlbumWithStats| C[AlbumWithStats]
    B -->|mapCreateAlbumDataToDrizzle| D[DrizzleCreateAlbumData]
    B -->|mapAlbumFiltersToDrizzle| E[DrizzleFindManyArgs]

    A --> F[serializers.ts]
    F -->|extendAlbum| G[AlbumWithStats]
    F -->|extendAlbums| H[AlbumWithStats[]]
    F -->|serializeAlbum| I[Record<string, unknown>]
    F -->|deserializeAlbum| J[AlbumWithStats]

    A --> K[validators.ts]
    K -->|validateCreateAlbumData| L[CreateAlbumInput]
    K -->|validateUpdateAlbumData| M[UpdateAlbumInput]
    K -->|isValidAlbum| N[boolean]
    K -->|normalizeAlbumFilters| O[NormalizedFilters]

    A --> P[schema.ts]
    P -->|albumBaseSchema| Q[ZodSchema]
    P -->|albumWithStatsSchema| R[ZodSchema]
    P -->|albumFiltersSchema| S[ZodSchema]
```

---

## Estructura y Relaciones

- **mappers.ts**: Mapeo a formatos Drizzle, conversión de datos y filtros.
- **serializers.ts**: Serialización/deserialización, validación y extensión.
- **validators.ts**: Validadores usando esquemas Zod y tipos locales.
- **schema.ts**: Esquemas Zod para validación y tipos derivados.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { toAlbumWithStats, mapCreateAlbumDataToDrizzle } from '@/transformers/album/mappers';
import { extendAlbum, serializeAlbum } from '@/transformers/album/serializers';
import { validateCreateAlbumData } from '@/transformers/album/validators';

// Crear álbum con estadísticas
const albumWithStats = toAlbumWithStats(album, counts);

// Mapear datos para Drizzle
const drizzleData = mapCreateAlbumDataToDrizzle(createData);

// Extender álbum
const extendedAlbum = extendAlbum(album);

// Serializar para API
const serialized = serializeAlbum(albumWithStats);

// Validar datos de creación
const validation = validateCreateAlbumData(inputData);
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
