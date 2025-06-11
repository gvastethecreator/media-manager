# Uploaded Images View

Vista para gestionar imágenes cargadas por el usuario (`UploadedImagesView`).

## Filtros Locales

Se define el tipo `UploadedImageFilters` con las propiedades opcionales:

- `search`: texto para filtrar por nombre
- `type`: tipo de imagen (`UploadedImageType`)

## Mapeo a `FileItem`

`UploadedImageResult` se transforma a `FileItem` para ser consumido por la vista base.
Durante el mapeo se extrae el `mimeType` desde la metadata cuando es posible,
la metadata se asegura como cadena JSON y el `processingStatus` usa el fallback
`COMPLETED`.
