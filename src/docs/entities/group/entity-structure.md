# Estructura de la Entidad Group

Este documento detalla la arquitectura y estructura de la entidad Group en el sistema.

## Organización de carpetas

```
src/
├── types/
│   └── entities/
│       └── group/
│           ├── index.ts           # Exportaciones de tipos
│           └── types.ts           # Definición de tipos
│
├── transformers/
│   └── group/
│       ├── index.ts               # Exportación principal
│       ├── transformer.ts         # Transformadores principales
│       ├── mappers.ts             # Mapeo de datos
│       └── serializers.ts         # Serialización
│
├── store/
│   └── entities/
│       └── group/
│           ├── index.ts           # Exportación del store
│           ├── types.ts           # Tipos del store
│           └── slices/
│               ├── core.ts        # Slice de operaciones CRUD
│               ├── ui.ts          # Slice de interfaz de usuario
│               └── filters.ts     # Slice de filtros y ordenación
│
├── services/
│   ├── group.service.ts           # Servicio principal
│   └── group-service-export.ts    # Exportación del servicio
│
└── app/
    └── actions/
        └── groups/
            ├── index.ts           # Exportación de acciones
            └── group.actions.ts   # Acciones del servidor
```

## Diagrama de componentes

```mermaid
graph TD
    classDef types fill:#f9d6ff,stroke:#333,stroke-width:1px
    classDef transformers fill:#d6fffa,stroke:#333,stroke-width:1px
    classDef store fill:#fff2d6,stroke:#333,stroke-width:1px
    classDef services fill:#d6e6ff,stroke:#333,stroke-width:1px
    classDef actions fill:#ffd6d6,stroke:#333,stroke-width:1px

    subgraph "Tipos"
        T1[types/group/types.ts]
        T2[types/group/index.ts]
    end

    subgraph "Transformadores"
        TR1[transformers/group/transformer.ts]
        TR2[transformers/group/mappers.ts]
        TR3[transformers/group/serializers.ts]
        TR4[transformers/group/index.ts]
    end

    subgraph "Store"
        S1[store/group/index.ts]
        S2[store/group/types.ts]

        subgraph "Slices"
            SL1[store/group/slices/core.ts]
            SL2[store/group/slices/ui.ts]
            SL3[store/group/slices/filters.ts]
        end
    end

    subgraph "Servicios"
        SV1[services/group.service.ts]
        SV2[services/group-service-export.ts]
    end

    subgraph "Acciones"
        A1[actions/groups/group.actions.ts]
        A2[actions/groups/index.ts]
    end

    T1 --> T2
    TR1 --> TR4
    TR2 --> TR4
    TR3 --> TR4

    SL1 --> S1
    SL2 --> S1
    SL3 --> S1
    S2 --> SL1
    S2 --> SL2
    S2 --> SL3

    SV1 --> SV2

    A1 --> A2

    T2 -.-> TR1
    T2 -.-> TR2
    T2 -.-> TR3

    TR4 -.-> SL1

    TR4 -.-> SV1

    SV1 -.-> A1

    A2 -.-> S1

    class T1,T2 types
    class TR1,TR2,TR3,TR4 transformers
    class S1,S2,SL1,SL2,SL3 store
    class SV1,SV2 services
    class A1,A2 actions
```

## Flujo de operaciones

```mermaid
sequenceDiagram
    participant C as Cliente/UI
    participant SA as Server Actions
    participant S as Service
    participant T as Transformer
    participant DB as Prisma/BD

    C->>+SA: Solicitud (ej: getGroups)
    SA->>+S: Llamada al servicio
    S->>+DB: Consulta Prisma
    DB-->>-S: Datos sin procesar
    S->>+T: Transformar datos
    T-->>-S: Datos transformados
    S-->>-SA: Respuesta
    SA-->>-C: Respuesta final

    C->>C: Actualizar UI/Store
```

## Modelo de datos (Prisma)

```prisma
model Group {
  id          String   @id @default(cuid())
  name        String
  emoji       String   @default("👥")
  color       String   @default("#8B5CF6")
  description String?
  shortcut    String?
  category    String?
  sortBy      String   @default("name:asc")
  filters     String   @default("{}")
  isFavorite  Boolean  @default(false)
  featuredImage String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  images      Image[]
  videos      Video[]
  albums      Album[]
  collections Collection[]
  tags        Tag[]
  characters  Character[]
  places      Place[]
  worldItems  WorldItem[]
  concepts    Concept[]
  prompts     Prompt[]
  notes       Note[]
  wildcards   Wildcard[]
  properties  Property[]
}
```

## Jerarquía de tipos

```mermaid
graph TD
    classDef base fill:#fffacd,stroke:#333,stroke-width:1px
    classDef extended fill:#e6fffa,stroke:#333,stroke-width:1px
    classDef ui fill:#ffe6e6,stroke:#333,stroke-width:1px
    classDef stats fill:#e6f2ff,stroke:#333,stroke-width:1px

    GB[GroupBase]
    GC[GroupComplete]
    GE[GroupExtended]
    GWS[GroupWithStats]

    GB --> GC
    GB --> GWS
    GC --> GE

    class GB base
    class GC extended
    class GE ui
    class GWS stats
```

## Tipado de transformadores

```typescript
// Transformador principal
export function transformGroup(group: any): GroupComplete

// Transforma múltiples grupos
export function transformGroups(groups: any[]): GroupComplete[]

// Versión extendida para UI
export function transformGroupToExtended(
  group: Group | GroupComplete,
  options?: {
    isSelected?: boolean;
    isHighlighted?: boolean;
    isEditing?: boolean;
    isExpanded?: boolean;
    isLoading?: boolean;
    hasError?: boolean;
    isDragging?: boolean;
    isDropTarget?: boolean;
  }
): GroupExtended

// Versión con estadísticas
export function transformGroupToWithStats(
  group: Group | GroupComplete
): GroupWithStats
```

## Implementación del Store

```typescript
// Creación del store
export const useGroupStore = create<GroupStore>()(
  devtools(
    persist(
      (set, get, ...rest) => ({
        ...initialState,
        ...createGroupCoreSlice(set, get, ...rest),
        ...createGroupUISlice(set, get, ...rest),
        ...createGroupFiltersSlice(set, get, ...rest),
      }),
      {
        name: 'group-store',
        partialize: (state) => ({
          ui: {
            viewMode: state.ui.viewMode,
            expandedIds: state.ui.expandedIds,
          },
          filters: {
            sortBy: state.filters.sortBy,
          },
        }),
      }
    ),
    { name: 'GroupStore' }
  )
)
```

## Funciones clave del servicio

```typescript
// Búsqueda avanzada
export const searchGroupsService = async (
  filters: Record<string, any> = {},
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeInactive?: boolean;
  } = {}
): Promise<GroupSearchResult>

// Obtener estadísticas
export const getGroupStatsService = async (
  id: string
): Promise<GroupWithStats>

// Añadir item al grupo
export const addItemToGroupService = async (
  groupId: string,
  itemId: string,
  itemType: keyof GroupRelations
): Promise<void>
```