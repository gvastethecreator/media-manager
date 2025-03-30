# Plan de Acción para Actualización de Componentes de Tarjetas

## Estado Actual del Proyecto

- Se han mejorado los componentes base como `CardContainer` y `CardHeader` para soportar estilos TCG ✅
- Se han implementado componentes nuevos: `PropertyCard`, `WildcardCard` y `GroupCard` con sus respectivas server actions ✅
- Faltan por actualizar varios componentes existentes

## Tareas Pendientes

### 1. AlbumCard

- [x] Alinear interfaz con esquema Prisma actual
- [x] Actualizar `_count` para incluir videos y otras relaciones
- [x] Actualizar `AlbumCardContent` para mostrar filtros y configuración
- [x] Mejorar visualización estilo TCG
- [x] Actualizar `album-server-actions.ts`

### 2. CharacterCard

- [x] Alinear interfaz con modelo Character actual
- [x] Actualizar visualización de estadísticas y atributos
- [x] Mejorar parsing de campos tipo objeto
- [x] Implementar barras de salud y maná estilo TCG
- [x] Actualizar server actions con todas las relaciones
- [x] Incorporar nuevos campos como `relationships`, `goals`, etc. en la interfaz principal
- [x] Agregar funciones para obtener personajes relacionados

### 3. CollectionCard

- [x] Alinear con modelo Collection de Prisma
- [x] Agregar soporte para campos como url, platform, network
- [x] Actualizar _count para incluir todas las relaciones
- [x] Mejorar estilo visual TCG

### 4. ConceptCard

- [ ] Alinear con modelo Concept de Prisma
- [ ] Agregar relaciones faltantes
- [ ] Actualizar server actions
- [ ] Mejorar estilo visual TCG

### 5. FolderCard

- [ ] Alinear con modelo Folder de Prisma
- [ ] Actualizar para incluir totalFiles y totalSize
- [ ] Agregar soporte para autoReindex y lastIndexed
- [ ] Mejorar diseño visual TCG

### 6. ImageCard

- [ ] Alinear con modelo Image actual
- [ ] Actualizar para usar propiedades correctas de thumbnail
- [ ] Mejorar interfaz de tarjeta con estilo TCG
- [ ] Asegurar compatibilidad con nuevos campos y relaciones

### 7. NoteCard

- [ ] Alinear con modelo Note actual
- [ ] Verificar soporte para status y priority
- [ ] Mejorar visualización de metadatos y relaciones
- [ ] Asegurar diseño consistente tipo TCG

### 8. PlaceCard

- [ ] Alinear con modelo Place actual
- [ ] Incorporar campos como region, climate
- [ ] Visualizar atributos específicos de lugares
- [ ] Mejorar diseño visual TCG

### 9. PromptCard

- [ ] Alinear con modelo Prompt actual
- [ ] Agregar soporte para parameters y purpose
- [ ] Mejorar visualización de contenido
- [ ] Asegurar estilo visual TCG

### 10. TagCard

- [ ] Verificar alineación con modelo Tag actual
- [ ] Mejorar soporte para relaciones múltiples
- [ ] Actualizar server actions con relaciones correctas
- [ ] Asegurar estilo visual TCG

### 11. WorldItemCard

- [ ] Alinear con modelo WorldItem
- [ ] Incorporar campos como type, rarity, attributes
- [ ] Mejorar visualización de propiedades específicas
- [ ] Asegurar estilo visual TCG

## Enfoque de Implementación

1. Para cada componente:
   - Revisar modelo Prisma y actualizar interfaces TypeScript
   - Actualizar server actions para incluir todas las relaciones
   - Mejorar estilo visual siguiendo el diseño de cartas TCG
   - Optimizar rendimiento con memoización
   - Actualizar documentación

2. Elementos comunes de diseño TCG:
   - Gradientes y bordes decorativos
   - Efectos holográficos sutiles
   - Iconografía y símbolos para atributos
   - Estructura visual consistente (encabezado, contenido, pie)
   - Animaciones de hover/interacción

## Progreso Actual

### AlbumCard ✅

Se ha completado la actualización del componente AlbumCard con:

- ✅ Interfaces alineadas con el esquema Prisma actual
- ✅ Mejora del `album-server-actions.ts` para:
  - Incluir todos los recuentos (_count) de relaciones según el esquema Prisma
  - Mejorar el cálculo de estadísticas para incluir imágenes, videos y entidades relacionadas
  - Agregar soporte para incluir estadísticas avanzadas con la opción `includeStats`
  - Optimizar consultas a la base de datos para obtener información en paralelo
- ✅ Actualización de `AlbumCardContent` para:
  - Mostrar filtros de manera más visual y interactiva
  - Incluir información sobre viewConfig (tema, layout, tamaño de miniaturas)
  - Implementar contadores de recursos estilo TCG
  - Agregar modo compacto para mejor visualización en listas
  - Incorporar animaciones con motion/react
  - Mejorar el diseño visual según el estilo de cartas TCG

### CharacterCard ✅

Se ha completado la actualización del componente CharacterCard:

- ✅ Actualización de `character-card-content.tsx` para:
  - Mejorar visualización de estadísticas y atributos (STR, DEX, INT, etc.)
  - Agregar soporte para alineamiento con indicadores visuales
  - Mejorar la visualización de habilidades con animaciones y estilos TCG
  - Incorporar barras de salud/maná estilo videojuego
  - Mostrar objetivos y personalidad en un formato más compacto
  - Agregar modo compacto para mejor visualización en listas
- ✅ Actualización de `character-server-actions.ts` para soportar todas las relaciones
- ✅ Incorporación de nuevos campos como `relationships`, `goals`, `fears` y `beliefs` en la interfaz principal
- ✅ Implementación de la función `getRelatedCharacters` para obtener personajes relacionados
- ✅ Añadido soporte para incluir relaciones directas con la opción `includeRelated`

⏭️ Próximos pasos:

- Actualizar `character-server-actions.ts` para soportar todas las relaciones
- Incorporar nuevos campos como `relationships`, `goals`, etc. en la interfaz principal

⏭️ Siguiente componente: CollectionCard
