## TODO: TS-FIXES-001 - Corrección Masiva de Errores TypeScript
**STATUS:** EN_PROGRESO
**PRIORIDAD:** CRÍTICA

### SUBTASKS:
- [⏳] [CHECKPOINT_1] Corregir tipos de entidades y estadísticas faltantes
- [⏳] [CHECKPOINT_2] Arreglar problemas de importaciones y módulos faltantes
- [⏳] [CHECKPOINT_3] Corregir incompatibilidades de tipos en componentes
- [⏳] [CHECKPOINT_4] Validar y limpiar errores restantes

### CRITERIOS DE ACEPTACIÓN:
- [ ] Todos los errores de tipos EntityWithStats resueltos
- [ ] Importaciones faltantes agregadas o corregidas
- [ ] Tipos de estadísticas unificados
- [ ] Componentes con tipos correctos
- [ ] Código compila sin errores TypeScript

### VALIDACIÓN:
- [ ] Código compila y tests pasan
- [ ] Documentación y métricas actualizadas

### ANÁLISIS DE ERRORES PRINCIPALES:

#### 1. Tipos de Estadísticas Faltantes:
- `CollectionWithStats` no exportado
- `ImageWithStats` no exportado
- `TagWithStats` no definido
- `TopTag` y `RecentActivity` no definidos

#### 2. Problemas de EntityWithStats:
- Incompatibilidades entre diferentes tipos de estadísticas
- Propiedad `entityType` faltante en algunos tipos
- Conflictos entre `EntityStats` y tipos específicos como `VideoStatistics`

#### 3. Importaciones Faltantes:
- `@/types/common/entity-with-stats` no existe
- `@/lib/hooks/system/use-system-service` no existe
- Iconos y componentes no importados

#### 4. Problemas de Componentes:
- Variables no definidas (`showItems`, `showContent`, `Collection`)
- Tipos incorrectos en props de componentes
- Problemas con hooks de estado

#### 5. Problemas de Datos:
- Propiedades GPS con tipos incorrectos
- Arrays vs objetos de respuesta
- Índices dinámicos sin firmas de tipo