# 🎬 Videos Actions

## Descripción

Las Server Actions de Videos gestionan todas las operaciones relacionadas con archivos de video en el sistema: creación, actualización, eliminación, obtención, estadísticas y configuración visual. Todas las acciones siguen el patrón moderno de respuesta directa (sin wrappers) y validación estricta con Zod.

## Funciones disponibles

- `createVideo` - Crea un nuevo video
- `deleteVideo` - Elimina un video existente
- `findVideos` - Busca videos con filtros avanzados
- `getVideo` - Obtiene un video por ID
- `getVideoStats` - Obtiene estadísticas de un video
- `moveVideoToFolder` - Mueve un video a otra carpeta
- `setVideoVisibility` - Cambia la visibilidad (público/privado)
- `toggleVideoFavorite` - Marca/desmarca como favorito
- `updateVideo` - Actualiza propiedades y metadatos
- `getVideoVisualConfig` - Obtiene configuración visual
- `updateVideoVisualConfig` - Actualiza configuración visual

## 🧩 Patrón de Respuesta

> Todas las acciones devuelven directamente la entidad, array o valor esperado. Los errores se lanzan como excepciones estándar.

```typescript
// Ejemplo: obtener un video
const video = await getVideo('video-id');
if (video) {
  // Usar video
} else {
  // No encontrado
}

// Ejemplo: crear un video
try {
  const nuevo = await createVideo({ ... });
  // Usar nuevo video
} catch (error) {
  // Manejar error
}
```

## Ejemplo de integración

```typescript
import { getVideo, updateVideo } from '@/app/actions/videos/video.actions';
import { extendVideo } from '@/transformers/video';

const video = await getVideo('id');
if (video) {
  const extended = extendVideo(video);
  // Usar extended en la UI
}

const updated = await updateVideo('id', { title: 'Nuevo título' });
```

## Validación y Tipos

- Todos los inputs se validan con Zod antes de persistir.
- Los tipos canónicos están en `@/types/entities/video`.
- Los transformers están en `@/transformers/video`.

## Buenas prácticas

- No usar wrappers tipo `{ success, data, error }`.
- Manejar errores con try/catch en el consumidor.
- Validar siempre los datos antes de mutar.
- Usar funciones de extensión (`extendVideo`) para enriquecer la entidad en UI.

---

> Última actualización: 2025-06-19
> Responsable: migración y documentación de acciones de video
