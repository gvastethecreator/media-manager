# Diagrama del Sistema de Tarjetas

Este diagrama ilustra la arquitectura del sistema de tarjetas de entidades, mostrando la relación entre los diferentes componentes y layouts.

## Arquitectura General

```mermaid
graph TD
    BaseCard[BaseCard<br/>Componente Base] --> WorldItemCard[WorldItemCard]
    BaseCard --> FolderCard[FolderCard]
    BaseCard --> PlaceCard[PlaceCard]
    BaseCard --> CharacterCard[CharacterCard]
    BaseCard --> TagCard[TagCard]
    BaseCard --> ConceptCard[ConceptCard<br/>Pendiente]
    BaseCard --> NoteCard[NoteCard<br/>Pendiente]
    BaseCard --> PromptCard[PromptCard<br/>Pendiente]
    BaseCard --> AlbumCard[AlbumCard<br/>Pendiente]
    BaseCard --> CollectionCard[CollectionCard<br/>Pendiente]

    BaseTypes[Types<br/>base-card-types.ts] --> BaseCard
    VisualizationConfig[VisualizationConfig] --> BaseCard
    CardConfigManager[CardConfigManager] --> VisualizationConfig
    VisualEffects[VisualEffectsManager] --> VisualizationConfig

    subgraph Capas[Capas Visuales]
        HolographicLayer[HolographicLayer]
        ScanlinesLayer[ScanlinesLayer]
        GlowLayer[GlowLayer]
        GrainLayer[GrainLayer]
        AnimatedBorderLayer[AnimatedBorderLayer]
    end

    Capas --> BaseCard
```

## Estructura del Componente BaseCard

```mermaid
classDiagram
    class BaseCardProps {
        +children: ReactNode
        +className?: string
        +options?: CardOptions
        +rarity?: RarityConfig
        +texture?: TextureConfig
        +onHoverStart?: Function
        +onHoverEnd?: Function
        +onClick?: Function
        +showVisualizationConfig?: boolean
        +enableExplode?: boolean
        +explodeLayers?: ExplodeLayer[]
        +designData?: CardDesignData
        +preset?: CardDesignPreset
    }

    class CardOptions {
        +enable3DEffect?: boolean
        +enableHolographicEffect?: boolean
        +enableScanlinesEffect?: boolean
        +enableGlowEffect?: boolean
        +enableBorderEffect?: boolean
        +enableGrainEffect?: boolean
        +enableScanlines?: boolean
        +enableAnimatedBorder?: boolean
        +raritySystem?: object
        +maxRotation?: number
        +hoverLiftHeight?: number
        +primaryColor?: string
        +secondaryColor?: string
    }

    class RarityConfig {
        +name: string
        +color: string
        +borderEffect?: string
        +glowColor?: string
        +borderWidth?: string|number
    }

    class CardDesignData {
        +id?: string
        +name?: string
        +description?: string
        +emoji?: string
        +color?: string
        +featuredImage?: string
        +type?: string
        +category?: string
        +metadata?: Record<string, any>
    }

    BaseCardProps --> CardOptions: contiene
    BaseCardProps --> RarityConfig: referencia
    BaseCardProps --> CardDesignData: referencia
```

## Estructura de un Layout de Tarjeta Específico

```mermaid
classDiagram
    class TagCardProps {
        +tag: TagData
        +onEdit?: Function
        +onDelete?: Function
        +className?: string
        +options?: CardOptions
    }

    class TagData {
        +id: string
        +name: string
        +type?: string
        +description?: string
        +count?: number
        +color?: string
        +rarity?: string
        +categories?: string[]
        +attributes?: string[]
        +featuredImage?: string
    }

    class BaseCardProps {
        +children: ReactNode
        +className?: string
        +options?: CardOptions
        +rarity?: RarityConfig
    }

    TagCardProps --|> BaseCardProps: extiende
    TagCardProps --> TagData: contiene
```

## Flujo de Renderizado de Tarjetas

```mermaid
sequenceDiagram
    participant P as Página
    participant L as Layout de Tarjeta
    participant BC as BaseCard
    participant VC as VisualizationConfig
    participant EL as Efectos y Capas

    P->>L: Renderiza con datos de entidad
    L->>L: Calcula rareza y poder
    L->>L: Prepara opciones visuales
    L->>BC: Renderiza con opciones y rareza
    BC->>EL: Aplica capas visuales

    Note over BC,EL: Interacción del usuario

    BC->>VC: Abre configuración (si se solicita)
    VC->>BC: Actualiza opciones visuales
    BC->>EL: Re-renderiza capas visuales
    BC->>L: Devuelve tarjeta completa
    L->>P: Muestra en la interfaz
```

## Sistema Visual de Rareza

```mermaid
graph TD
    subgraph RarezasYTipos[Sistema de Rareza y Tipos]
        Rarity[Sistema de Rareza] --> CommonR[Común<br/>Gris]
        Rarity --> UncommonR[Poco Común<br/>Azul]
        Rarity --> RareR[Raro<br/>Ámbar]
        Rarity --> EpicR[Épico<br/>Púrpura]
        Rarity --> LegendaryR[Legendario<br/>Rojo]

        Types[Tipos de Tarjetas] --> Normal[Normal]
        Types --> Trap[Trampa]
        Types --> Spell[Hechizo]
        Types --> Effect[Efecto]
        Types --> Ritual[Ritual]
        Types --> Location[Ubicación]
        Types --> Character[Personaje]
        Types --> Object[Objeto]
    end

    Rarity --> Effects[Efectos Visuales]
    Types --> Styles[Estilos Visuales]

    Effects --> Glow[Brillo]
    Effects --> Border[Borde]
    Effects --> Animation[Animación]

    Styles --> Colors[Colores]
    Styles --> Gradients[Gradientes]
    Styles --> Layout[Disposición]
```
