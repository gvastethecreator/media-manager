### **Plan de Acción: Migración de Next.js a Vite + React**

> **🔄 MIGRACIÓN PARALELA**: En paralelo a esta migración, se está ejecutando la migración de Prisma a Drizzle ORM.
>
> **✅ PROGRESO DRIZZLE - MIGRACIÓN MASIVA ACELERADA**:
>
> - **ProfileService** ✅ COMPLETAMENTE MIGRADO (3/3 métodos)
> - **TagService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **AlbumService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **ConceptService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **PlaceService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **WorldItemService** ✅ COMPLETAMENTE MIGRADO (3/3 métodos principales)
> - **CollectionService** ✅ COMPLETAMENTE MIGRADO (3/3 métodos principales)
> - **CharacterService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **DocumentService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **AudioService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **File3DService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **JsonFileService** ✅ COMPLETAMENTE MIGRADO (2/2 métodos principales)
> - **ImageService** 🔄 PARCIALMENTE MIGRADO (getImages funcionando)
> - **FolderService** 🔄 PARCIALMENTE MIGRADO (GET /api/folders funcionando)
>
> **📊 TOTAL: 14 servicios migrados (12 completos + 2 parciales) - 56% del proyecto**
>
> **🚀 ACELERACIÓN**: +8 servicios completos en esta sesión (Place, WorldItem, Collection, Character, Document, Audio, File3D, JsonFile)
>
> Ver [docs/migration-drizzle/](docs/migration-drizzle/) para detalles completos.

#### **Fase 1: Backend - Conversión de Server Actions a API Routes**

1. **Análisis de Server Actions:**
    - [ ] Identificar todos los `server actions` relacionados con `profile`, `files`, `settings` y otras entidades.
    - [ ] Mapear cada acción a un endpoint de API RESTful (ej. `updateTheme` -> `PATCH /api/profile/theme`).

2. **Implementación de API Routes (`/src/server/routes/`):**
    - [ ] Crear el archivo `src/server/routes/profile.ts` para manejar las acciones del perfil de usuario.
        - [ ] Endpoint `GET /api/profile/active` (ya parece existir a través de `useActiveProfile`).
        - [ ] Endpoint `PATCH /api/profile/theme` para actualizar el tema.
    - [ ] Crear el archivo `src/server/routes/files.ts` para las operaciones de archivos.
        - [ ] `POST /api/files/toggle-favorite`
        - [ ] `POST /api/files/collections/add`
        - [ ] `POST /api/files/collections/remove`
        - [ ] `POST /api/files/tags/add`
        - [ ] `POST /api/files/tags/remove`
        - [ ] `POST /api/files/move`
        - [ ] `POST /api/files/copy`
        - [ ] `PATCH /api/files/:id/rename`
        - [ ] `POST /api/files/upload`
        - [ ] `POST /api/files/delete`

#### **Fase 2: Frontend - Migración de Lógica de Datos**

1. **Migrar `ProfileProvider` y `useProfileStore`:**
    - [ ] Localizar la acción `updateTheme` en `profile-store.ts`.
    - [ ] Crear un hook de mutación con TanStack Query (`useUpdateTheme`) que llame al endpoint `PATCH /api/profile/theme`.
    - [ ] Reemplazar la lógica del server action en el store de Zustand (`useProfileStore`) para que use el nuevo hook de mutación.
    - [ ] Asegurar que `ProfileProvider` siga funcionando correctamente con el store actualizado.

2. **Migrar `FileContext`:**
    - [ ] Crear un archivo (`src/lib/api/files.ts`) para los hooks de API de archivos.
    - [ ] Implementar hooks de mutación (con TanStack Query) para cada operación de archivo definida en la Fase 1.
        - `useToggleFavorite`, `useAddToCollection`, etc.
    - [ ] Integrar estos hooks en los métodos correspondientes de `FileProvider`.
    - [ ] Reemplazar la lógica local/stub con llamadas a `mutation.mutate()` o `mutation.mutateAsync()`.
    - [ ] Implementar actualizaciones optimistas para mejorar la experiencia de usuario.

#### **Fase 3: Migración de Componentes y Vistas**

1. **Actualizar Componentes de Cards:**
    - [ ] Revisar componentes como `FileCard`, `ImageCard`, etc.
    - [ ] Asegurar que los botones (favorito, añadir a colección, etc.) usen las nuevas funciones del `FileContext` basadas en API.

2. **Migrar Vistas (`/src/components/views/`):**
    - [ ] Analizar cada vista para encontrar dependencias de datos.
    - [ ] Reemplazar cualquier obtención de datos o mutación directa (que no use los contextos/stores ya migrados) por llamadas a los nuevos hooks de API.

3. **Migrar Componentes de `Settings`:**
    - [ ] Crear los API routes necesarios para la configuración.
    - [ ] Crear los hooks de TanStack Query para interactuar con los nuevos endpoints.
    - [ ] Actualizar los componentes de la página de configuración para que usen los nuevos hooks.

#### **Fase 4: Limpieza y Verificación Final**

1. **Revisar Providers y Contextos Restantes:**
    - [ ] Auditar todos los providers para asegurar que no queden dependencias de `server actions`.
2. **Eliminar Código Obsoleto:**
    - [ ] Borrar los archivos de `server actions` que ya no se usen.
    - [ ] Limpiar cualquier tipo o utilidad relacionada exclusivamente con `server actions`.
3. **Verificación Completa:**
    - [ ] Ejecutar todos los tests (unitarios y e2e).
    - [ ] Realizar una prueba de regresión manual de toda la aplicación.
