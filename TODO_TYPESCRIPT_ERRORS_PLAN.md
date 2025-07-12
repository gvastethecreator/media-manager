# TODO: PLAN SISTEMÁTICO CORRECCIÓN ERRORES TYPESCRIPT

**CREATED:** 2025-01-12T08:41:00Z
**AGENT:** Claude
**STATUS:** IN_PROGRESS
**PRIORITY:** CRITICAL
**COMPLEXITY:** BIG

## SUBTASKS:

### [CHECKPOINT_1] Análisis y Categorización de Errores
- [ ] Categorizar errores por tipo (TS2322, TS2339, TS18048, etc.)
- [ ] Identificar archivos más afectados
- [ ] Mapear dependencias entre errores
- [ ] Priorizar correcciones por impacto

### [CHECKPOINT_2] Corrección de Tipos 'never' en entity-card.tsx
- [ ] Revisar definición de EntityWithStats
- [ ] Corregir type guards en migration.ts
- [ ] Actualizar AnyEntityWithStats union type
- [ ] Validar que entity.id sea accesible

### [CHECKPOINT_3] Corrección de Props Incompatibles
- [ ] Alinear CardVariant types entre componentes
- [ ] Corregir props de FolderCard, AudioCard, DocumentCard
- [ ] Actualizar interfaces de componentes de tarjetas
- [ ] Validar consistencia de props

### [CHECKPOINT_4] Corrección de Nullability Issues
- [ ] Agregar null checks en image-card-improved.tsx
- [ ] Corregir acceso a propiedades opcionales
- [ ] Implementar safe navigation patterns
- [ ] Validar todos los accesos a arrays/objetos

### [CHECKPOINT_5] Corrección de Tipos Específicos
- [ ] Corregir organizationLevel y rarityLevel en group-card
- [ ] Resolver variable hoisting en image-card.tsx
- [ ] Actualizar onClick handlers en concept-card
- [ ] Validar todos los event handlers

## CONTEXT_REQUIRED:
- Files: entity-card.tsx, migration.ts, concept-card.tsx, image-card-improved.tsx, group-card.tsx
- Dependencies: EntityWithStats, AnyEntityWithStats, CardVariant types
- Tools: TypeScript compiler, type checking

## ACCEPTANCE_CRITERIA:
- [ ] Comando 'bun run tsc --noEmit' ejecuta sin errores
- [ ] Todos los tipos TS2322, TS2339, TS18048 resueltos
- [ ] Props de componentes correctamente tipados
- [ ] Null safety implementada donde sea necesario
- [ ] Type guards funcionando correctamente

## VALIDATION_CHECKPOINTS:
- [ ] Pre-implementation: Análisis completo de errores
- [ ] Mid-implementation: Validación parcial con tsc
- [ ] Post-implementation: Verificación completa sin errores
- [ ] Integration testing: Componentes funcionando correctamente
- [ ] Final acceptance: Build exitoso y tipos correctos

## RECOVERY_POINTS:
- Checkpoint 1: Estado actual documentado y categorizado
- Checkpoint 2: Tipos base corregidos
- Checkpoint 3: Props alineadas entre componentes

**COMPLETION_PERCENTAGE:** 10%
**LAST_UPDATED:** 2025-01-12T08:41:00Z
**NEXT_ACTION:** Analizar y categorizar todos los errores encontrados

## ERRORES IDENTIFICADOS:

### 1. ENTITY-CARD.TSX - Tipos 'never'
```
TS2339: Property 'id' does not exist on type 'never'
- Líneas: 142, 173, 185, 189, 193, 197, 201, 205, 209, 213, 217, 221, 230
- Causa: EntityWithStats no está correctamente tipado
- Solución: Corregir union types y type guards
```

### 2. PROPS INCOMPATIBLES
```
TS2322: Type incompatibilities en múltiples componentes
- FolderCard: folderId vs folder
- AudioCard: audioId vs audio  
- DocumentCard: documentId vs document
- TagCard: tagId vs tag
- WildcardCard: wildcardId vs wildcard
```

### 3. VARIANT TYPES
```
TS2322: CardVariant 'elevated' not assignable
- entity-card.tsx:132
- Necesita alineación entre CardVariant definitions
```

### 4. NULLABILITY ISSUES
```
TS18048: Possibly undefined access
- image-card-improved.tsx: imageData.tags?.length
- Necesita null checks y safe navigation
```

### 5. TYPE MISMATCHES
```
TS2322: String vs Number types
- group-card.tsx: organizationLevel, rarityLevel
- concept-card.tsx: onClick handler signature
```

## ESTRATEGIA DE CORRECCIÓN:

1. **FASE 1**: Corregir tipos base (EntityWithStats, AnyEntityWithStats)
2. **FASE 2**: Alinear interfaces de props entre componentes
3. **FASE 3**: Implementar null safety patterns
4. **FASE 4**: Validar y corregir type mismatches específicos
5. **FASE 5**: Verificación completa con TypeScript compiler

## MÉTRICAS:
- Errores totales identificados: ~50+
- Archivos afectados: ~15
- Tiempo estimado: 2-3 horas
- Complejidad: Alta (tipos interdependientes)