# TODO: FIX-TYPESCRIPT-ERRORS - Corrección de Errores de TypeScript

**STATUS:** EN_PROGRESO
**PRIORIDAD:** ALTA

## DESCRIPCIÓN
Correción sistemática de todos los errores de TypeScript encontrados en el proyecto para asegurar la compilación exitosa.

## ERRORES IDENTIFICADOS - FASE 2

### 9. place-card.tsx (Nuevos errores)
- **Error:** Property 'type' does not exist on type (líneas 104, 105)
- **Solución:** Verificar tipo de datos de media
- **Estado:** ✅ CORREGIDO

### 10. prompt-card-grid.tsx (Nuevo error)
- **Error:** Property 'prompt' does not exist on type 'PromptCardProps' (línea 134)
- **Solución:** Usar 'promptId' en lugar de 'prompt'
- **Estado:** ⏳ PENDIENTE

### 11. prompt-card.tsx (Nuevo error)
- **Error:** Property 'emoji' does not exist on type 'PromptCardContentProps' (línea 254)
- **Solución:** Agregar propiedad emoji al tipo
- **Estado:** ⏳ PENDIENTE

### 12. uploaded-image-card.tsx
- **Error:** Property 'category', 'width', 'height' do not exist on type 'UploadedImageWithStats'
- **Líneas:** 50, 67, 91, 92, 93, 205
- **Solución:** Verificar y corregir tipo UploadedImageWithStats
- **Estado:** ⏳ PENDIENTE

### 13. video-card-thumbnail.tsx
- **Error:** Property 'thumbnailUrl' does not exist on type 'VideoWithStats'
- **Línea:** 26
- **Solución:** Verificar tipo VideoWithStats
- **Estado:** ⏳ PENDIENTE

### 14. world-item-card-content.tsx
- **Error:** Type 'unknown' is not assignable to type 'ReactNode'
- **Línea:** 205
- **Solución:** Agregar type assertion o validación
- **Estado:** ⏳ PENDIENTE

### 15. world-item-card.tsx
- **Error:** Multiple property errors (shortcut, attributes, effects, requirements, rawStats)
- **Líneas:** 80, 87, 88, 89, 271, 273, 278, 279
- **Solución:** Verificar tipo WorldItemWithStats
- **Estado:** ⏳ PENDIENTE

### 16. context-action-handler.ts
- **Error:** Property 'addImageToTag' does not exist on type
- **Línea:** 231
- **Solución:** Verificar TagService interface
- **Estado:** ⏳ PENDIENTE

### 17. context-menu.tsx
- **Error:** Type incompatibility with EnhancedSubmenuItem
- **Línea:** 113
- **Solución:** Corregir tipos de emoji (null vs undefined)
- **Estado:** ⏳ PENDIENTE

## SUBTASKS:
- [✅] [CHECKPOINT_1] Corregir errores en note-card.tsx
- [✅] [CHECKPOINT_2] Corregir errores en prompt-card-footer.tsx
- [✅] [CHECKPOINT_3] Corregir errores en prompt-card-grid.tsx
- [✅] [CHECKPOINT_4] Corregir errores en prompt-card.tsx
- [✅] [CHECKPOINT_5] Corregir errores en world-item-card-images.tsx
- [✅] [CHECKPOINT_6] Corregir errores en entity-card.tsx
- [✅] [CHECKPOINT_7] Corregir errores en place-card-images.tsx
- [✅] [CHECKPOINT_8] Corregir errores en place-card.tsx (primera ronda)
- [🔄] [CHECKPOINT_9] Corregir errores en prompt-card-grid.tsx (segunda ronda)
- [⏳] [CHECKPOINT_10] Corregir errores en prompt-card.tsx (segunda ronda)
- [⏳] [CHECKPOINT_11] Corregir errores en uploaded-image-card.tsx
- [⏳] [CHECKPOINT_12] Corregir errores en video-card-thumbnail.tsx
- [⏳] [CHECKPOINT_13] Corregir errores en world-item-card-content.tsx
- [⏳] [CHECKPOINT_14] Corregir errores en world-item-card.tsx
- [⏳] [CHECKPOINT_15] Corregir errores en context-action-handler.ts
- [⏳] [CHECKPOINT_16] Corregir errores en context-menu.tsx
- [⏳] [CHECKPOINT_17] Validación final de compilación

## CRITERIOS DE ACEPTACIÓN:
- [ ] Todos los errores de TypeScript corregidos
- [ ] Compilación exitosa sin errores
- [ ] No se introducen nuevos errores
- [ ] Funcionalidad preservada

## VALIDACIÓN:
- [ ] Código compila y tests pasan
- [ ] Documentación y métricas actualizadas

## ERRORES IDENTIFICADOS:

### 1. entity-card.tsx
- Tipos incompatibles entre CollectionWithStats, AudioWithStats, DocumentWithStats
- Líneas: 178, 207, 211

### 2. note-card.tsx
- Variable 'color' usada antes de su declaración
- Líneas: 43, 67

### 3. place-card-images.tsx
- Conversión incorrecta de tipo CardMediaItem a string
- Línea: 161

### 4. place-card.tsx
- Propiedad 'type' no existe en objeto media
- Línea: 104

### 5. prompt-card-footer.tsx
- Identificador duplicado 'tagsCount'
- Líneas: 11, 12

### 6. prompt-card-grid.tsx
- No se encuentra 'MemoizedPromptCard'
- Línea: 132

### 7. prompt-card.tsx
- Propiedad 'emoji' no existe en PromptCardContentProps
- Propiedad 'tagsCount' faltante en PromptCardFooterProps
- Líneas: 254, 264

### 8. uploaded-image-card.tsx
- Propiedades faltantes: category, width, height
- Líneas: 50, 67, 91, 92, 93, 205

### 9. video-card-thumbnail.tsx
- Propiedad 'thumbnailUrl' no existe en VideoWithStats
- Línea: 26

### 10. world-item-card-content.tsx
- Tipo 'unknown' no asignable a ReactNode
- Línea: 205

### 11. world-item-card-images.tsx
- Argumentos faltantes en getRecentWorldItemImages
- Línea: 29

### 12. world-item-card.tsx
- Propiedades faltantes: shortcut, attributes, effects, requirements
- Variable 'rawStats' no definida
- Líneas: 80, 87, 88, 89, 271, 273