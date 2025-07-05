# 📷 Entidad Image

## Descripción

La entidad `Image` representa imágenes almacenadas en el sistema, incluyendo metadatos, relaciones y atributos multimedia. Permite asociar imágenes a álbumes, colecciones, personajes, lugares, notas, etc.

---

## Estructura

```mermaid
graph TD
    A[Image Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[types.ts]
    B --> B2[base.ts]
    B --> B3[complete.ts]
    B --> B4[extended.ts]
    C --> C1[mappers.ts]
    C --> C2[serializers.ts]
    C --> C3[transformer.ts]
    D --> D1[documentation.md]
```

---

## Tipos principales

- `ImageBase`, `ImageComplete`, `ImageCreateInput`, `ImageUpdateInput`
- Filtros: `ImageFilters`, `ImageSearchOptions`, `ImageSearchResult`

---

## Ejemplo de uso

```typescript
import { createImage, updateImage, searchImages } from '@/transformers/image';

const nuevaImagen = await createImage({ name: 'Paisaje', url: '/uploads/paisaje.jpg' });
const imagenes = await searchImages({ filters: { search: 'Paisaje' } });
await updateImage(nuevaImagen.id, { description: 'Un paisaje hermoso.' });
```

---

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createImage()
    API->>Transformer: mapCreateImageDataToPrisma()
    
    DB-->>Transformer: Image
    Transformer-->>API: transformImage()
    API-->>Client: ImageComplete
```

---

## Mejores prácticas

- Usar siempre los tipos canónicos (`ImageCreateInput`, `ImageUpdateInput`, `ImageComplete`).
- Validar los datos antes de crear/actualizar (`validateImage`).
- Usar los mapeadores para relaciones complejas.
- Mantener la documentación y diagramas actualizados.

---

## Integración

Las imágenes pueden asociarse a:

- Álbumes, colecciones, personajes, lugares, notas, conceptos, prompts, grupos, etc.

Al eliminar una imagen, revisar las relaciones para evitar referencias huérfanas.

---

> Última actualización: 2025-06-10
