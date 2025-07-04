# [034] Migración masiva de transformadores a Drizzle/local + Migración paralela de tipos base

## Contexto

**Objetivo Principal:** Eliminar toda dependencia de Prisma en los transformadores y tipos base, asegurando alineación total con Drizzle y tipos locales.

**Alcance:** 29 bloques de transformadores + 13+ archivos de tipos base

**Criterios de éxito:**

- Sin referencias a Prisma (tipos, funciones, comentarios, alias)
- Solo tipos Drizzle/locales
- Exportaciones limpias y consistentes en index.ts
- API pública alineada con stores y vistas
- Comentarios claros de migración
- Sin exportaciones rotas ni legacy

## 🎯 Tarea Principal: Migración de Transformadores (29 bloques)

### Subtareas Transformadores (Orden alfabético)

[✅] [CRITICAL] [MEDIUM] Migrar bloque activity ⬅️ COMPLETADO
[✅] [CRITICAL] [MEDIUM] Migrar bloque album ⬅️ COMPLETADO  
[✅] [CRITICAL] [MEDIUM] Migrar bloque audio ⬅️ COMPLETADO
[✅] [CRITICAL] [MEDIUM] Migrar bloque character ⬅️ COMPLETADO
[✅] [CRITICAL] [MEDIUM] Migrar bloque collection ⬅️ COMPLETADO
[✅] [CRITICAL] [MEDIUM] Migrar bloque concept ⬅️ COMPLETADO
[✅] [CRITICAL] [MEDIUM] Migrar bloque document ⬅️ COMPLETADO
[✅] [CRITICAL] [MEDIUM] Migrar bloque favorite ⬅️ COMPLETADO
[ ] [CRITICAL] [MEDIUM] Migrar bloque file ⬅️ SIGUIENTE
[ ] [CRITICAL] [MEDIUM] Migrar bloque file
[ ] [CRITICAL] [MEDIUM] Migrar bloque file3d
[ ] [CRITICAL] [MEDIUM] Migrar bloque folder
[ ] [CRITICAL] [MEDIUM] Migrar bloque group
[ ] [CRITICAL] [MEDIUM] Migrar bloque image
[ ] [CRITICAL] [MEDIUM] Migrar bloque json-file
[ ] [CRITICAL] [MEDIUM] Migrar bloque metadata
[ ] [CRITICAL] [MEDIUM] Migrar bloque note
[ ] [CRITICAL] [MEDIUM] Migrar bloque place
[ ] [CRITICAL] [MEDIUM] Migrar bloque profile
[ ] [CRITICAL] [MEDIUM] Migrar bloque prompt
[ ] [CRITICAL] [MEDIUM] Migrar bloque property
[ ] [CRITICAL] [MEDIUM] Migrar bloque queue-job
[ ] [CRITICAL] [MEDIUM] Migrar bloque settings
[ ] [CRITICAL] [MEDIUM] Migrar bloque tag
[ ] [CRITICAL] [MEDIUM] Migrar bloque thumbnail
[ ] [CRITICAL] [MEDIUM] Migrar bloque uploaded-image
[ ] [CRITICAL] [MEDIUM] Migrar bloque video
[ ] [CRITICAL] [MEDIUM] Migrar bloque wildcard
[ ] [CRITICAL] [MEDIUM] Migrar bloque workflow
[ ] [CRITICAL] [MEDIUM] Migrar bloque world-item

## 🔗 Tarea Paralela: Migración de Tipos Base (13+ archivos)

### Estado Tipos Base: ⚠️ 40% migrados (~7/18)

### Subtareas Tipos Base (Prioridad por uso)

