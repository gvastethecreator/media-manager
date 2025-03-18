# Arquitectura del Módulo Core

Este documento proporciona una visión general de la estructura y las relaciones entre los componentes del módulo Core.

## Estructura de Archivos

```mermaid
graph TD
    A[modules/core/index.ts] --> B[core-panel.tsx]
    A --> C[hooks/use-core-settings.tsx]
    A --> D[components/sections.tsx]
    B --> C
    B --> D
    D --> C
```

## Flujo de Datos

```mermaid
flowchart LR
    A[useCoreSettings] -->|proporciona estado| B[CorePanel]
    B -->|actualiza| A
    B -->|renderiza| C[InteractivitySection]
    B -->|renderiza| D[PerformanceSection]
    B -->|renderiza| E[FeedbackSection]
    B -->|renderiza| F[ContentSection]
    C -->|actualiza| A
    D -->|actualiza| A
    E -->|actualiza| A
    F -->|actualiza| A
```

## Jerarquía de Componentes

```mermaid
graph TD
    A[CorePanel] --> B[FormLayout]
    A --> C[FormToggle]
    A --> D[Tabs]
    D --> E[TabsList]
    D --> F[TabsContent]
    E --> G[TabsTrigger]
    F --> H[InteractivitySection]
    F --> I[PerformanceSection]
    F --> J[FeedbackSection]
    F --> K[ContentSection]
    H --> L[FormSelect/FormSlider/FormToggle]
    I --> L
    J --> L
    K --> L
```

## Estructura de Datos

```mermaid
classDiagram
    class CoreOptions {
        +boolean enabled
        +string interactiveMode
        +number hoverDelay
        +boolean touchEnabled
        +boolean precisionPointer
        +boolean reduceMotion
        +string performanceMode
        +boolean cacheEnabled
        +string loadingStrategy
        +boolean preloadEnabled
        +boolean hapticsEnabled
        +number hapticsIntensity
        +boolean soundEnabled
        +number soundVolume
        +string soundTheme
        +string contentArrangement
        +boolean autoHeight
        +number maxLines
        +string truncationMethod
        +string mediaFit
    }

    class CorePanel {
        +CardOptions options
        +function onChange()
        +boolean disabled
    }

    class useCoreSettings {
        +CoreOptions coreOptions
        +function updateCoreOption()
        +function updateNestedOption()
        +function resetToDefaults()
    }

    CorePanel --> useCoreSettings : usa
    useCoreSettings --> CoreOptions : gestiona
```
