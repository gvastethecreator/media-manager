# 🔒 Convenciones de Serialización Segura

## 📋 Problema

Next.js tiene restricciones sobre qué tipos de datos pueden enviarse desde Server Components a Client Components:

> ⚠️ **Error**: Only plain objects can be passed to Client Components from Server Components. **Uint8Array objects are not supported.**

Este error ocurre cuando intentamos pasar objetos binarios (Buffer, Uint8Array) o tipos complejos no serializables desde Server Actions a componentes React en el cliente.

## 🛡️ Solución

Para evitar problemas de serialización, seguimos estas convenciones:

### 1. ✅ Nunca enviar objetos Prisma directamente

```typescript
// ❌ INCORRECTO - Puede contener campos binarios no serializables
return {
  item: prismaDatabaseObject
};

// ✅ CORRECTO - Crear un nuevo objeto plano con solo datos serializables
return {
  item: {
    id: prismaDatabaseObject.id,
    name: prismaDatabaseObject.name,
    // ...otros campos serializables explícitos
  }
};
```

### 2. 🧩 Transformar campos binarios

```typescript
// ❌ INCORRECTO - thumbnail puede ser un Buffer/Uint8Array
return {
  thumbnail: image.thumbnail
};

// ✅ CORRECTO - Convertir a string o null explícitamente
let safeThumbnail = null;
if (thumbnailUrl) {
  safeThumbnail = thumbnailUrl;
} else if (image.thumbnail && Buffer.isBuffer(image.thumbnail)) {
  safeThumbnail = `data:image/webp;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
}

return {
  thumbnail: safeThumbnail // Siempre string o null
};
```

### 3. 📅 Convertir fechas a strings ISO

```typescript
// ❌ INCORRECTO - Date no es serializable
return {
  createdAt: image.createdAt
};

// ✅ CORRECTO - Convertir explícitamente a ISO string
return {
  createdAt: image.createdAt.toISOString()
};
```

### 4. 🧪 Validar con Zod

Para garantizar que solo datos serializables lleguen al cliente, validar con Zod:

```typescript
const safeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  thumbnail: z.string().nullable(),
  createdAt: z.string(), // ISO string, no Date
  // ...otros campos
});

const safeItem = {
  id: image.id,
  name: image.name,
  thumbnail: safeThumbnail,
  createdAt: image.createdAt.toISOString(),
  // ...
};

// Validar antes de retornar
safeItemSchema.parse(safeItem);
return safeItem;
```

## 🚀 Ejemplo Completo

```typescript
// Server Component o Server Action
export async function getImageData(id: string) {
  const prismaImage = await prisma.image.findUnique({
    where: { id }
  });

  if (!prismaImage) return null;

  // Transformar a formato seguro para serialización
  return {
    id: prismaImage.id,
    name: prismaImage.name,
    thumbnail: prismaImage.thumbnail
      ? `data:image/webp;base64,${Buffer.from(prismaImage.thumbnail).toString('base64')}`
      : null,
    createdAt: prismaImage.createdAt.toISOString(),
    metadata: prismaImage.metadata ? JSON.stringify(prismaImage.metadata) : null,
    // Booleanos seguros
    isPublic: Boolean(prismaImage.isPublic),
    isFavorite: Boolean(prismaImage.isFavorite)
  };
}
```

## 📘 Referencias

- [NextJS Documentation: Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Serialization in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description)
