## TODO: TS-FIXES-001 - Corrección de Errores de TypeScript
**STATUS:** EN_PROGRESO
**PRIORIDAD:** CRÍTICA

### SUBTASKS:
- [✅] [CHECKPOINT_1] Buscar y revisar definiciones de EntityStatsType
- [⏳] [CHECKPOINT_2] Corregir incompatibilidades de tipos Character
- [⏳] [CHECKPOINT_3] Agregar importaciones faltantes (CollectionWithStats, TagWithStats)
- [⏳] [CHECKPOINT_4] Corregir propiedades faltantes (thumbnailUrl, etc.)
- [⏳] [CHECKPOINT_5] Agregar index signature a AIGenerationInfo
- [⏳] [CHECKPOINT_6] Corregir checks de null en details-panel.tsx
- [⏳] [CHECKPOINT_7] Validar que todos los errores estén resueltos

### CRITERIOS DE ACEPTACIÓN:
- [ ] EntityStatsType incluye 'character'
- [ ] Compatibilidad entre CharacterWithStats y CharacterCardData
- [ ] Todas las importaciones de tipos están disponibles
- [ ] Propiedades requeridas están definidas en interfaces
- [ ] AIGenerationInfo tiene index signature apropiada
- [ ] No hay errores de null/undefined sin verificar
- [ ] `bun run tsc` ejecuta sin errores

### VALIDACIÓN:
- [ ] Código compila sin errores de TypeScript
- [ ] Todas las interfaces están correctamente definidas
- [ ] No hay regresiones en funcionalidad existente