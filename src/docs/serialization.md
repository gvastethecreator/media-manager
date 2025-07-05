# 🛡️ Solución para el manejo de datos binarios en Next.js

> **Nota 2025-07:** Esta guía se conserva solo como referencia histórica. Tras la migración a **Bun + Vite + React**, la serialización de datos binarios se maneja directamente en la API Express y ya no depende de las restricciones de Next.js.

## 📌 Problema: Serialización de Uint8Array y Buffer

Next.js lanza un error cuando se intentan pasar objetos binarios (`Uint8Array` o `Buffer`) desde Server Components/Actions a Client Components:

```
Only plain objects can be passed to Client Components from Server Components. Uint8Array objects are not supported.
```

Este problema ocurre principalmente cuando manejamos imágenes y thumbnails que se guardan como datos binarios en la base de datos.

## ✅ Soluciones implementadas

### 1. Función genérica para asegurar serialización (`ensureSerializableThumbnails`)

Se ha implementado en `folder-crud.actions.ts` una función robusta que:

- Detecta y convierte cualquier `Uint8Array` o `Buffer` a strings base64
- Procesa objetos de forma recursiva, incluso en estructuras anidadas profundamente
- Incluye manejo de errores para mayor robustez

### 2. Procesamiento específico en `get-folder-images.actions.ts`

- Mejorada la conversión de thumbnails para garantizar que siempre sean string o null
- Añadida una verificación adicional antes de devolver los datos
- Implementada validación con Zod para detectar problemas temprano

### 3. Seguridad en `uploaded-images.actions.ts`

- Añadida función `ensureThumbnailsAreStrings` para procesar datos de forma segura
- Implementada validación adicional que intenta serializar los datos a JSON

## 🚀 Buenas prácticas para evitar errores

1. **Transformar siempre los datos binarios**:

   ```typescript
   // ❌ NO devolver directamente datos de la base de datos
   return { thumbnail: image.thumbnail };

   // ✅ SÍ transformar a formato serializable
   return {
     thumbnail: image.thumbnail
       ? `data:image/webp;base64,${Buffer.from(image.thumbnail).toString('base64')}`
       : null
   };
   ```

2. **Usar validación antes de devolver datos**:

   ```typescript
   // Verificar que todos los datos son serializables
   try {
     JSON.parse(JSON.stringify(result));
   } catch (e) {
     // Implementar fallback seguro
   }
   ```

3. **Evitar spreads directos de objetos de Prisma**:

   ```typescript
   // ❌ NO hacer esto
   return { ...prismaObject };

   // ✅ SÍ crear objetos con propiedades explícitas
   return {
     id: prismaObject.id,
     name: prismaObject.name,
     // ... otras propiedades seguras
   };
   ```

## 🔍 Lugares críticos a verificar

- `src/app/actions/*/`: Todas las funciones que devuelven datos al cliente
- `src/app/api/*/`: Endpoints que interactúan con datos binarios
- `src/transformers/*/`: Funciones que transforman datos de la base de datos a tipos del dominio
- `src/services/*/`: Servicios que manejan imágenes, archivos o datos binarios

## 📝 Para pruebas y debugging

Si encuentras errores de serialización:

1. Verifica los logs para encontrar errores de tipo "Error validación de schema"
2. Usa la validación Zod en modo desarrollo para detectar problemas
3. Implementa logs para objetos sospechosos con `console.dir(obj, { depth: null })`
4. Si sospechas de un objeto específico, prueba `Object.prototype.toString.call(obj)` para verificar su tipo real

## 🛠️ Extensiones posibles

1. Implementar un middleware serialización general en `lib/serialization.ts`
2. Crear decoradores para métodos que necesitan garantizar serialización
3. Añadir pruebas unitarias específicas para verificar la correcta transformación de datos binarios
