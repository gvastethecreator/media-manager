# Guía de Coexistencia: Prisma ↔ Drizzle

Este documento describe cómo **Prisma** y **Drizzle ORM** coexisten durante el proceso de migración gradual en el proyecto Image Manager.

---

## **Estado Actual: Coexistencia Temporal**

### **Ambos ORMs Activos**

- ✅ **Prisma**: ORM principal actual (todas las operaciones)
- 🔄 **Drizzle**: ORM en migración (configurado, pendiente de validación)
- 🎯 **Objetivo**: Migración gradual servicio por servicio

### **Base de Datos Compartida**

- **Archivo**: `prisma/dev.db` (SQLite)
- **Acceso**: Ambos ORMs leen/escriben la misma base de datos
- **Schema**: Drizzle replica exactamente la estructura de Prisma
- **Conflictos**: No hay, ambos usan la misma estructura física

---

## **Configuración Técnica**

### **Variables de Entorno**

```bash
# Compartida por ambos ORMs
DATABASE_URL="file:./prisma/dev.db"
```

### **Conexiones**

```typescript
// Prisma (existente)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Drizzle (nuevo)
import { db } from '@/lib/drizzle';
// Ambos apuntan a la misma base de datos física
```

### **Schemas Sincronizados**

- **Prisma**: `prisma/schema.prisma` (fuente de verdad)
- **Drizzle**: `src/lib/drizzle/schema.ts` (réplica manual)
- **Sincronización**: Manual durante la migración

---

## **Estrategia de Migración por Servicios**

### **Fase 1: Solo Lectura**

```typescript
// ANTES (Solo Prisma)
async function getProfile(id: string) {
  return await prisma.profile.findUnique({
    where: { id },
    include: profileCounts
  });
}

// DURANTE (Ambos ORMs - Validación)
async function getProfile(id: string) {
  // Drizzle (nuevo)
  const drizzleResult = await db.select().from(profiles).where(eq(profiles.id, id));

  // Prisma (validación)
  const prismaResult = await prisma.profile.findUnique({
    where: { id },
    include: profileCounts
  });

  // Comparar resultados en desarrollo
  if (process.env.NODE_ENV === 'development') {
    validateResults(drizzleResult, prismaResult);
  }

  return drizzleResult; // Usar Drizzle como principal
}

// DESPUÉS (Solo Drizzle)
async function getProfile(id: string) {
  return await db.select().from(profiles).where(eq(profiles.id, id));
}
```

### **Fase 2: Escritura**

```typescript
// ANTES (Solo Prisma)
async function updateProfile(id: string, data: ProfileUpdate) {
  return await prisma.profile.update({
    where: { id },
    data
  });
}

// DURANTE (Drizzle principal, Prisma validación)
async function updateProfile(id: string, data: ProfileUpdate) {
  // Transacción en Drizzle
  const drizzleResult = await db.update(profiles)
    .set(data)
    .where(eq(profiles.id, id))
    .returning();

  // Validar en Prisma (opcional en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    const prismaValidation = await prisma.profile.findUnique({ where: { id } });
    validateConsistency(drizzleResult[0], prismaValidation);
  }

  return drizzleResult[0];
}

// DESPUÉS (Solo Drizzle)
async function updateProfile(id: string, data: ProfileUpdate) {
  return await db.update(profiles)
    .set(data)
    .where(eq(profiles.id, id))
    .returning();
}
```

---

## **Servicios por Migrar**

### **Prioridad Alta (Solo Lectura)**

- [ ] `ProfileService.getActiveProfile()`
- [ ] `SettingsService.getSettings()`
- [ ] `StatsService.*` (todas las estadísticas)
- [ ] `MetadataService.getMetadata()`

### **Prioridad Media (Lectura + Escritura Simple)**

- [ ] `ProfileService.updateTheme()`
- [ ] `SettingsService.updateSettings()`
- [ ] `FavoriteService.*` (toggle favoritos)

### **Prioridad Baja (Operaciones Complejas)**

- [ ] `FileService.*` (gestión de archivos)
- [ ] `FolderService.*` (gestión de carpetas)
- [ ] `CollectionService.*` (relaciones many-to-many)
- [ ] `AlbumService.*` (relaciones complejas)

---

## **Herramientas de Validación**

### **Función de Comparación**

