# Arquitectura del Sistema Entity Cards

## Diagrama de Componentes

```mermaid
graph TD
    subgraph "Componentes Principales"
        EntityCard[EntityCard]
        EntityCardAdapter[EntityCardAdapter]
        EntityCardContent[EntityCardContent]
        EntityCardWrapper[EntityCardWrapper]
        EntityCardLayerWrapper[EntityCardLayerWrapper]
    end

    subgraph "Sistema de Capas"
        LayerRenderer[LayerRenderer]
        LayerPluginSystem[LayerPluginSystem]
        RegisterLayers[RegisterLayers]

        subgraph "Capas Individuales"
            GlowLayer[GlowLayer]
            BorderLayer[BorderLayer]
            ScanlinesLayer[ScanlinesLayer]
            HolographicLayer[HolographicLayer]
            GrainLayer[GrainLayer]
            ShaderLayer[ShaderLayer]
        end
    end

    subgraph "Layouts Específicos"
        AlbumCardLayout[AlbumCardLayout]
        FolderCardLayout[FolderCardLayout]
        TagCardLayout[TagCardLayout]
        ImageCardLayout[ImageCardLayout]
    end

    subgraph "Módulos"
        AnimationModule[AnimationModule]
        BacksideModule[BacksideModule]
        ColorsModule[ColorsModule]
        CoreModule[CoreModule]
        DesignModule[DesignModule]
    end

    subgraph "Sistema de Tipos"
        TypesIndex[types/index.ts]
        UnifiedCardTypes[unified-card-types.ts]
        CardLayerTypes[card-layer-types.ts]
        BaseCardTypes[base-card-types.ts]
        SharedCardTypes[shared-card-types.ts]
    end

    subgraph "Utilidades"
        ErrorHandler[error-handler.tsx]
        CardUtils[card-utils.ts]
    end

    EntityCard --> EntityCardContent
    EntityCard --> LayerRenderer
    EntityCard --> BacksideModule
    EntityCard --> ErrorHandler

    EntityCardAdapter --> EntityCardWrapper
    EntityCardAdapter --> AlbumCardLayout
    EntityCardAdapter --> FolderCardLayout
    EntityCardAdapter --> TagCardLayout
    EntityCardAdapter --> ImageCardLayout

    LayerRenderer --> GlowLayer
    LayerRenderer --> BorderLayer
    LayerRenderer --> ScanlinesLayer
    LayerRenderer --> HolographicLayer
    LayerRenderer --> GrainLayer
    LayerRenderer --> ShaderLayer

    EntityCard --> AnimationModule
    EntityCard --> ColorsModule
    EntityCard --> DesignModule

    TypesIndex --> UnifiedCardTypes
    TypesIndex --> CardLayerTypes
    TypesIndex --> BaseCardTypes
    TypesIndex --> SharedCardTypes

    EntityCard --> TypesIndex
    LayerRenderer --> TypesIndex
    EntityCardAdapter --> TypesIndex
    AlbumCardLayout --> TypesIndex
    CardUtils --> TypesIndex
```

## Flujo de Datos

```mermaid
sequenceDiagram
    participant App as Aplicación
    participant Adapter as EntityCardAdapter
    participant Card as EntityCard
    participant Layers as LayerRenderer
    participant Content as EntityCardContent

    App->>Adapter: Renderizar tarjeta con entidad
    Adapter->>Adapter: Seleccionar layout según tipo de entidad
    Adapter->>Card: Pasar entidad y opciones
    Card->>Card: Inicializar hooks y estados

    alt Si hay error
        Card->>ErrorHandler: Manejar error
        ErrorHandler-->>App: Mostrar mensaje de error
    else Sin errores
        Card->>Layers: Renderizar capas visuales
        Card->>Content: Renderizar contenido

        alt Interacción del usuario
            App->>Card: Evento de mouse/teclado
            Card->>Layers: Actualizar estado (hover, etc.)
            Layers-->>App: Efecto visual actualizado
        end
    end
```

## Sistema de Tipos Centralizado (Actualizado)

```mermaid
classDiagram
    class TypesIndex {
        Exporta todos los tipos
    }

    class Entity {
        id: string
        name: string
        description?: string
        [key: string]: any
    }

    class CardOptions {
        entityType: string
        entityId: string
        designSystem: DesignSystem
        animation: AnimationSystem
        colors: ColorPalette
        layers: LayersConfig
        backside: BacksideOptions
    }

    class BaseCardRarityConfig {
        type: string
        color: string
        gradient?: string[]
        pattern?: string
        animation?: object
    }

    class BaseCardTextureConfig {
        type: string
        url?: string
        pattern?: string
        opacity?: number
    }

    class CardMetadata {
        rarity?: string
        stats?: Record<string, number>
        tags?: string[]
        attributes?: Record<string, any>
    }

    class LayerComponentProps {
        isExploded: boolean
        isHovered: boolean
        mousePosition: object
        activeLayer: string
        getExplodeLayerTransform: function
        config: any
        entityType: string
        entityId: string
    }

    class CardError {
        type: CardErrorType
        message: string
        details: string
        componentName: string
        recoverable: boolean
    }

    TypesIndex --> Entity
    TypesIndex --> CardOptions
    TypesIndex --> BaseCardRarityConfig
    TypesIndex --> BaseCardTextureConfig
    TypesIndex --> CardMetadata
    TypesIndex --> LayerComponentProps
    TypesIndex --> CardError
```

## Sistema de Manejo de Errores

```mermaid
flowchart TD
    A[Componente] -->|Error ocurre| B{Tipo de error?}
    B -->|Render| C[CardErrorType.RENDER]
    B -->|Config| D[CardErrorType.CONFIG]
    B -->|Layer| E[CardErrorType.LAYER]
    B -->|Module| F[CardErrorType.MODULE]
    B -->|Network| G[CardErrorType.NETWORK]
    B -->|Unknown| H[CardErrorType.UNKNOWN]

    C & D & E & F & G & H --> I[createErrorHandler]
    I --> J[handleError]
    J --> K{logErrors?}
    K -->|Sí| L[console.error]
    K -->|No| M[Skip logging]
    L & M --> N{onError callback?}
    N -->|Sí| O[Llamar callback]
    N -->|No| P[Skip callback]
    O & P --> Q[CardErrorDisplay]
    Q --> R{recoverable?}
    R -->|Sí| S[Mostrar botón Reintentar]
    R -->|No| T[Solo mostrar mensaje]
```

## Solución de Problemas de Tipos

```mermaid
flowchart TD
    A[Problemas de Tipos] --> B{Tipo de problema}

    B -->|Ambigüedades en exportaciones| C[types/index.ts]
    C -->|Solución| C1[Exportaciones explícitas y selectivas]

    B -->|Incompatibilidades en adaptadores| D[entity-card-adapter.tsx]
    D -->|Solución| D1[Uso de tipo genérico Entity]
    D -->|Solución temporal| D2[Uso estratégico de 'any']

    B -->|Errores en utilidades| E[card-utils.ts]
    E -->|Solución| E1[Corrección de importaciones]
    E -->|Solución| E2[Definición de CardMetadata]

    B -->|Problemas en layouts| F[album-card-layout.tsx]
    F -->|Solución| F1[Actualización de tipos]
    F -->|Solución| F2[Mejora de manejadores de eventos]

    C1 & D1 & D2 & E1 & E2 & F1 & F2 --> G[Sistema de tipos coherente]
```
