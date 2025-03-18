# Módulo de Carpeta para Tarjetas de Entidades

Este módulo proporciona un sistema completo para configurar y personalizar la visualización y comportamiento de carpetas en el sistema de tarjetas de entidades.

## Características

- **Visualización personalizada**: Opciones para mostrar iconos, estadísticas, fechas, etc.
- **Sistema de capas**: Configuración de orden y espaciado entre capas
- **Efectos visuales**: Sombras, reflejos, efectos parallax, holográficos, etc.
- **Optimización de rendimiento**: Opciones para mejorar el rendimiento en carpetas con muchos elementos

## Componentes

### FolderModule

Componente principal que integra todo el sistema de carpetas.

```tsx
import { FolderModule } from '@/components/features/entity-cards/modules/folder';

<FolderModule
	initialOptions={{
		coreFolderConfig: {
			showIcon: true,
			gridColumns: 4,
		},
	}}
	onChange={(options) => console.log('Folder options updated:', options)}
/>;
```

### FolderPanel

Panel de configuración para ajustar las opciones de carpeta.

```tsx
import { FolderPanel } from '@/components/features/entity-cards/modules/folder';

<FolderPanel
	options={folderOptions}
	updateCoreFolderConfig={handleUpdateFolderConfig}
	updateCoreLayerSystem={handleUpdateLayerSystem}
	updateCorePerformance={handleUpdatePerformance}
	updateCoreEffects={handleUpdateEffects}
	updateCoreConfig={handleUpdateConfig}
	resetOptions={handleResetOptions}
/>;
```

## Hooks

### useFolderSystem

Hook para gestionar el estado y la lógica del sistema de carpetas.

```tsx
import { useFolderSystem } from '@/components/features/entity-cards/modules/folder';

const {
	options,
	updateCoreFolderConfig,
	updateCoreLayerSystem,
	updateCorePerformance,
	updateCoreEffects,
	updateCoreConfig,
	resetOptions,
} = useFolderSystem(initialOptions, handleOptionsChange);
```

## Tipos

```tsx
import { FolderOptions, CoreFolderConfig } from '@/components/features/entity-cards/modules/folder';

const folderConfig: CoreFolderConfig = {
	showIcon: true,
	showStats: true,
	gridColumns: 4,
	sortBy: 'name',
};
```

## Opciones Disponibles

### Configuración de Carpeta

| Opción        | Tipo    | Descripción                                     |
| ------------- | ------- | ----------------------------------------------- |
| `showIcon`    | boolean | Mostrar icono representativo para la carpeta    |
| `showStats`   | boolean | Mostrar estadísticas de elementos en la carpeta |
| `showDate`    | boolean | Mostrar fecha de modificación                   |
| `gridColumns` | number  | Número de columnas para visualizar elementos    |
| `sortBy`      | string  | Criterio para ordenar los elementos             |

### Efectos Visuales

| Opción                | Tipo    | Descripción               |
| --------------------- | ------- | ------------------------- |
| `shadow.enabled`      | boolean | Habilitar sombra          |
| `glow.enabled`        | boolean | Añadir efecto de brillo   |
| `border.enabled`      | boolean | Añadir borde decorativo   |
| `reflection.enabled`  | boolean | Añadir reflejo debajo     |
| `parallax.enabled`    | boolean | Añadir efecto parallax    |
| `holographic.enabled` | boolean | Añadir efecto holográfico |

## Integración

Este módulo está diseñado para integrarse perfectamente con el sistema de tarjetas de entidades, proporcionando opciones de configuración específicas para carpetas.