[✅] [HIGH] [MEDIUM] Migrar tipos base collection ⬅️ COMPLETADO
[✅] [HIGH] [MEDIUM] Migrar tipos base concept ⬅️ COMPLETADO
[✅] [HIGH] [MEDIUM] Migrar tipos base image ⬅️ COMPLETADO
[✅] [HIGH] [MEDIUM] Migrar tipos base document ⬅️ COMPLETADO
[✅] [HIGH] [MEDIUM] Migrar tipos base video ⬅️ COMPLETADO
[ ] [HIGH] [MEDIUM] Migrar tipos base file ⬅️ SIGUIENTE PARALELO
[ ] [HIGH] [MEDIUM] Migrar tipos base file
[ ] [HIGH] [MEDIUM] Migrar tipos base folder
[ ] [HIGH] [MEDIUM] Migrar tipos base tag
[ ] [HIGH] [MEDIUM] Migrar tipos base group
[ ] [HIGH] [MEDIUM] Migrar tipos base document
[ ] [MEDIUM] [MEDIUM] Migrar tipos base note
[ ] [MEDIUM] [MEDIUM] Migrar tipos base prompt
[ ] [MEDIUM] [MEDIUM] Migrar tipos base property
[ ] [MEDIUM] [MEDIUM] Migrar tipos base workflow
[ ] [MEDIUM] [MEDIUM] Migrar tipos base world-item
[ ] [LOW] [SMALL] Migrar tipos base metadata
[ ] [LOW] [SMALL] Migrar tipos base thumbnail
[ ] [LOW] [SMALL] Migrar tipos base task
[ ] [LOW] [SMALL] Migrar tipos base wildcard
[ ] [LOW] [SMALL] Migrar tipos base queue-job

## Estrategia para cada bloque de transformadores

1. **Revisión de archivos:** mappers.ts, serializers.ts, transformer.ts, index.ts
2. **Eliminación de Prisma:** Borrar cualquier referencia (import, tipo, función, comentario, alias)
3. **Estructura estándar:** Crear archivos faltantes (validators.ts, schema.ts)
4. **Unificación de exportaciones:** Limpiar y dejar solo lo relevante en index.ts
5. **Alineación API pública:** Validar que lo exportado es lo que usan stores y vistas
6. **Comentarios de migración:** Añadir comentarios claros de migración y actualización
7. **Validación final:** Revisar que no queden rastros legacy ni exportaciones rotas

## Estrategia para cada archivo de tipos base

1. **Identificación de dependencias:** Buscar imports de Prisma, BaseEntity, tipos legacy
2. **Migración a Drizzle:** Convertir tipos Prisma a tipos Drizzle nativos
3. **Eliminación de imports legacy:** Remover dependencias obsoletas
4. **Estructura canónica:** Aplicar patrón `Base + Statistics + WithStats`
5. **Validación de compatibilidad:** Asegurar que transformadores y stores funcionen
6. **Comentarios de migración:** Marcar claramente el estado migrado

## Especificaciones técnicas

### Para Transformadores
- Estructura estándar: `mappers.ts`, `serializers.ts`, `validators.ts`, `schema.ts`, `index.ts`
- Sin referencias a Prisma en ningún archivo
- Comentarios de migración `✅ MIGRADO A DRIZZLE - Julio 2025`
- Exportaciones limpias en `index.ts` con `export * from './archivo'`
- Tipos Drizzle para operaciones de base de datos
- Esquemas Zod para validación

### Para Tipos Base
- Estructura canónica: `Base`, `Statistics`, `WithStats`
- Sin imports de `@prisma/client` o tipos legacy
- Compatibilidad completa con transformadores migrados
- Documentación actualizada si existe

## Diagrama de flujo (Mermaid)

```mermaid
graph TD
    A[Inicio Migración] --> B{¿Transformador?}
    B -->|Sí| C[Revisar estructura actual]
    B -->|No| D[Revisar tipos base]
    
    C --> E[Eliminar referencias Prisma]
    E --> F[Crear archivos faltantes]
    F --> G[Actualizar exports]
    G --> H[Validar errores]
    H --> I[Documentar migración]
    
    D --> J[Identificar dependencias legacy]
    J --> K[Migrar a tipos Drizzle]
    K --> L[Eliminar imports obsoletos]
    L --> M[Validar compatibilidad]
    M --> N[Actualizar comentarios]
    
    I --> O[✅ Bloque completado]
    N --> P[✅ Tipos completados]
    O --> Q[Siguiente bloque]
    P --> R[Siguiente tipo]
```

## Progreso Actual

### ✅ Transformadores Migrados (6/29)

1. **activity** - Completo con documentación actualizada
2. **album** - Completo con estructura estándar  
3. **audio** - Completo con validadores y schemas
4. **character** - Completo sin referencias legacy
5. **collection** - Completo con tipos Drizzle y validación Zod
6. **concept** - Completo con patrón Base+Statistics+WithStats

### ✅ Tipos Base Migrados (3/18)

1. **collection** - Migrado a patrón Base + Statistics + WithStats
2. **concept** - Migrado a patrón Base + Statistics + WithStats
3. **image** - Migrado a patrón Base + Statistics + WithStats

### 🔄 Próximos Pasos

- **Transformador:** Continuar con `document`
- **Tipos Base:** Continuar con `video` en paralelo
