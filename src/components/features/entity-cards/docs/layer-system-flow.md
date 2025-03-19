# Flujo del Sistema de Capas para Entity Cards

Este documento visualiza mediante diagramas la arquitectura, flujo de datos y componentes del sistema de capas integrado en las tarjetas de entidad.

## Arquitectura general

```mermaid
graph TD
    A[Entity Card] --> B[EntityCardLayersIntegration]
    B --> C[LayersProvider]
    B --> D[RegisterLayersV2ByEntityType]
    B --> E[LayerRenderer]

    C --> F[Sistema de estado de capas]
    D --> G[Registro de capas]
    E --> H[Renderizado de capas]

    I[Capa de Borde] --> G
    J[Capa de Brillo] --> G
    K[Capa de Textura] --> G
    L[Capa de Scanlines] --> G

    G --> M[Store de capas registradas]
    M --> H

    F --> N[Configuración de capas]
    N --> H

    style A fill:#f9d5e5,stroke:#333,stroke-width:2px
    style B fill:#eeeeee,stroke:#333,stroke-width:2px
    style C fill:#d5e8d4,stroke:#333,stroke-width:2px
    style D fill:#d5e8d4,stroke:#333,stroke-width:2px
    style E fill:#d5e8d4,stroke:#333,stroke-width:2px
    style F fill:#dae8fc,stroke:#333,stroke-width:2px
    style G fill:#dae8fc,stroke:#333,stroke-width:2px
    style H fill:#dae8fc,stroke:#333,stroke-width:2px
    style M fill:#ffe6cc,stroke:#333,stroke-width:2px
    style N fill:#ffe6cc,stroke:#333,stroke-width:2px
```

## Flujo de registro de capas

```mermaid
sequenceDiagram
    participant EC as Entity Card
    participant LI as LayersIntegration
    participant LP as LayersProvider
    participant RL as RegisterLayers
    participant LH as useLayers Hook

    EC->>LI: Renderizar con opciones
    LI->>LP: Inicializar provider
    LI->>RL: Registrar capas para entityType
    RL->>LH: Obtener funciones registerLayer

    loop Para cada capa
        RL->>LH: registerLayer(implementación)
        LH->>LP: Actualizar capas registradas
    end

    LI->>EC: Renderizar contenido con capas

    Note over LP,LH: El estado de las capas se mantiene en el contexto
```

## Arquitectura de una capa individual

```mermaid
classDiagram
    class LayerImplementation {
        +string type
        +string name
        +string description
        +string category
        +object defaultConfig
        +React.ReactNode icon
        +string[] compatibleEntityTypes
        +function render()
        +component Settings
    }

    class LayerConfig {
        +boolean enabled
        +number layerIndex
        +PropiedadesEspecíficas props
    }

    class CapaIndividual {
        +LayerImplementation implementation
        +LayerConfig config
        +ServerActions actions
    }

    LayerImplementation "1" -- "1" LayerConfig: usa >
    CapaIndividual "1" *-- "1" LayerImplementation: implementa
    CapaIndividual "1" *-- "1" LayerConfig: configura
```

## Flujo de renderizado de capas

```mermaid
flowchart TD
    A[EntityCardLayersIntegration] --> B{¿Sistema habilitado?}
    B -->|Sí| C[Obtener capas registradas]
    B -->|No| D[Renderizar solo contenido base]

    C --> E[Filtrar capas habilitadas]
    E --> F[Ordenar por layerIndex]

    F --> G[Renderizar contenido base]
    G --> H[Renderizar capas en orden]

    H --> I{¿Capa requiere hover?}
    I -->|Sí| J{¿Está en hover?}
    J -->|Sí| K[Renderizar capa]
    J -->|No| L[Omitir capa]
    I -->|No| K

    K --> M[Siguiente capa]
    L --> M

    style A fill:#f9d5e5
    style B fill:#dae8fc
    style C fill:#d5e8d4
    style D fill:#f8cecc
    style E fill:#d5e8d4
    style F fill:#d5e8d4
    style G fill:#ffe6cc
    style H fill:#ffe6cc
    style I fill:#dae8fc
    style J fill:#dae8fc
    style K fill:#d5e8d4
    style L fill:#f8cecc
```

## Integración con sistema de configuración

```mermaid
graph LR
    A[Entity Card] -->|cardOptions| B[LayersIntegration]
    B -->|adaptCardOptionsToLayersConfig| C[LayersProvider]

    D[Panel de Configuración] -->|updateLayerConfig| E[useLayers Hook]
    E -->|actualizar estado| C

    F[Presets] -->|cargar configuración| D
    D -->|guardar preset| F

    style A fill:#f9d5e5
    style B fill:#d5e8d4
    style C fill:#dae8fc
    style D fill:#ffe6cc
    style E fill:#dae8fc
    style F fill:#e1d5e7
```

## Ciclo de optimización de rendimiento

```mermaid
graph TD
    A[Componente padre] --> B[EntityCardLayersIntegration]
    B --> C[LayerRenderer memoizado]

    C -->|useMemo| D[Cálculo de capas]
    C -->|useCallback| E[Función renderLayer]

    F[Props de entrada] --> G{¿Cambios relevantes?}
    G -->|Sí| H[Re-renderizar]
    G -->|No| I[Usar versión memoizada]

    J[Configuración de capas] -->|useState| K[Gestión de estado]
    K -->|memoización| L[Evitar recreación de funciones]

    style A fill:#f9d5e5
    style B fill:#d5e8d4
    style C fill:#dae8fc
    style D fill:#ffe6cc
    style E fill:#ffe6cc
    style F fill:#f9d5e5
    style G fill:#dae8fc
    style H fill:#f8cecc
    style I fill:#d5e8d4
    style J fill:#e1d5e7
    style K fill:#ffe6cc
    style L fill:#d5e8d4
```

Este conjunto de diagramas proporciona una visión completa del sistema de capas, su arquitectura, flujo de datos y técnicas de optimización de rendimiento.