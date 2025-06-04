# 📊 Diagramas de Flujo del Componente de Carpetas

## 🔄 Flujo de Navegación Principal

```mermaid
flowchart TD
    A[Usuario] -->|Click en Carpeta| B[folders-view.tsx]
    B -->|handleFolderClick| C{Validar Carpeta}
    C -->|Carpeta Válida| D[Actualizar Navigation Store]
    C -->|Carpeta Inválida| E[Mostrar Error]
    D -->|setCurrentView| F[folder-content-view.tsx]
    F -->|useFolderImages| G[getFolderImages]
    G -->|Consulta DB| H[Prisma]
    H -->|Retorna Imágenes| I[Transformar a FileItem]
    I -->|Render| J[FileBrowser]
    J -->|Mostrar Imágenes| K[Usuario ve contenido]
```

## 🔄 Flujo de Reindexación de Carpetas

```mermaid
flowchart TD
    A[Usuario] -->|Click en Reindexar| B[handleReindex]
    B -->|Llamar API| C[reindexFolder]
    C -->|Procesar Carpeta| D{Verificar Carpeta}
    D -->|Carpeta Existe| E[Escanear Archivos]
    D -->|Carpeta No Existe| F[Error]
    E -->|Procesar Imágenes| G[processImageBatch]
    G -->|Por Lotes| H[Crear/Actualizar en DB]
    H -->|Completado| I[refetch]
    I -->|Actualizar UI| J[Mostrar Nuevas Imágenes]
```

## 🔄 Flujo de Datos del Hook useFolderImages

```mermaid
flowchart LR
    A[folder-content-view] -->|currentFolderId| B[useFolderImages]
    B -->|queryKey| C[React Query Cache]
    C -->|Cache Hit| D[Retornar Datos Cacheados]
    C -->|Cache Miss| E[getFolderImages]
    E -->|folderId| F[Prisma Query]
    F -->|DB Results| G[Transformar Datos]
    G -->|FileItem[]| H[Actualizar Cache]
    H -->|data| I[folder-content-view]
    D -->|data| I
```

## 🔄 Flujo de Estado de Carga

```mermaid
flowchart TD
    A[folder-content-view] -->|isLoading| B{Estado de Carga}
    B -->|true| C[Mostrar LoadingSpinner]
    B -->|false| D{¿Hay Imágenes?}
    D -->|No| E[Mostrar EmptyState]
    D -->|Sí| F[Mostrar FileBrowser]
    E -->|Click en Reindexar| G[handleReindex]
    G -->|Completado| H[refetch]
    H --> A
```

## 🔄 Arquitectura del Sistema de Carpetas

```mermaid
flowchart TD
    subgraph "Frontend Components"
        A[folders-view.tsx]
        B[folder-content-view.tsx]
        C[folder-tree-view.tsx]
    end

    subgraph "Hooks & State"
        D[useFolderImages]
        E[useFolder]
        F[useFolderStore]
    end

    subgraph "Server Actions"
        G[getFolderImages]
        H[reindexFolder]
        I[getFolders]
    end

    subgraph "Database"
        J[Prisma Client]
        K[(Database)]
    end

    A -->|Navigate| B
    B -->|Use| D
    A -->|Use| E
    A -->|Use| F
    B -->|Use| E

    D -->|Call| G
    E -->|Call| I
    B -->|Call| H

    G -->|Query| J
    H -->|Query| J
    I -->|Query| J

    J -->|Access| K
```

## 🔄 Flujo de Interacción del Usuario

```mermaid
sequenceDiagram
    actor User
    participant FV as folders-view
    participant FS as FolderStore
    participant FCV as folder-content-view
    participant UFI as useFolderImages
    participant GFI as getFolderImages
    participant DB as Database

    User->>FV: Click en Carpeta
    FV->>FS: setCurrentFolder(id)
    FV->>FV: Navegar a contenido
    FV->>FCV: Renderizar vista
    FCV->>UFI: Llamar hook(folderId)
    UFI->>UFI: Verificar caché
    UFI->>GFI: Solicitar imágenes
    GFI->>DB: Consultar imágenes
    DB->>GFI: Retornar resultados
    GFI->>UFI: Transformar datos
    UFI->>FCV: Retornar FileItem[]
    FCV->>User: Mostrar imágenes

    User->>FCV: Click en Reindexar
    FCV->>DB: reindexFolder(id)
    DB->>FCV: Confirmar reindexación
    FCV->>UFI: refetch()
    UFI->>GFI: Solicitar imágenes actualizadas
    GFI->>DB: Consultar imágenes
    DB->>GFI: Retornar resultados actualizados
    GFI->>UFI: Transformar datos
    UFI->>FCV: Retornar FileItem[] actualizados
    FCV->>User: Mostrar imágenes actualizadas
```

## 🔄 Estructura de Datos

```mermaid
classDiagram
    class Folder {
        +string id
        +string name
        +string path
        +string description
        +string emoji
        +string color
        +string parentId
        +Date createdAt
        +Date updatedAt
        +boolean isAutoIndex
        +Date lastIndexed
        +number totalFiles
        +number totalSize
    }

    class Image {
        +string id
        +string name
        +string path
        +number size
        +number width
        +number height
        +string metadata
        +string thumbnail
        +number thumbnailSize
        +number thumbnailWidth
        +number thumbnailHeight
        +string folderId
        +Date createdAt
        +Date updatedAt
    }

    class FileItem {
        +string id
        +string name
        +string path
        +string type
        +string mimeType
        +string processingStatus
        +number size
        +number width
        +number height
        +string metadata
        +string thumbnail
        +number thumbnailSize
        +number thumbnailWidth
        +number thumbnailHeight
        +Date createdAt
        +Date updatedAt
        +Tag[] tags
    }

    class Tag {
        +string id
        +string name
        +string color
    }

    Folder "1" --> "many" Image : contains
    Image --> FileItem : transforms to
    FileItem "many" --> "many" Tag : has
```