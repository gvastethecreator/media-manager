# Nuevas Entidades en Prisma Schema (junio 2025)

Este documento describe los nuevos modelos agregados al esquema de Prisma para soportar archivos avanzados y tipos de contenido extendido en el Image Manager.

## 📦 Modelos Agregados

### Workflow

Modelo para almacenar archivos de flujo de trabajo en formato JSON.

```prisma
model Workflow {
  id        String   @id @default(cuid())
  name      String
  filePath  String   // Ruta al archivo JSON
  content   String   // Contenido JSON (puede ser largo)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Document

Modelo para documentos en texto plano o Markdown.

```prisma
model Document {
  id        String   @id @default(cuid())
  name      String
  filePath  String   // Ruta al archivo md o txt
  content   String   // Contenido del documento
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### JsonFile

Modelo para archivos JSON genéricos (no relacionados a workflow).

```prisma
model JsonFile {
  id        String   @id @default(cuid())
  name      String
  filePath  String   // Ruta al archivo JSON
  content   String   // Contenido JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### File3D

Modelo para archivos 3D (preparado para futuras implementaciones).

```prisma
model File3D {
  id        String   @id @default(cuid())
  name      String
  filePath  String   // Ruta al archivo 3D
  format    String   // Formato (glb, obj, fbx, etc)
  size      Int      // Tamaño en bytes
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Audio

Modelo para archivos de audio.

```prisma
model Audio {
  id        String   @id @default(cuid())
  name      String
  filePath  String   // Ruta al archivo de audio
  format    String   // Formato (mp3, wav, flac, etc)
  duration  Int?     // Duración en segundos
  size      Int      // Tamaño en bytes
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 📝 Notas de implementación

- Todos los modelos siguen el patrón de timestamp (`createdAt`, `updatedAt`).
- Los campos `filePath` y `content` permiten almacenar la ruta y el contenido del archivo.
- `File3D` y `Audio` incluyen metadatos relevantes para su tipo.
- No se han definido relaciones aún; se recomienda analizar los flujos de uso antes de vincular con otras entidades.

## 🗂️ Ejemplo de uso

- Para crear un nuevo documento, basta con insertar un registro en el modelo correspondiente.
- Los archivos pueden ser gestionados como entidades independientes o relacionados a otras entidades en el futuro.

---

> Última actualización: 2025-06-17
