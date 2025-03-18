# Diagrama de Flujo: Sistema de Vistas con EntityCard

Este documento describe el flujo de trabajo y la arquitectura del nuevo sistema de vistas que utiliza el componente EntityCard.

## Diagrama de Arquitectura

```mermaid
graph TD
    subgraph "Plantillas Base"
        EntityViewTemplate["EntityView<T>"]
        EntityContentViewTemplate["EntityContentView<T>"]
    end

    subgraph "Vistas Específicas"
        TagsView["TagsView"]
        TagContentView["TagContentView"]
        AlbumsView["AlbumsView (Futuro)"]
        AlbumContentView["AlbumContentView (Futuro)"]
        CollectionsView["CollectionsView (Futuro)"]
        CollectionContentView["CollectionContentView (Futuro)"]
    end

    subgraph "Sistema de Tarjetas"
        EntityCardAdapter["EntityCardAdapter"]
        LayerPluginSystem["LayerPluginSystem"]
        RegisterLayers["RegisterEntityTypeLayers"]
    end

    subgraph "Almacenamiento"
        Stores["Zustand Stores"]
        ServerActions["Server Actions"]
    end

    EntityViewTemplate --> EntityCardAdapter
    EntityContentViewTemplate --> EntityCardAdapter

    TagsView --> EntityViewTemplate
    TagContentView --> EntityContentViewTemplate
    AlbumsView --> EntityViewTemplate
    AlbumContentView --> EntityContentViewTemplate
    CollectionsView --> EntityViewTemplate
    CollectionContentView --> EntityContentViewTemplate

    EntityCardAdapter --> LayerPluginSystem
    EntityCardAdapter --> RegisterLayers

    TagsView --> ServerActions
    TagContentView --> ServerActions

    TagsView --> Stores
    TagContentView --> Stores
```

## Flujo de Datos

```mermaid
sequenceDiagram
    participant User as Usuario
    participant View as Vista (TagsView)
    participant Template as Plantilla (EntityView)
    participant Adapter as EntityCardAdapter
    participant Layers as Sistema de Capas
    participant Store as Zustand Store
    participant Server as Server Actions

    User->>View: Interactúa con la UI
    View->>Template: Renderiza con props específicas
    Template->>Server: fetchEntities()
    Server-->>Template: Datos de entidades
    Template->>Store: Actualiza estado optimista
    Template->>Adapter: Renderiza cada entidad
    Adapter->>Layers: Registra capas específicas
    Layers-->>Adapter: Aplica capas visuales
    Adapter-->>Template: Renderiza tarjeta
    Template-->>View: Muestra vista completa
    View-->>User: Visualiza entidades

    User->>View: Hace clic en entidad
    View->>Store: Actualiza entidad seleccionada
    View->>User: Navega a vista de contenido
```

## Flujo de Interacción

```mermaid
stateDiagram-v2
    [*] --> ListaEntidades: Carga inicial

    state ListaEntidades {
        [*] --> CargandoEntidades
        CargandoEntidades --> MostrandoEntidades: Datos cargados
        CargandoEntidades --> ErrorCarga: Error
        MostrandoEntidades --> SeleccionEntidad: Clic en entidad
    }

    SeleccionEntidad --> ContenidoEntidad: Navega a contenido

    state ContenidoEntidad {
        [*] --> CargandoContenido
        CargandoContenido --> MostrandoContenido: Datos cargados
        CargandoContenido --> ContenidoVacio: Sin elementos
        CargandoContenido --> ErrorContenido: Error
        MostrandoContenido --> VisualizacionElemento: Doble clic en elemento
    }

    VisualizacionElemento --> ContenidoEntidad: Cierra visualizador
    ContenidoEntidad --> ListaEntidades: Vuelve a lista
```
