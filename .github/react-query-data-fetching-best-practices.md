# React Query: Mejores Prácticas

- **useQuery para fetch, useMutation para mutaciones:** Usar hooks de React Query para imágenes y operaciones.
- **Manejo de errores y loading:** Skeletons y gestión visual de errores.
- **Caché agresiva:** Configura `staleTime` y `cacheTime` para thumbnails e imágenes.
- **Invalidación y revalidación:** Estrategias tras edición/eliminación.
- **Keys jerárquicas:** Ejemplo: `['images', { albumId, filters }]`.
- **Paginación e infinite loading:** Usa `useInfiniteQuery` para galerías.
- **Prefetching:** Precarga imágenes anticipando interacción.
- **Integración con Server Actions:** Combina React Query y Server Actions.
- **Hooks personalizados:** Ej: `useImageUpload`, `useImageMetadata`.
- **Optimistic updates:** Actualizaciones optimistas para favoritos, etiquetas, etc.
- **Suspense mode:** Usa suspense de React Query con React 19.
- **Configuración de QueryClient:** Defaults específicos para imágenes.
- **DevTools:** Usa React Query DevTools en desarrollo.
- **Dependent queries:** Carga detalles tras obtener colecciones.
- **Indicadores de background fetching:** Muestra refetch sutil en UI.

```mermaid
graph TD
    A[React Query] --> B[Fetching]
    A --> C[Mutations]
    A --> D[Cache Management]
    B --> B1[Images List]
    B --> B2[Image Details]
    B --> B3[Album Contents]
    C --> C1[Image Upload]
    C --> C2[Metadata Edit]
    C --> C3[Image Delete]
    D --> D1[Query Invalidation]
    D --> D2[Optimistic Updates]
    D --> D3[Prefetching]
    style A fill:#d4f1f9
    style B fill:#ffecb3
    style C fill:#e1bee7
    style D fill:#c8e6c9
```
