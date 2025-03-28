# Plan de migración de Entity Cards a componentes específicos por entidad

## Contexto
Actualmente estamos utilizando componentes genéricos de entity-card para mostrar diferentes entidades. Necesitamos migrar a componentes específicos para cada tipo de entidad con un diseño inspirado en cartas Magic.

## Tareas generales

1. ✅ Crear estructura para el nuevo sistema de componentes
   - ✅ Crear carpeta para componentes de tarjetas específicas por entidad

2. ✅ Implementar FolderCard como primer componente
   - ✅ Diseñar e implementar componente inspirado en cartas Magic para carpetas
   - ✅ Incluir los últimos 6 thumbnails de imágenes de la carpeta
   - ✅ Mostrar toda la información relevante de la entidad Folder
   - ✅ Mejorar con iconos de Lucide y optimizar UI

3. ✅ Actualizar vistas para usar nuevos componentes
   - ✅ Actualizar folders-view para usar el nuevo FolderCard
   - ✅ Eliminar referencias a EntityCard/EntityCardDev

4. ✅ Extender a otras entidades principales
   - ✅ Implementar AlbumCard y actualizar albums-view
   - ✅ Implementar CollectionCard y actualizar collections-view
   - ✅ Implementar TagCard y actualizar tags-view
   - ✅ Mejorar consistencia con iconos de Lucide en todos los componentes
   - ✅ Corregir problemas con thumbnails en server actions
   - ✅ Implementar CharacterCard y actualizar characters-view
   - ✅ Implementar PlaceCard y actualizar places-view
   - ✅ Crear componentes auxiliares para tarjetas (CardContainer, CardHeader)
   - ✅ Implementar WorldItemCard
   - ✅ Implementar ConceptCard
   - ✅ Implementar PromptCard
   - ✅ Implementar NoteCard

5. ✅ Tareas finales
   - ✅ Verificar que todas las vistas estén usando los nuevos componentes
   - ✅ Pruebas de rendimiento y optimización
   - ✅ Documentación de los nuevos componentes

## Estructura de componentes

```
/components
  /cards
    /folder-card ✅
      index.ts ✅
      folder-card.tsx ✅
      folder-card-content.tsx ✅
      folder-card-header.tsx ✅
      folder-card-footer.tsx ✅ (mejorado con iconos Lucide)
      folder-card-images.tsx ✅
    /album-card ✅
      index.ts ✅
      album-card.tsx ✅
      album-card-content.tsx ✅
      album-card-header.tsx ✅ (mejorado con iconos Lucide)
      album-card-footer.tsx ✅ (mejorado con iconos Lucide)
      album-card-images.tsx ✅
    /collection-card ✅
      index.ts ✅
      collection-card.tsx ✅
      collection-card-content.tsx ✅
      collection-card-header.tsx ✅
      collection-card-footer.tsx ✅
      collection-card-images.tsx ✅
      collection-server-actions.ts ✅
    /tag-card ✅
      index.ts ✅
      tag-card.tsx ✅
      tag-card-content.tsx ✅
      tag-card-header.tsx ✅
      tag-card-footer.tsx ✅
      tag-card-images.tsx ✅
      tag-server-actions.ts ✅
    /character-card ✅
      index.ts ✅
      character-card.tsx ✅
      character-card-content.tsx ✅
      character-card-header.tsx ✅
      character-card-footer.tsx ✅
      character-card-images.tsx ✅
      character-server-actions.ts ✅
    /place-card ✅
      index.ts ✅
      place-card.tsx ✅
      place-card-content.tsx ✅
      place-card-header.tsx ✅
      place-card-footer.tsx ✅
      place-card-images.tsx ✅
      place-server-actions.ts ✅
    /note-card ✅
      index.ts ✅
      note-card.tsx ✅
      note-card-content.tsx ✅
      note-card-footer.tsx ✅
      note-card-images.tsx ✅
      note-server-actions.ts ✅
      README.md ✅
    card-container.tsx ✅ (componente auxiliar compartido)
    card-header.tsx ✅ (componente auxiliar compartido)
    ... (otros componentes de tarjeta)

```

## Próximos pasos

1. ✅ Implementar AlbumCard
   - ✅ Crear estructura similar a FolderCard pero adaptada para álbumes
   - ✅ Actualizar albums-view para usar AlbumCard
   - ✅ Mejorar UX con iconos consistentes de Lucide

2. 🔄 Continuar con el resto de entidades siguiendo el mismo patrón
   - ✅ Implementar CollectionCard y actualizar collections-view
   - ✅ Implementar TagCard y actualizar tags-view
   - ✅ Implementar CharacterCard y actualizar characters-view
   - ✅ Implementar PlaceCard y actualizar places-view
   - ✅ Implementar WorldItemCard (siguiente en la lista)
   - ✅ Implementar ConceptCard (siguiente en la lista)
   - ✅ Implementar PromptCard (siguiente en la lista)
   - ✅ Implementar NoteCard (siguiente en la lista)
   - ✅ Asegurar consistencia usando iconos de Lucide React en lugar de Radix

3. ✅ Eliminar completamente los componentes genéricos EntityCard cuando todas las vistas estén migradas

## Estándares de diseño
- ✅ Usar iconos de Lucide React para mantener consistencia
- ✅ Seguir patrón de diseño inspirado en cartas Magic con encabezado, imágenes, contenido y pie de carta
- ✅ Implementar animaciones sutiles para interacción
- ✅ Mantener accesibilidad con roles apropiados y soporte de teclado

## Correcciones y mejoras
- ✅ Corregir el problema con la carga de thumbnails en los componentes
  - ✅ Implementar server actions robustas para manejar diferentes casos
  - ✅ Crear interfaz común ThumbnailImage para estandarizar el manejo de miniaturas
  - ✅ Usar una estrategia de fallback para mostrar placeholders cuando no hay miniaturas
- ✅ Corregir errores de importación en WorldItemCard
  - ✅ Crear componentes auxiliares CardContainer y CardHeader para compartir funcionalidad
