# 🃏 Wildcards Actions

## Descripción

Las Server Actions de Wildcards proporcionan la capa de comunicación entre la interfaz de usuario y la capa de servicios para gestionar comodines (wildcards). Estos comodines son elementos versátiles que se pueden utilizar en prompts, filtros personalizados y generación dinámica de contenido.

## Funciones disponibles

### Operaciones CRUD básicas

- `createWildcard` - Crea un nuevo wildcard
- `updateWildcard` - Actualiza un wildcard existente
- `deleteWildcard` - Elimina un wildcard
- `getWildcard` - Obtiene un wildcard específico por ID
- `getWildcards` - Obtiene una lista de todos los wildcards

### Operaciones de jerarquía

- `getRootWildcards` - Obtiene los wildcards de nivel superior (sin padre)
- `getChildWildcards` - Obtiene los wildcards hijos de un wildcard específico

### Operaciones con relaciones

- `addImageToWildcard` - Asocia una imagen a un wildcard
- `addTagToWildcard` - Asocia una etiqueta a un wildcard
- `removeImageFromWildcard` - Elimina la asociación entre una imagen y un wildcard
- `removeTagFromWildcard` - Elimina la asociación entre una etiqueta y un wildcard
- `getWildcardImages` - Obtiene todas las imágenes asociadas a un wildcard
- `getWildcardTags` - Obtiene todas las etiquetas asociadas a un wildcard

### Operaciones estadísticas

- `getWildcardStats` - Obtiene estadísticas de uso y relaciones de un wildcard

## Estructura de respuesta

Las Server Actions de Wildcards devuelven directamente las entidades transformadas, no objetos con propiedades `success`, `data` o `error`. Esto significa que:

1. Si la operación es exitosa, se devuelve el objeto o array de objetos solicitados
2. Si hay un error, se lanzará una excepción que debe ser capturada por el cliente

Por ejemplo:

```typescript
// ✅ Correcto: La acción devuelve directamente el wildcard
const wildcard = await getWildcard(id);
if (wildcard) {
  // Procesar wildcard
}

// ❌ Incorrecto: La acción no devuelve un objeto con success/data/error
const response = await getWildcard(id);
if (response.success && response.data) { // Esto causará error
  // ...
}
```

## Ejemplo de uso

```typescript
"use client";

import { createWildcard, getWildcards } from "@/app/actions/wildcards/wildcard.actions";
import { useState, useEffect } from "react";
import { extendWildcards } from "@/transformers/wildcard";

export function WildcardManager() {
  const [wildcards, setWildcards] = useState([]);

  useEffect(() => {
    async function loadWildcards() {
      try {
        const response = await getWildcards();
        const extendedWildcards = extendWildcards(response);
        setWildcards(extendedWildcards);
      } catch (error) {
        console.error("Error cargando wildcards:", error);
      }
    }

    loadWildcards();
  }, []);

  async function handleCreate(data) {
    try {
      const newWildcard = await createWildcard(data);
      setWildcards(prev => [...prev, newWildcard]);
    } catch (error) {
      console.error("Error creando wildcard:", error);
    }
  }

  return (
    // Componente UI
  );
}
```

## Revalidación de caché

Todas las acciones que modifican datos (create, update, delete) invocan automáticamente `revalidatePath()` para actualizar la caché de Next.js en las siguientes rutas:

- `/wildcards` - Vista principal de wildcards
- `/settings/wildcards` - Panel de configuración de wildcards
- Rutas dinámicas como `/wildcards/{id}` cuando corresponde

## Notas importantes

- No importar tipos de Prisma directamente en componentes cliente
- Usar siempre los transformadores y utilidades de la carpeta `transformers/wildcard`
- Las operaciones asíncronas deben siempre estar contenidas en bloques try/catch
- Para jerarquías complejas, considerar utilizar las utilidades de la carpeta `utils/wildcard`
