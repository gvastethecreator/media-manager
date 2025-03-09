# Plan de Mejora para el Panel de Navegación

## Requisitos

1. Mostrar información de conteo para cada categoría:
   - Cantidad de ítems
   - Cantidad de imágenes

2. Implementar funcionalidad de colapsar/expandir:
   - Al hacer clic en el título de cada categoría
   - Lógica de interacción:
     - Si está expandido y no seleccionado: seleccionar
     - Si está colapsado y no seleccionado: expandir y seleccionar
     - Si está expandido y seleccionado: colapsar
     - Si hay un elemento hijo seleccionado: mantenerlo visible aunque se colapse

3. Agregar nuevas entidades faltantes:
   - Concepts
   - Prompts
   - Notes

## Tareas

### Fase 1: Preparación
- [x] Analizar la estructura actual del componente NavPanel
- [x] Identificar los archivos que necesitan ser modificados
- [x] Actualizar tipos ViewType para incluir nuevas entidades

### Fase 2: Implementación de colapso/expansión
- [x] Agregar estado para controlar qué categorías están colapsadas
- [x] Implementar lógica de colapso/expansión para cada categoría
- [x] Modificar la visualización para mostrar/ocultar elementos según el estado

### Fase 3: Mejora de indicadores de conteo
- [x] Asegurar que cada categoría muestre el número de ítems
- [x] Asegurar que cada categoría muestre el número de imágenes asociadas

### Fase 4: Nuevas entidades
- [x] Agregar nuevas categorías: Concepts, Prompts y Notes
- [x] Crear handlers para estas nuevas categorías
- [x] Actualizar NavigationData para incluir las nuevas entidades

### Fase 5: Pruebas y ajustes
- [x] Verificar que todas las funcionalidades se comporten como se espera
- [x] Ajustar estilos para mantener la coherencia visual
- [x] Asegurar que no se rompa la navegación existente

### Fase 6: Correcciones adicionales
- [x] Agregar cursor pointer a todos los elementos clickeables para mejorar la UX
- [x] Agregar iconos específicos para las estadísticas de cada tipo de categoría/ítem
- [x] Separar la funcionalidad de colapso/expansión de la selección de categoría
- [x] Corregir error de hidratación reestructurando el componente para evitar botones anidados

## Integraciones Completadas

1. **Actualización de Tipos**:
   - Se actualizó el tipo `ViewType` en `src/types/file-item.ts` y `src/store/navigation.store.ts`
   - Se agregaron interfaces para relaciones con las nuevas entidades: `RelatedConcept`, `RelatedPrompt` y `RelatedNote`

2. **Creación de Acciones del Servidor**:
   - Se implementaron los archivos de acciones para las nuevas entidades:
     - `src/app/actions/concept.actions.ts`
     - `src/app/actions/prompt.actions.ts`
     - `src/app/actions/note.actions.ts`
   - Cada acción proporciona métodos CRUD completos para su entidad

3. **Actualización de Eventos**:
   - Se agregaron eventos de cambio en `src/services/stats.service.ts`:
     - `CONCEPT_CHANGE`, `PROMPT_CHANGE` y `NOTE_CHANGE`
     - Se actualizó el tipo `StatsUpdateEvent` para incluir estos nuevos eventos

4. **Actualización de NavigationData**:
   - Se modificó `src/app/actions/nav.actions.ts` para incluir las nuevas entidades en:
     - La interfaz `NavigationData`
     - La función `getNavigationData`

5. **Actualización del Store de Administración de Archivos**:
   - Se modificó `src/store/file-manager.store.ts` para agregar soporte para las nuevas entidades:
     - Se agregaron estados para IDs y objetos actuales
     - Se agregaron listas de objetos de cada tipo
     - Se implementaron métodos para establecer los objetos actuales

6. **Mejoras de Experiencia de Usuario**:
   - Se agregó un botón específico para colapsar/expandir categorías
   - Se agregaron iconos específicos para mostrar las estadísticas de cada tipo de categoría
   - Se mejoró la accesibilidad con información aria y eventos de teclado
   - Se añadió cursor pointer a todos los elementos clickeables
   - Se reestructuró el componente para evitar errores de hidratación con botones anidados

## Próximos Pasos

Para completar la integración, se necesita:

1. Crear las vistas para las nuevas entidades:
   - Crear archivos `concepts-view.tsx`, `prompts-view.tsx` y `notes-view.tsx`
   - Crear archivos `concept-content-view.tsx`, `prompt-content-view.tsx` y `note-content-view.tsx`

2. Implementar servicios especializados para cada entidad (opcional):
   - `concepts.store.ts`, `prompts.store.ts` y `notes.store.ts`

3. Actualizar el sistema de estadísticas para incluir contadores para las nuevas entidades:
   - Agregar campos en `SystemStats` para contar conceptos, prompts y notas
   - Implementar lógica de cálculo en `getSystemStats`
