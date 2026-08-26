# Development panel

This module provides a development panel that monitors the system.

The panel tracks feature status, manages issues, and displays technical metrics.

## Folder structure

```
src/components/views/development/
├── cards/                  # Card components that display information
│   ├── feature-card.tsx    # Card that shows features
│   ├── issue-card.tsx      # Card that shows issues
│   ├── metric-card.tsx     # Card that shows system metrics
│   ├── processing-metric-card.tsx  # Card for processing metrics
│   ├── service-card.tsx    # Card that shows services
│   ├── status-badge.tsx    # Badge that shows statuses
│   └── index.ts            # Component export file
├── charts/                 # Chart components
│   ├── system-charts.tsx   # Basic system charts
│   └── tech-metrics.tsx    # Advanced technical metrics panel
├── hooks/                  # Custom hooks that fetch data
│   ├── use-documentation.ts  # Hook that loads documentation
│   ├── use-features-issues.ts # Hook that manages features and issues
│   ├── use-system-stats.ts   # Hook for system statistics
│   └── use-tech-metrics.ts   # Hook for advanced technical metrics
├── services/               # Services that fetch server data
│   ├── documentation.ts     # Service that loads documentation
│   ├── features-issues.ts   # Service that manages features and issues
│   ├── system-stats.ts      # Service for system statistics
│   └── tech-metrics.ts      # Service for advanced technical metrics
└── development-view.tsx    # Main component that integrates all modules
```

## Main components

### DevelopmentView

This main component integrates all sections of the development panel.

The panel divides into the following sections:

- **Services**: Shows the status of system services
- **Features**: Shows the status of features in development
- **Issues**: Shows pending problems and their status
- **Documentation**: Lets you view project documentation
- **Statistics**: Shows charts with general statistics
- **Technical metrics**: Shows detailed technical metrics of the system

### Cards

These card components show information in a compact form:

- **ServiceCard**: Shows the status of a service
- **FeatureCard**: Shows information about a feature
- **IssueCard**: Shows information about an issue
- **MetricCard**: Shows a system metric
- **ProcessingMetricCard**: Shows processing metrics
- **StatusBadge**: Reusable badge that shows statuses

### Charts

These chart components visualize data:

- **FileDistributionChart**: Shows file distribution by type
- **IndexingActivityChart**: Shows indexing activity
- **ResourceUsageChart**: Shows resource use
- **SystemPerformanceChart**: Shows system performance
- **SystemMetricsPanel**: Full panel of advanced technical metrics

## Hooks

The following custom hooks fetch data:

- **useSystemStats**: Gets system statistics
- **useFeaturesIssues**: Gets information about features and issues
- **useDocumentation**: Loads project documentation
- **useTechMetrics**: Gets advanced technical metrics

## Services

The following services get data from the server:

- **system-stats.ts**: Gets system statistics
- **features-issues.ts**: Gets information about features and issues
- **documentation.ts**: Loads project documentation
- **tech-metrics.ts**: Gets advanced technical metrics

## Data refresh

The data refreshes on a schedule.

System statistics refresh every 30 seconds.

Features and issues refresh every 60 seconds.

Technical metrics refresh every 15 seconds.

You can also force a manual refresh with the Refresh button in the top right of the panel.

## Use

```tsx
import { DevelopmentView } from '@/components/views/development/development-view';

export default function DevelopmentPage() {
	return <DevelopmentView />;
}
```
