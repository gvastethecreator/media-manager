# Panel de Desarrollo

Este módulo proporciona un panel de desarrollo completo para monitorizar el sistema, seguir el estado de las features, gestionar issues y visualizar métricas técnicas.

## Estructura de carpetas

```
src/components/views/development/
├── cards/                  # Componentes de tarjetas para mostrar información
│   ├── feature-card.tsx    # Tarjeta para mostrar features
│   ├── issue-card.tsx      # Tarjeta para mostrar issues
│   ├── metric-card.tsx     # Tarjeta para mostrar métricas del sistema
│   ├── processing-metric-card.tsx  # Tarjeta para métricas de procesamiento
│   ├── service-card.tsx    # Tarjeta para mostrar servicios
│   ├── status-badge.tsx    # Badge para mostrar estados
│   └── index.ts            # Archivo de exportación de componentes
├── charts/                 # Componentes de gráficos
│   ├── system-charts.tsx   # Gráficos básicos del sistema
│   └── tech-metrics.tsx    # Panel de métricas técnicas avanzadas
├── hooks/                  # Hooks personalizados para obtener datos
│   ├── use-documentation.ts  # Hook para cargar documentación
│   ├── use-features-issues.ts # Hook para gestionar features e issues
│   ├── use-system-stats.ts   # Hook para estadísticas del sistema
│   └── use-tech-metrics.ts   # Hook para métricas técnicas avanzadas
├── services/               # Servicios para obtener datos del servidor
│   ├── documentation.ts     # Servicio para cargar documentación
│   ├── features-issues.ts   # Servicio para gestionar features e issues
│   ├── system-stats.ts      # Servicio para estadísticas del sistema
│   └── tech-metrics.ts      # Servicio para métricas técnicas avanzadas
└── development-view.tsx    # Componente principal que integra todos los módulos
```

## Componentes principales

### DevelopmentView

Componente principal que integra todas las secciones del panel de desarrollo. Se divide en las siguientes secciones:

- **Servicios**: Muestra el estado de los servicios del sistema
- **Features**: Muestra el estado de las funcionalidades en desarrollo
- **Issues**: Muestra los problemas pendientes y su estado
- **Documentación**: Permite ver la documentación del proyecto
- **Estadísticas**: Muestra gráficos con estadísticas generales
- **Métricas Técnicas**: Muestra métricas técnicas detalladas del sistema

### Cards

Componentes de tarjetas para mostrar información de manera compacta:

- **ServiceCard**: Muestra el estado de un servicio
- **FeatureCard**: Muestra información sobre una funcionalidad
- **IssueCard**: Muestra información sobre un issue
- **MetricCard**: Muestra una métrica del sistema
- **ProcessingMetricCard**: Muestra métricas de procesamiento
- **StatusBadge**: Badge reutilizable para mostrar estados

### Charts

Componentes de gráficos para visualizar datos:

- **FileDistributionChart**: Muestra la distribución de archivos por tipo
- **IndexingActivityChart**: Muestra la actividad de indexación
- **ResourceUsageChart**: Muestra el uso de recursos
- **SystemPerformanceChart**: Muestra el rendimiento del sistema
- **SystemMetricsPanel**: Panel completo de métricas técnicas avanzadas

## Hooks

Hooks personalizados para obtener datos:

- **useSystemStats**: Obtiene estadísticas del sistema
- **useFeaturesIssues**: Obtiene información sobre features e issues
- **useDocumentation**: Carga la documentación del proyecto
- **useTechMetrics**: Obtiene métricas técnicas avanzadas

## Servicios

Servicios que obtienen datos del servidor:

- **system-stats.ts**: Obtiene estadísticas del sistema
- **features-issues.ts**: Obtiene información sobre features e issues
- **documentation.ts**: Carga la documentación del proyecto
- **tech-metrics.ts**: Obtiene métricas técnicas avanzadas

## Actualización de datos

Los datos se actualizan periódicamente:

- Estadísticas del sistema: cada 30 segundos
- Features e issues: cada 60 segundos
- Métricas técnicas: cada 15 segundos

Además, se puede forzar una actualización manual utilizando el botón "Actualizar" en la parte superior derecha del panel.

## Uso

```tsx
import { DevelopmentView } from '@/components/views/development/development-view';

export default function DevelopmentPage() {
  return <DevelopmentView />;
}
```