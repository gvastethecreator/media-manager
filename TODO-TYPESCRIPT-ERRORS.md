## TODO: CORREGIR ERRORES DE TYPESCRIPT

☑ Corregir errores en character-card-adapter.ts (safeJsonParse con tipos incorrectos)
☑ Actualizar interfaz ConceptWithStats para incluir propiedades faltantes
☑ Corregir variable 'color' no definida en concept-card.tsx
☑ Arreglar errores de tipo en entity-card.tsx (property 'id' does not exist on type 'never')
☑ Corregir CollectionEdition para incluir propiedad 'year'
☑ Actualizar CharacterCardContentProps para manejar tipos correctos
□ Validar implementación con tsc

CONTEXT_REQUIRED: 
- src/components/cards/character-card/character-card-adapter.ts
- src/types/entities/concept/types.ts
- src/components/cards/concept-card/concept-card.tsx
- src/components/cards/entity-card.tsx
- src/types/entities/collection/types.ts
- src/components/cards/character-card/character-card-content.tsx

ACCEPTANCE: 
- Todos los errores TS2345, TS2339, TS2304, TS2322 resueltos
- Comando 'bun run tsc' ejecuta sin errores
- Tipos correctamente definidos y utilizados

STATUS: PENDING