# 🔄 Prisma en Image Manager

## 📋 Configuración

El proyecto utiliza Prisma como ORM para interactuar con una base de datos SQLite. La configuración principal se encuentra en:

- `prisma/schema.prisma`: Esquema de la base de datos
- `src/lib/prisma.ts`: Cliente de Prisma para usar en la aplicación
- `.env`: Contiene la variable `DATABASE_URL` que apunta a la base de datos

## 🚀 Uso

Para usar Prisma en cualquier parte de la aplicación, importa el cliente desde `src/lib/prisma.ts`:

```typescript
import { prisma } from '@/lib/prisma';

// Ejemplo de uso
async function getImages() {
  return await prisma.image.findMany({
    include: {
      folder: true,
      tags: true
    }
  });
}
```

## 🛠️ Comandos útiles

- **Reset completo**: `pnpm run db:full-reset` - Resetea completamente la base de datos
- **Verificar estado**: `pnpm run db:check` - Verifica el estado de la base de datos
- **Abrir Prisma Studio**: `pnpm run db:studio` - Abre Prisma Studio para explorar y editar datos
- **Generar cliente**: `npx prisma generate` - Genera el cliente de Prisma
- **Sincronizar esquema**: `npx prisma db push` - Sincroniza el esquema con la base de datos
- **Ejecutar seed**: `npx prisma db seed` - Ejecuta el seed para poblar la base de datos

## 🔍 Estructura del esquema

El esquema de Prisma (`prisma/schema.prisma`) define varios modelos principales:

- **Image**: Imágenes gestionadas por la aplicación
- **Folder**: Carpetas que contienen imágenes
- **Tag**: Etiquetas para clasificar imágenes
- **Album**: Colecciones de imágenes
- **Collection**: Agrupaciones de imágenes por tema
- **QueueJob**: Sistema de colas para procesamiento en segundo plano

## 📝 Scripts de base de datos

Todos los scripts relacionados con la base de datos se encuentran en la carpeta `scripts/db`:

### Reset de la base de datos (`scripts/db/reset.js`)

Para resetear completamente la base de datos, usa:

```bash
pnpm run db:full-reset
```

Este script:
1. Crea el archivo `.env` si no existe
2. Elimina la base de datos SQLite existente
3. Elimina el directorio de migraciones
4. Genera el cliente Prisma
5. Sincroniza el esquema con la base de datos usando `prisma db push`
6. Ejecuta el seed para poblar la base de datos

### Verificación de la base de datos (`scripts/db/check.js`)

Para verificar el estado de la base de datos, usa:

```bash
pnpm run db:check
```

Este script verifica:
1. La existencia y configuración del archivo `.env`
2. La existencia y tamaño de la base de datos SQLite
3. La existencia y cantidad de migraciones
4. La generación del cliente Prisma
5. La conexión con la base de datos

### Prisma Studio (`scripts/db/studio.js`)

Para abrir Prisma Studio y explorar/editar los datos, usa:

```bash
pnpm run db:studio
```

## 🧰 Utilidades

El archivo `src/lib/db-utils.ts` contiene funciones útiles para trabajar con la base de datos:

- `withTransaction`: Ejecuta una transacción con reintentos automáticos
- `testDatabaseConnection`: Verifica la conexión a la base de datos
- `getDatabaseStats`: Obtiene estadísticas básicas de la base de datos
- `cleanupOrphanedRecords`: Limpia registros huérfanos en la base de datos