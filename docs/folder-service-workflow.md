# Flujo de trabajo del Servicio de Carpetas

Este documento describe el flujo de trabajo del servicio de carpetas, particularmente enfocado en el proceso de reindexación.

## Proceso de Reindexación

El proceso de reindexación de carpetas permite actualizar la información en la base de datos acerca de los archivos presentes en una carpeta del sistema de archivos. Este proceso incluye:

1. Escaneo de la carpeta
2. Limpieza de imágenes huérfanas (que ya no existen en el sistema de archivos)
3. Procesamiento por lotes de las imágenes encontradas
4. Actualización de estadísticas de la carpeta

```mermaid
sequenceDiagram
    participant UI as Cliente/UI
    participant Service as FolderService
    participant Actions as ServerActions
    participant DB as Base de Datos
    participant FS as Sistema de Archivos

    UI->>Service: reindexFolder(id, callbacks)
    Service->>Service: withConcurrencyControl
    Service->>Actions: reindexFolderAction(id, options)

    Actions->>DB: Obtener información de carpeta
    Actions->>FS: Escanear carpeta (scanFolder)
    FS-->>Actions: Devuelve listado de archivos

    alt deleteOrphans=true
        Actions->>DB: Obtener imágenes existentes
        Actions->>Actions: Identificar imágenes huérfanas
        Actions->>DB: Eliminar imágenes huérfanas en lotes
    end

    loop Para cada lote de imágenes
        Actions->>DB: Procesar lote (createOrUpdate)
        Actions->>Service: Notificar progreso
        Service->>UI: Callback onProgress
    end

    Actions->>DB: Actualizar estadísticas de carpeta
    Actions->>Actions: Revalidar rutas

    Actions-->>Service: Devolver FolderResponse
    Service->>Service: Emitir eventos
    Service->>UI: Notificar finalización
```

## Arquitectura de Eventos

El servicio de carpetas implementa un sistema de eventos para notificar cambios en tiempo real.

```mermaid
graph TD
    A[Cliente/UI] -->|Solicita reindexación| B[FolderService]
    B -->|Invoca| C[ServerActions]
    C -->|Procesa carpeta| D[Base de Datos]

    C -.->|Emite progreso| E[EventEmitter]
    B -.->|Captura eventos| E
    E -.->|Notifica| B
    B -.->|Callbacks| A

    subgraph Eventos
    E -->|folder:progress| F[onProgress]
    E -->|folder:error| G[onError]
    E -->|folder:complete| H[onComplete]
    E -->|folder:stats| I[onStats]
    end

    style E fill:#f9f,stroke:#333,stroke-width:4px
```

## Control de Concurrencia

Para evitar sobrecargar el sistema, el servicio implementa un control de concurrencia que:

1. Limita el número de operaciones paralelas
2. Procesa los archivos en lotes
3. Evita iniciar operaciones duplicadas

```mermaid
graph TD
    A[Solicitud reindexFolder] -->|Verifica concurrencia| B{withConcurrencyControl}
    B -->|Ocupado| C[Rechaza con OperationInProgress]
    B -->|Disponible| D[Marca operación como activa]
    D --> E[Ejecuta reindexación]
    E --> F[Procesa lotes con PQueue]
    F -->|Concurrencia=3| G[Batch 1]
    F -->|Concurrencia=3| H[Batch 2]
    F -->|Concurrencia=3| I[Batch 3]
    G --> J[Completa operación]
    H --> J
    I --> J
    J --> K[Limpia estado]

    style B fill:#ff9,stroke:#333,stroke-width:2px
    style F fill:#9f9,stroke:#333,stroke-width:2px
```

Este enfoque funcional permite un procesamiento eficiente y resiliente de grandes volúmenes de archivos, mientras mantiene al usuario informado del progreso en tiempo real.