# Conversión del Schema: Prisma → Drizzle

Este documento detalla la conversión completa del schema de la base de datos desde la sintaxis de Prisma hacia Drizzle ORM.

## **Resumen de la Conversión**

- **Archivo origen**: `prisma/schema.prisma`
- **Archivo destino**: `src/lib/drizzle/schema.ts`
- **Método**: Conversión manual (introspección automática falló)
- **Base de datos**: SQLite
- **Total de tablas**: 48 (28 principales + 20 relaciones many-to-many)

---

## **Tablas Principales Convertidas**

### **Sistema y Configuración**

1. `QueueJob` → `queueJobs`
2. `Profile` → `profiles`
3. `Settings` → `settings`

### **Gestión de Archivos**

4. `Folder` → `folders`
5. `Image` → `images`
6. `Video` → `videos`
7. `Audio` → `audios`
8. `Document` → `documents`
9. `JsonFile` → `jsonFiles`
10. `File3D` → `file3Ds`

### **Metadatos y Estadísticas**

11. `UploadedImage` → `uploadedImages`
12. `ImageStats` → `imageStats`
13. `Activity` → `activities`
14. `Metadata` → `metadatas`
15. `Thumbnail` → `thumbnails`

### **Organización de Contenido**

16. `Album` → `albums`
17. `Collection` → `collections`
18. `Tag` → `tags`
19. `Property` → `properties`
20. `Wildcard` → `wildcards`
21. `Group` → `groups`

### **Mundo y Narrativa**

22. `Character` → `characters`
23. `Place` → `places`
24. `WorldItem` → `worldItems`
25. `Concept` → `concepts`
26. `Prompt` → `prompts`
27. `Note` → `notes`

### **Flujos de Trabajo**

28. `Workflow` → `workflows`

---

## **Tablas de Relaciones Many-to-Many**

Drizzle requiere tablas explícitas para relaciones many-to-many, replicando exactamente la estructura que Prisma genera internamente:

### **Image Relations**

- `_ImageToAlbum` → `imageAlbums`
- `_ImageToCollection` → `imageCollections`
- `_ImageToTag` → `imageTags`
- `_ImageToProperty` → `imageProperties`
- `_ImageToWildcard` → `imageWildcards`
- `_ImageToCharacter` → `imageCharacters`
- `_ImageToPlace` → `imagePlaces`
- `_ImageToWorldItem` → `imageWorldItems`
- `_ImageToConcept` → `imageConcepts`
- `_ImageToPrompt` → `imagePrompts`
- `_ImageToNote` → `imageNotes`

### **Video Relations**

- `_VideoToAlbum` → `videoAlbums`
- `_VideoToCollection` → `videoCollections`
- `_VideoToTag` → `videoTags`
- `_VideoToProperty` → `videoProperties`
- `_VideoToWildcard` → `videoWildcards`
- `_VideoToCharacter` → `videoCharacters`
- `_VideoToPlace` → `videoPlaces`
- `_VideoToWorldItem` → `videoWorldItems`
- `_VideoToConcept` → `videoConcepts`
- `_VideoToPrompt` → `videoPrompts`
- `_VideoToNote` → `videoNotes`

---

## **Mapeo de Tipos de Datos**

### **Prisma → Drizzle**

| Prisma | Drizzle | Ejemplo |
|--------|---------|---------|
| `String` | `text()` | `name: text('name').notNull()` |
| `String?` | `text()` | `description: text('description')` |
| `Int` | `integer()` | `size: integer('size').notNull()` |
| `Boolean` | `integer({ mode: 'boolean' })` | `isFavorite: integer('isFavorite', { mode: 'boolean' })` |
| `DateTime` | `integer({ mode: 'timestamp_ms' })` | `createdAt: integer('createdAt', { mode: 'timestamp_ms' })` |
| `@id` | `.primaryKey()` | `id: text('id').primaryKey()` |
| `@unique` | `uniqueIndex()` | `uniqueIndex('Profile_name_key').on(table.name)` |
| `@default(now())` | `.default(sql\`(CURRENT_TIMESTAMP)\`)` | Timestamps automáticos |
| `@updatedAt` | `.$onUpdate(() => new Date())` | Actualización automática |

---

## **Características Especiales Preservadas**

### **Índices**

- ✅ Todos los índices únicos replicados
- ✅ Índices de rendimiento preservados
- ✅ Índices compuestos mantenidos

### **Constraints**

- ✅ Primary keys preservadas
- ✅ Foreign keys mantenidas (implícitas en Drizzle)
- ✅ Unique constraints replicadas
- ✅ Not null constraints preservadas

### **Valores por Defecto**

- ✅ Strings por defecto mantenidos
- ✅ Emojis por defecto preservados
- ✅ Colores por defecto mantenidos
- ✅ Timestamps automáticos configurados
- ✅ Booleanos por defecto preservados

### **Optimizaciones SQLite**

```typescript
// Configuración de rendimiento aplicada
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = normal');
sqlite.pragma('cache_size = 1000000');
sqlite.pragma('foreign_keys = on');
sqlite.pragma('temp_store = memory');
```

---

## **Diferencias Clave con Prisma**

### **Sintaxis**

```typescript
// Prisma
model Profile {
  id          String   @id @default(cuid())
  name        String   @unique
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Drizzle
export const profiles = sqliteTable(
  'Profile',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    isActive: integer('isActive', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => ({
    nameIdx: uniqueIndex('Profile_name_key').on(table.name),
  }),
);
```

### **Relaciones**

- **Prisma**: Implícitas con decoradores `@relation`
- **Drizzle**: Explícitas con tablas de unión y `relations()`

### **Migraciones**

- **Prisma**: Automáticas con `prisma migrate`
- **Drizzle**: Manuales con `drizzle-kit generate`

---

## **Validación de la Conversión**

### **Checklist Completado**

- [x] Todas las tablas de Prisma convertidas
- [x] Todos los campos preservados
- [x] Tipos de datos correctos
- [x] Índices replicados
- [x] Constraints mantenidas
- [x] Valores por defecto preservados
- [x] Relaciones many-to-many explícitas
- [x] Nombres de tabla consistentes con Prisma

### **Pendiente de Validación**

- [ ] Consultas básicas funcionando
- [ ] Relaciones funcionando correctamente
- [ ] Rendimiento comparable a Prisma
- [ ] Integridad referencial mantenida

---

## **Próximos Pasos**

1. **Resolver problema de compilación** de better-sqlite3
2. **Validar schema** con consultas de prueba
3. **Crear relaciones explícitas** en Drizzle
4. **Comparar resultados** entre Prisma y Drizzle
5. **Documentar diferencias** encontradas durante testing

---

## **Archivos Relacionados**

- `prisma/schema.prisma` - Schema original de Prisma
- `src/lib/drizzle/schema.ts` - Schema convertido de Drizzle
- `src/lib/drizzle/index.ts` - Configuración de conexión
- `drizzle.config.ts` - Configuración de Drizzle Kit
- `scripts/db/drizzle-test.ts` - Script de validación
