# Módulo de Vista Explosionada para Entity Cards

Este módulo proporciona un sistema para visualizar las capas de las tarjetas de entidad en una vista explosionada en 3D, permitiendo separar las capas para verlas individualmente.

## Características

- **Vista en 3D**: Separación de capas en los ejes X, Y, Z o en combinación.
- **Configuración de rotación**: Control completo de la rotación en los tres ejes.
- **Animaciones**: Transiciones suaves entre vista normal y explosionada.
- **Presets predefinidos**: Varios estilos de visualización listos para usar.
- **Interactividad**: Opciones para expandir la vista al pasar el ratón.
- **Personalización**: Control de perspectiva, distancia entre capas y más.

## Componentes Principales

### `ExplodeModule`

El componente principal que encapsula toda la funcionalidad del módulo de vista explosionada.

```tsx
import { ExplodeModule } from '@/components/features/entity-cards/modules/explode';

function MyComponent() {
	return (
		<ExplodeModule
			initialExplodeSystem={{
				enabled: true,
				distance: 20,
				// Otras opciones...
			}}
			layersList={['Background', 'Content', 'Overlay']}
			onChange={(explodeSystem) => {
				// Guardar configuración actualizada
			}}
		/>
	);
}
```

### `ExplodePanel`

Panel de configuración UI para ajustar la vista explosionada.

```tsx
import { ExplodePanel } from '@/components/features/entity-cards/modules/explode';
import { useState } from 'react';

function ConfigPanel() {
	const [explodeConfig, setExplodeConfig] = useState(/* config inicial */);

	return (
		<ExplodePanel
			explodeSystem={explodeConfig}
			onChange={setExplodeConfig}
			layersList={['Background', 'Content', 'Overlay']}
		/>
	);
}
```

## Hooks

### `useExplodeSystem`

Hook para gestionar el estado de la vista explosionada en componentes.

```tsx
import { useExplodeSystem } from '@/components/features/entity-cards/modules/explode';

function ExplodedComponent() {
	const { explodeSystem, updateExplodeSystem, resetExplodeSystem, generateExplodeStyles } = useExplodeSystem();

	return (
		<div>
			{layers.map((layer, index) => (
				<div key={index} style={generateExplodeStyles(index, layers.length)}>
					{layer}
				</div>
			))}
		</div>
	);
}
```

## Tipos

El módulo exporta varios tipos útiles:

- `ExplodeSystem`: La configuración completa del sistema de vista explosionada.
- `ExplodeDirection`: Tipo para las direcciones posibles (x, y, z, 3d).
- `ExplodeSystemPreset`: Estructura para presets de vista explosionada predefinidos.
- `ExplodePanelProps`: Props para el panel de configuración.
- `ExplodeModuleProps`: Props para el módulo principal.
- `UseExplodeSystemHook`: Tipo para el hook de vista explosionada.

## Integración con Entity Cards

Para integrar la vista explosionada en las tarjetas de entidad:

1. Añadir la configuración de vista explosionada al modelo `CardOptions`.
2. Aplicar los estilos generados por `generateExplodeStyles()` a cada componente de capa.
3. Utilizar el hook `useExplodeSystem` para gestionar el estado de la vista explosionada.

## Ejemplos de Uso

### Vista explosionada básica

```tsx
import { useExplodeSystem } from '@/components/features/entity-cards/modules/explode';

function LayeredCard() {
	const { explodeSystem, generateExplodeStyles } = useExplodeSystem({
		enabled: true,
		distance: 15,
		direction: '3d',
		rotationY: 15,
	});

	const layers = ['background', 'content', 'overlay'];

	return (
		<div className="card-container">
			{layers.map((layer, index) => (
				<div key={layer} className={`card-layer ${layer}`} style={generateExplodeStyles(index, layers.length)}>
					{/* Contenido de la capa */}
				</div>
			))}
		</div>
	);
}
```

### Control interactivo de la vista explosionada

```tsx
function InteractiveLayeredCard() {
	const [isExploded, setIsExploded] = useState(false);

	return (
		<>
			<button onClick={() => setIsExploded(!isExploded)}>{isExploded ? 'Vista Normal' : 'Vista Explosionada'}</button>

			<ExplodeModule
				initialExplodeSystem={{
					enabled: isExploded,
					distance: 25,
					direction: '3d',
				}}
				onChange={(config) => {
					// Manejar cambios en la configuración
				}}
			/>
		</>
	);
}
```
