# Migración de Prisma a Drizzle

Este documento describe el proceso de migración de Prisma a Drizzle ORM en el proyecto Image Manager.

## Motivación

La migración de Prisma a Drizzle se realizó por las siguientes razones:

- **Rendimiento**: Drizzle es significativamente más rápido que Prisma, especialmente en consultas complejas.
- **Menor sobrecarga**: Drizzle es más ligero y tiene menos dependencias.
- **Mayor control sobre SQL**: Drizzle ofrece una API más cercana a SQL nativo.
- **Mejor soporte para SQLite**: Drizzle tiene optimizaciones específicas para SQLite.

## Estructura de archivos

La migración implicó la creación de los siguientes archivos:

- `drizzle.config.ts`: Configuración de Drizzle.
- `src/drizzle/schema.ts`: Definición del esquema de la base de datos.
- `src/drizzle/db.ts`: Configuración de la conexión a la base de datos.
- `src/drizzle/repository.ts`: Capa de abstracción para operaciones de base de datos.
- `src/drizzle/index.ts`: Exportación de todo lo relacionado con Drizzle.

## Pasos de la migración

1. **Instalación de dependencias**:

   ```bash
   npm install drizzle-orm better-sqlite3
   npm install -D drizzle-kit @types/better-sqlite3
   ```

2. **Configuración de Drizzle**:
   Se creó el archivo `drizzle.config.ts` para definir la configuración de Drizzle.

3. **Definición del esquema**:
   Se creó el archivo `src/drizzle/schema.ts` para definir el esquema de la base de datos.

4. **Configuración de la conexión**:
   Se creó el archivo `src/drizzle/db.ts` para configurar la conexión a la base de datos.

5. **Capa de abstracción**:
   Se creó el archivo `src/drizzle/repository.ts` para proporcionar una capa de abstracción sobre las operaciones de base de datos.

6. **Aplicación de migraciones**:
   Se ejecutó el comando `npx drizzle-kit push` para aplicar las migraciones.

## Comparación de consultas

### Prisma vs Drizzle

#### Obtener todos los registros

**Prisma**:

```typescript
const profiles = await prisma.profile.findMany();
```

**Drizzle**:

```typescript
const profiles = await db.select().from(profiles);
```

#### Obtener un registro por ID

**Prisma**:

```typescript
const profile = await prisma.profile.findUnique({
	where: { id },
});
```

**Drizzle**:

```typescript
const result = await db.select().from(profiles).where(eq(profiles.id, id));
const profile = result[0] || null;
```

#### Crear un registro

**Prisma**:

```typescript
const profile = await prisma.profile.create({
	data: {
		name,
		emoji,
		color,
		// ...
	},
});
```

**Drizzle**:

```typescript
const result = await db
	.insert(profiles)
	.values({
		name,
		emoji,
		color,
		// ...
	})
	.returning();
const profile = result[0];
```

#### Actualizar un registro

**Prisma**:

```typescript
const profile = await prisma.profile.update({
	where: { id },
	data: {
		name,
		emoji,
		color,
		// ...
	},
});
```

**Drizzle**:

```typescript
const result = await db
	.update(profiles)
	.set({
		name,
		emoji,
		color,
		// ...
	})
	.where(eq(profiles.id, id))
	.returning();
const profile = result[0];
```

#### Eliminar un registro

**Prisma**:

```typescript
await prisma.profile.delete({
	where: { id },
});
```

**Drizzle**:

```typescript
await db.delete(profiles).where(eq(profiles.id, id));
```

## Ventajas de Drizzle

- **Rendimiento**: Drizzle es significativamente más rápido que Prisma.
- **Menor sobrecarga**: Drizzle es más ligero y tiene menos dependencias.
- **Mayor control sobre SQL**: Drizzle ofrece una API más cercana a SQL nativo.
- **Mejor soporte para SQLite**: Drizzle tiene optimizaciones específicas para SQLite.
- **Tipado fuerte**: Drizzle proporciona tipado fuerte para consultas y resultados.

## Desafíos de la migración

- **Cambio de paradigma**: Pasar de un ORM a un constructor de consultas SQL requiere un cambio de mentalidad.
- **Reescritura de consultas**: Todas las consultas deben ser reescritas para usar la sintaxis de Drizzle.
- **Relaciones**: Las relaciones en Drizzle requieren más configuración manual que en Prisma.

## Conclusión

La migración de Prisma a Drizzle ha sido exitosa y ha proporcionado mejoras significativas en rendimiento y control sobre las consultas SQL. Aunque requirió un esfuerzo considerable para reescribir las consultas, los beneficios a largo plazo justifican el esfuerzo.

## Recursos

- [Documentación oficial de Drizzle](https://orm.drizzle.team/docs/overview)
- [Guía de migración de Prisma a Drizzle](https://orm.drizzle.team/docs/migrate/migrate-from-prisma)
- [Ejemplos de consultas con Drizzle](https://orm.drizzle.team/docs/sql-schema-declaration)
