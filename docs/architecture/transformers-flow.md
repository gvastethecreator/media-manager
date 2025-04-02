# Arquitectura de Transformers y Serializers

Este documento describe la arquitectura y flujo de datos de los transformers y serializers en el sistema.

## Diagrama de Flujo General

```mermaid
graph TD
    A[Datos de Entrada] --> B[Transformers]
    B --> C[Objetos de Dominio]
    C --> D[Serializers]
    D --> E[Datos Persistidos]

    subgraph "Capa de Transformación"
        B --> B1[Folder Transformer]
        B --> B2[Image Transformer]
        B --> B3[Video Transformer]
    end

    subgraph "Capa de Serialización"
        D --> D1[Folder Serializer]
        D --> D2[Image Serializer]
        D --> D3[Video Serializer]
    end

    style A fill:#d4f1f9
    style B fill:#ffecb3
    style C fill:#e1bee7
    style D fill:#c8e6c9
    style E fill:#ffccbc
```

## Flujo de Datos por Entidad

### Folder

```mermaid
graph LR
    A[Datos Folder] --> B[transformFolder]
    B --> C[FolderComplete]
    C --> D[serializeFolderMetadata]
    D --> E[Folder Persistido]

    subgraph "Transformaciones"
        B --> B1[Datos Base]
        B --> B2[Relaciones]
        B --> B3[Metadatos]
    end

    subgraph "Serialización"
        D --> D1[Metadata]
        D --> D2[Stats]
        D --> D3[Path]
    end
```

### Image

```mermaid
graph LR
    A[Datos Image] --> B[transformImage]
    B --> C[ImageComplete]
    C --> D[serializeImageMetadata]
    D --> E[Image Persistida]

    subgraph "Transformaciones"
        B --> B1[Datos Base]
        B --> B2[Thumbnails]
        B --> B3[EXIF]
    end

    subgraph "Serialización"
        D --> D1[Metadata]
        D --> D2[EXIF]
        D --> D3[Stats]
    end
```

### Video

```mermaid
graph LR
    A[Datos Video] --> B[transformVideo]
    B --> C[VideoComplete]
    C --> D[serializeVideoMetadata]
    D --> E[Video Persistido]

    subgraph "Transformaciones"
        B --> B1[Datos Base]
        B --> B2[Chapters]
        B --> B3[PlayState]
    end

    subgraph "Serialización"
        D --> D1[Metadata]
        D --> D2[Chapters]
        D --> D3[PlayState]
    end
```

## Patrones de Implementación

### Transformers

Los transformers son responsables de:
- Convertir datos crudos a objetos de dominio tipados
- Validar y sanitizar datos de entrada
- Aplicar transformaciones de datos necesarias
- Manejar relaciones entre entidades

### Serializers

Los serializers son responsables de:
- Convertir objetos de dominio a formato persistible
- Manejar serialización de metadatos complejos
- Aplicar normalización de datos
- Gestionar el formato de almacenamiento

## Ejemplos de Uso

### Transformación de Folder

```typescript
// Transformación básica
const folderData = {
  id: 'folder-1',
  name: 'My Folder',
  path: '/my-folder'
};
const folder = transformFolder(folderData);

// Transformación con relaciones
const folderWithRelations = transformFolderToComplete({
  ...folderData,
  children: [],
  parent: null
});
```

### Serialización de Image

```typescript
// Serialización de metadatos
const imageMetadata = {
  width: 1920,
  height: 1080,
  format: 'jpeg'
};
const serializedMetadata = serializeImageMetadata(imageMetadata);

// Deserialización
const metadata = deserializeImageMetadata(serializedMetadata);
```

### Transformación de Video

```typescript
// Transformación con estado de reproducción
const videoData = {
  id: 'video-1',
  name: 'My Video',
  playState: JSON.stringify({
    position: 120,
    lastPlayed: new Date()
  })
};
const video = transformVideo(videoData);

// Serialización de capítulos
const chapters = [
  { id: 'ch1', title: 'Intro', startTime: 0 },
  { id: 'ch2', title: 'Main', startTime: 60 }
];
const serializedChapters = serializeVideoChapters(chapters);
```