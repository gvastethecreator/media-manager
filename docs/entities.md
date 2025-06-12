# Entidades del Sistema

Este proyecto maneja una serie de entidades inspiradas en el schema de Prisma. Cada entidad cuenta con sus propios tipos, transformadores, servicios y stores.

Un diagrama general de relaciones se encuentra en [`entities-relations.mmd`](./entities-relations.mmd).

Las entidades principales son:

- Activity
- Album
- Character
- Collection
- Concept
- Favorite
- File
- Folder
- Group
- Image
- Note
- Place
- Property
- Prompt
- Tag
- User
- Video
- Wildcard
- World Item

Para cada una de ellas existe documentación detallada dentro de `src/transformers/<entidad>/README.md` o `documentation.md`.

Desde la última actualización todos los stores se conectan a las Server Actions para sus operaciones CRUD. En particular, el store de **lugares** ahora carga los datos mediante `getPlaces` y `getPlace`, sin recurrir a `fetch`.

Las vistas de **characters**, **places** y **world-items** obtienen su configuración visual con Server Actions. Los videos también gestionan su configuración visual mediante Server Actions.

La vista de **búsqueda** utiliza la server action `searchImages` para obtener resultados sin depender de rutas API. La sección **Entities Cards** en los ajustes permite configurar efectos visuales para personajes, lugares y objetos del mundo.

El preloader de entidades carga datos exclusivamente con Server Actions, eliminando por completo el respaldo a rutas `/api`. El gestor unificado de archivos utiliza Server Actions para cargar imágenes de carpetas, colecciones y etiquetas. El store de **imágenes** ahora emplea `getImage` y `getImages` directamente desde Server Actions.

Los stores de favoritos, objetos del mundo y archivos dejaron de importar tipos de Prisma, previniendo errores en el cliente. Se verificó cada módulo de configuración; todos usan Server Actions. Las seeds de la base de datos ofrecen varios perfiles, carpetas y objetos de ejemplo para iniciar rápidamente.
