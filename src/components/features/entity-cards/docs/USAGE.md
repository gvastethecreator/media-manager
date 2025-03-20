# Guía de Uso del Sistema Entity Cards

## Introducción

El sistema Entity Cards proporciona una forma flexible y potente de mostrar diferentes tipos de entidades en formato de tarjeta con efectos visuales avanzados. Esta guía explica cómo utilizar el sistema en diferentes contextos.

## Importación Correcta de Componentes

Para usar correctamente los componentes de tarjetas, **debe importarlos desde el punto de entrada centralizado**:

```tsx
// CORRECTO: Importar desde el punto de entrada central
import {
	AlbumCard,
	ConceptCard,
	NoteCard,
	TagCard,
	PlaceCard,
	// Otros componentes...
	EntityCardWrapper,
	adaptCardOptions,
} from '@/components/features/entity-cards';

// INCORRECTO: No importar directamente desde los archivos de implementación
// import { AlbumCard } from '@/components/features/entity-cards/layouts/album-card-layout';
```

## Uso Básico

### 1. Renderizar una Tarjeta Simple

```tsx
import { AlbumCard } from '@/components/features/entity-cards';

function MyComponent() {
	const album = {
		id: '123',
		name: 'Mi Álbum',
		description: 'Descripción del álbum',
		// ... otros campos según el tipo de entidad
	};

	return (
		<AlbumCard
			data={album}
			onClick={() => console.log('Tarjeta clickeada')}
		/>
	);
}
```

### 2. Personalizar la Apariencia con Compatibilidad de Tipos

```tsx
import { AlbumCard, adaptCardOptions, CardOptions } from '@/components/features/entity-cards';

function MyComponent() {
	const album = {
		id: '456',
		name: 'Mi Álbum',
		// ... otras propiedades
	};

	// Opciones personalizadas
	const customOptions: Partial<CardOptions> = {
		designSystem: {
			preset: 'modern',
			cornerRadius: 12,
			borderWidth: 2,
		},
		glowOptions: {
			intensity: 0.7,
			color: '#3b82f6',
			visibleOnHover: true,
		}
	};

	return (
		<AlbumCard
			data={album}
			// Usar el adaptador para asegurar compatibilidad
			options={adaptCardOptions(customOptions)}
			onClick={() => console.log('Álbum clickeado')}
		/>
	);
}
```

## Uso Avanzado

### 1. Usar el Adaptador Directamente

```tsx
import { EntityCardAdapter } from '@/components/features/entity-cards/entity-card-adapter';

function AdvancedUsage() {
	const [isExploded, setIsExploded] = useState(false);
	const [activeLayer, setActiveLayer] = useState(null);

	return (
		<EntityCardAdapter
			entityType="character"
			entity={characterData}
			enableExplode={true}
			isExploded={isExploded}
			activeLayer={activeLayer}
			onExplodedChange={setIsExploded}
			onActiveLayerChange={setActiveLayer}
			showVisualConfig={true}
			onVisualConfigClick={() => console.log('Abrir configuración')}
		/>
	);
}
```

### 2. Trabajar con Presets Visuales

```tsx
import {
	applyVisualPresetToEntity,
	getVisualPresetsByEntityType,
} from '@/components/features/entity-cards/actions/visual-presets.actions';

// En un componente con 'use client'
async function handleApplyPreset(entityType, entityId, presetId) {
	const result = await applyVisualPresetToEntity(entityType, entityId, presetId);
	if (result.success) {
		// Manejar éxito
	} else {
		// Manejar error
	}
}

// Para obtener presets disponibles
async function loadPresets(entityType) {
	const result = await getVisualPresetsByEntityType(entityType);
	if (result.success) {
		return result.data;
	}
	return [];
}
```

### 3. Configuración del Panel de Settings

