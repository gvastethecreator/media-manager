## TODO: TS-PHASE1-001 - Corrección Sistemática de Errores TypeScript Críticos
**STATUS:** EN_PROGRESO
**PRIORIDAD:** CRÍTICA

### SUBTASKS:
- [✅] [CHECKPOINT_1] Corregir tipos faltantes TopTag y RecentActivity en stats-panel
- [✅] [CHECKPOINT_2] Corregir incompatibilidades de tipos en useStats hook
- [✅] [CHECKPOINT_3] Corregir errores en albums-settings.tsx (AlbumsResponse vs array)
- [✅] [CHECKPOINT_4] Corregir errores en characters (CharacterCreateInput vs form data)
- [✅] [CHECKPOINT_5] Corregir errores en collections-settings.tsx
- [✅] [CHECKPOINT_6] Corregir errores en concepts-settings.tsx (statistics vs stats)
- [✅] [CHECKPOINT_7] Corregir errores en entity-details-registry.ts
- [✅] [CHECKPOINT_8] Corregir errores en filter-panel.tsx (Date conversion)
- [✅] [CHECKPOINT_9] Corregir módulo faltante use-system-service
- [✅] [CHECKPOINT_10] Corregir errores en image-grid.tsx (archivo no existe - sin errores)
- [⏳] [CHECKPOINT_11] Validar todas las correcciones con bun run tsc (errores encontrados)

### CRITERIOS DE ACEPTACIÓN:
- [ ] Todos los errores TypeScript del log están resueltos
- [ ] Los tipos TopTag y RecentActivity están correctamente definidos
- [ ] El hook useStats retorna los tipos correctos
- [ ] No hay errores de compilación TypeScript
- [ ] Todas las importaciones están resueltas

### VALIDACIÓN:
- [ ] Código compila sin errores con bun run tsc
- [ ] No hay tipos any implícitos
- [ ] Todas las interfaces están correctamente exportadas
- [ ] Los componentes de stats-panel funcionan correctamente

### ERRORES ESPECÍFICOS IDENTIFICADOS:

#### 1. Stats Panel - Tipos faltantes:
- `TopTag` no definido en stats-client-components.tsx:27,248
- `RecentActivity` no definido en stats-client-components.tsx:28,316
- Hook `useStats()` retorna `{ stats, error, isLoading, isError, refreshStats }` pero se usa `{ data: stats }`

#### 2. Albums Settings:
- `AlbumsResponse` no tiene propiedades de array (length, reduce, filter, map)
- Necesita extraer array de albums de la respuesta

#### 3. Character Forms:
- `CharacterCreateInput` incompatible con form data
- Campos null vs undefined en psychologicalProfile y socialProfile
- `isFavorite` requerido en schema pero opcional en tipo

#### 4. Collections:
- `CollectionsResponse.collections` no existe
- `CollectionCreateInput` requiere name como string, no undefined

#### 5. Concepts:
- `ConceptWithStats.statistics` no existe, debe ser `stats`
- `ConceptBase` y `ConceptExtended` no están importados

#### 6. Entity Registry:
- Conversión de tipos genéricos incompatible

#### 7. Filter Panel:
- Conversión insegura de boolean a Date

#### 8. Server Initializer:
- Módulo `@/lib/hooks/system/use-system-service` no existe