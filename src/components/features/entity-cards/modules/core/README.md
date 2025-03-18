# 🔧 Módulo Core para @entity-cards

Este módulo proporciona los componentes y hooks necesarios para gestionar la configuración del núcleo del sistema de tarjetas.

## Componentes

### CorePanel

Panel principal para administrar todas las configuraciones fundamentales del sistema de tarjetas, organizadas en pestañas:

- **Interactividad**: Configuración de interacciones del usuario con las tarjetas
- **Rendimiento**: Opciones para optimizar el rendimiento del sistema
- **Retroalimentación**: Configuración de respuestas táctiles y auditivas
- **Contenido**: Gestión de la organización y presentación del contenido

## Secciones

El módulo incluye varias secciones configurables:

- `InteractivitySection`: Gestiona interacciones como hover, clics y comportamiento táctil
- `PerformanceSection`: Controla opciones de caché, carga y rendimiento general
- `FeedbackSection`: Configura retroalimentación háptica y sonora
- `ContentSection`: Ajusta la presentación y organización del contenido

## Hooks

### useCoreSettings

Hook personalizado para gestionar las opciones del núcleo:

```tsx
const {
	coreOptions, // Estado actual de las opciones
	updateCoreOption, // Actualiza una opción específica
	updateNestedOption, // Actualiza una opción anidada
	resetToDefaults, // Restablece a valores predeterminados
} = useCoreSettings(initialOptions);
```

## Uso

```tsx
import { CorePanel, useCoreSettings } from '@/components/features/entity-cards/modules/core';

function MyComponent() {
	const [options, setOptions] = useState({
		core: {
			enabled: true,
			// otras opciones...
		},
		// otras configuraciones...
	});

	return <CorePanel options={options} onChange={setOptions} disabled={false} />;
}
```