```typescript
// src/lib/drizzle/validation.ts
export function validateResults<T>(
  drizzleResult: T,
  prismaResult: T,
  context: string
) {
  if (process.env.NODE_ENV !== 'development') return;

  const isEqual = JSON.stringify(drizzleResult) === JSON.stringify(prismaResult);

  if (!isEqual) {
    console.warn(`[DB VALIDATION] Diferencia encontrada en ${context}:`, {
      drizzle: drizzleResult,
      prisma: prismaResult
    });
  } else {
    console.log(`[DB VALIDATION] ✅ ${context} - Resultados idénticos`);
  }
}
```

### **Wrapper de Transición**

```typescript
// src/lib/database/transition-wrapper.ts
export class TransitionWrapper {
  async query<T>(
    drizzleQuery: () => Promise<T>,
    prismaQuery: () => Promise<T>,
    context: string
  ): Promise<T> {
    const drizzleResult = await drizzleQuery();

    if (process.env.NODE_ENV === 'development') {
      const prismaResult = await prismaQuery();
      validateResults(drizzleResult, prismaResult, context);
    }

    return drizzleResult;
  }
}
```

---

## **Comandos de Desarrollo**

### **Prisma (Existente)**

```bash
# Base de datos
pnpm db:full-reset     # Resetear y poblar DB
pnpm db:studio         # Abrir Prisma Studio

# Schema y migraciones
npx prisma generate    # Generar cliente
npx prisma db push     # Aplicar cambios de schema
```

### **Drizzle (Nuevo)**

```bash
# Validación
pnpm drizzle:test      # Probar configuración
pnpm drizzle:check     # Verificar schema

# Desarrollo
pnpm drizzle:studio    # Abrir Drizzle Studio
pnpm drizzle:pull      # Sincronizar desde DB
```

---

## **Monitoreo y Logging**

### **Variables de Entorno para Debugging**

```bash
# .env.development
DATABASE_URL="file:./prisma/dev.db"
DRIZZLE_LOGGING=true
PRISMA_VALIDATION=true
DB_COMPARISON_MODE=strict
```

### **Logging Automático**

```typescript
// src/lib/drizzle/index.ts
export const db = drizzle(sqlite, {
  schema,
  logger: process.env.NODE_ENV === 'development' && process.env.DRIZZLE_LOGGING === 'true'
});
```

---

## **Problemas Conocidos y Soluciones**

### **1. better-sqlite3 Compilation (Actual)**

- **Problema**: Bindings nativos no compilan en Windows
- **Impacto**: Bloquea testing de Drizzle
- **Soluciones**:
  - Usar `@libsql/client` (ya instalado)
  - Configurar entorno de compilación nativo
  - Usar contenedor Docker para desarrollo

### **2. Diferencias en Timestamps**

- **Problema**: Formatos de fecha entre ORMs
- **Solución**: Normalizar en transformadores

### **3. Relaciones Many-to-Many**

- **Problema**: Sintaxis diferente entre ORMs
- **Solución**: Mappers específicos para cada ORM

---

## **Checklist de Migración por Servicio**

Para cada servicio que se migre:

- [ ] **Análisis**: Identificar todas las operaciones de DB
- [ ] **Conversión**: Traducir queries de Prisma a Drizzle
- [ ] **Wrapper**: Implementar validación dual
- [ ] **Testing**: Comparar resultados exhaustivamente
- [ ] **Performance**: Medir diferencias de rendimiento
- [ ] **Rollback**: Mantener código Prisma comentado
- [ ] **Documentación**: Actualizar documentación del servicio
- [ ] **Cleanup**: Eliminar código Prisma una vez validado

---

## **Referencias**

- [Plan de Migración Principal](./00-migration-plan.md)
- [Conversión de Schema](./01-schema-conversion.md)
- [Documentación de Drizzle](https://orm.drizzle.team/)
- [Documentación de Prisma](https://www.prisma.io/docs)

---

## **Archivos Afectados por la Coexistencia**

### **Configuración**

- `prisma/schema.prisma` - Schema de Prisma (fuente de verdad)
- `src/lib/drizzle/schema.ts` - Schema de Drizzle (réplica)
- `drizzle.config.ts` - Configuración de Drizzle
- `.env` - Variables compartidas

### **Servicios en Migración**

- `src/services/*/` - Todos los servicios gradualmente
- `src/transformers/*/` - Transformadores de datos
- `src/lib/api/` - Hooks de API que usan servicios

### **Testing**

- `scripts/db/drizzle-test.ts` - Validación de configuración
- Tests específicos por servicio migrado
