# 🗂️ Entidad File3D

## Descripción

La entidad `File3D` representa archivos tridimensionales como modelos 3D, escenas o recursos que pueden ser almacenados y gestionados en el sistema. Estos archivos pueden ser utilizados en visualizaciones 3D, prototipos digitales, entornos virtuales, etc.

## Estructura

```mermaid
graph TD
    A[File3D Entity] --> B[Types]
    A --> C[Transformers]
    A --> D[Documentación]
    B --> B1[types.ts]
    B --> B2[index.ts]
    B --> B3[file3d.schema.ts]
    C --> C1[transformers]
    D --> D1[documentation.md]
```

## Tipos principales

- `File3DBase`: Tipo base con campos fundamentales
- `File3DCreateInput`: Input para creación de archivos 3D
- `File3DUpdateInput`: Input para actualización de archivos 3D

## Ejemplo de uso

```typescript
import { createFile3D, updateFile3D, getFile3D } from '@/transformers/file3d';

// Crear un nuevo archivo 3D
const nuevoArchivo = await createFile3D({
  name: 'Modelo de producto',
  filePath: '/models/producto.glb',
  format: 'glb',
  size: 2048576 // tamaño en bytes (2MB)
});

// Obtener un archivo 3D existente
const archivo = await getFile3D(nuevoArchivo.id);

// Actualizar un archivo 3D existente
await updateFile3D(nuevoArchivo.id, {
  name: 'Modelo de producto actualizado',
  size: 3145728 // tamaño actualizado (3MB)
});
```

## Flujo de datos

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Transformer
    participant DB
    Client->>API: createFile3D()
    API->>Transformer: mapCreateFile3DDataToPrisma()
    
    DB-->>Transformer: File3D
    Transformer-->>API: transformFile3D()
    API-->>Client: File3DBase
```

## Mejores prácticas

- Usar siempre los tipos canónicos (`File3DCreateInput`, `File3DUpdateInput`, `File3DBase`).
- Validar los datos antes de crear/actualizar con el esquema Zod `file3DSchema`.
- Soportar múltiples formatos comunes de archivos 3D como GLB, OBJ, FBX, GLTF, etc.
- Considerar metadatos adicionales como dimensiones, polígonos, texturas, etc.
- Implementar previsualización de modelos 3D en la interfaz de usuario.

## Integración

Los archivos 3D pueden integrarse con:

- Visualizadores 3D en la aplicación
- Herramientas de diseño y prototipado
- Catálogos de productos o recursos
- Entornos virtuales o de realidad aumentada

## Migración a tipos canónicos

✅ Tipos canónicos implementados desde el inicio, documentación y diagrama actualizados.

---

> Última actualización: 2025-06-18