```tsx
import { EntitiesCardsSettings } from '@/components/features/entity-cards/settings/entities-cards-settings';

function SettingsPanel() {
	return (
		<div className="settings-container">
			<h2>Configuración de Tarjetas</h2>
			<EntitiesCardsSettings />
		</div>
	);
}
```

## Sistema de Capas

El sistema de capas permite aplicar efectos visuales a las tarjetas. Cada capa se puede configurar individualmente.

### Ejemplo de Uso de Capas

```tsx
import { EntityCardLayerWrapper } from '@/components/features/entity-cards/entity-card-layer-wrapper';

function CardWithLayers() {
	return (
		<EntityCardLayerWrapper
			entityType="folder"
			entityId="123"
			isExploded={true}
			activeLayer="glow"
			layerOrder={['background', 'content', 'glow', 'border', 'holographic']}
		>
			{/* Contenido de la tarjeta */}
			<div className="card-content">
				<h3>Título de la Tarjeta</h3>
				<p>Contenido de la tarjeta</p>
			</div>
		</EntityCardLayerWrapper>
	);
}
```

## Integración con Otros Sistemas

### 1. Integración con Sistema de Entidades

```tsx
import { useEntity } from '@/hooks/use-entity';
import { EntityCard } from '@/components/features/entity-cards/entity-card';

function EntityDisplay({ entityId, entityType }) {
	const { entity, isLoading, error } = useEntity(entityType, entityId);

	if (isLoading) return <div>Cargando...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return <EntityCard entityType={entityType} entity={entity} />;
}
```

### 2. Integración con Sistema de Navegación

```tsx
import { useRouter } from 'next/navigation';
import { EntityCard } from '@/components/features/entity-cards/entity-card';

function NavigableCard({ entity, entityType }) {
	const router = useRouter();

	const handleClick = () => {
		router.push(`/${entityType}s/${entity.id}`);
	};

	return <EntityCard entityType={entityType} entity={entity} onClick={handleClick} />;
}
```

## Solución de Problemas Comunes

### 1. La tarjeta no muestra el contenido correcto

Asegúrate de que el tipo de entidad (`entityType`) coincida con el tipo real de la entidad que estás pasando. Cada tipo de entidad espera una estructura específica.

### 2. Los efectos visuales no funcionan

Verifica que las opciones de efectos estén habilitadas correctamente:

```tsx
const options = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableGlowEffect: true,
	// ... otras opciones
};
```

### 3. Problemas de rendimiento

Si experimentas problemas de rendimiento con muchas tarjetas, considera usar las opciones de rendimiento:

```tsx
const performanceOptions = {
	performance: {
		lazyLoad: true,
		imageOptimization: true,
		reducedMotion: true,
		// ... otras opciones de rendimiento
	},
};
```

### 4. Adaptación al tamaño completo del contenedor

Para que las tarjetas se adapten al tamaño completo de su contenedor, asegúrate de que el contenedor padre tenga dimensiones definidas y utiliza las clases `w-full` y `h-full`:

```tsx
// Contenedor padre con dimensiones definidas
<div className="w-64 h-96">
	<EntityCardAdapter
		entityType="folder"
		entity={folder}
		// Las tarjetas ya incluyen w-full y h-full internamente
	/>
</div>

// Para contenedores flexibles
<div className="grid grid-cols-3 gap-4 h-screen">
	{folders.map(folder => (
		<EntityCardAdapter
			key={folder.id}
			entityType="folder"
			entity={folder}
		/>
	))}
</div>
```

Los componentes `EntityCard`, `EntityCardWrapper` y layouts específicos como `FolderCardLayout` ya incluyen las clases necesarias para adaptarse al tamaño completo de su contenedor.

## Recursos Adicionales

- Consulta `ARCHITECTURE.md` para entender la estructura interna del sistema
- Revisa los ejemplos en `entity-card-example.tsx`
- Explora los diferentes módulos en la carpeta `modules/` para funcionalidades específicas
- Consulta los diagramas en `ARCHITECTURE.md` para visualizar el flujo de datos y la estructura de componentes
