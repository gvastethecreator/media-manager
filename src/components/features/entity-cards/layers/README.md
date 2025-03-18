# Sistema de Capas para Entity Cards

Este módulo proporciona un sistema completo para gestionar capas visuales en las tarjetas de entidad, ofreciendo una arquitectura extensible basada en plugins.

## Arquitectura

El sistema de capas se basa en un patrón de plugins que permite:

1. **Registro centralizado**: Todas las capas se registran en un único sistema
2. **Configuración independiente**: Cada capa gestiona su propia configuración
3. **Renderizado ordenado**: Las capas se renderizan en un orden específico
4. **Interacciones**: Soporte para hover, exploded view y capas activas

### Componentes clave

- `LayerPluginProvider`: Contexto para proporcionar el sistema de plugins
- `useLayerPlugin`: Hook para acceder al registro de plugins de capas
- `LayerRenderer`: Componente para renderizar capas en el orden correcto
- `RegisterLayers`: Registra todas las capas disponibles en el sistema

## Cómo implementar una nueva capa

Para añadir una nueva capa al sistema, sigue estos pasos:

1. **Crear la estructura de carpetas**:

   ```
   layers/
   └── mi-capa/
       ├── actions/
       │   ├── mi-capa-config.action.ts
       │   └── index.ts
       ├── mi-capa-effect-layer.tsx
       ├── mi-capa-settings.tsx
       └── index.ts
   ```

2. **Implementar las acciones del servidor**:

   ```typescript
   // mi-capa-config.action.ts
   'use server';

   export interface MiCapaConfig extends BaseLayerConfig {
     // Propiedades específicas de tu capa
     color: string;
     intensity: number;
   }

   export async function getMiCapaConfig(entityType: string, entityId?: string) {
     // Implementar lógica para obtener configuración
     return {
       success: true,
       message: 'Configuración obtenida',
       data: {
         enabled: true,
         layerIndex: 5,
         color: '#ffffff',
         intensity: 0.5
       } as MiCapaConfig
     };
   }

   export async function updateMiCapaConfig(...) { /* ... */ }
   export async function deleteMiCapaConfig(...) { /* ... */ }
   ```

3. **Implementar el componente de capa**:

   ```typescript
   // mi-capa-effect-layer.tsx
   'use client';

   import { cn } from '@/lib/utils';
   import type { LayerComponentProps } from '../layer-plugin-system';
   import type { MiCapaConfig } from './actions/mi-capa-config.action';

   export function MiCapaEffectLayer({
     isExploded,
     isHovered,
     activeLayer,
     getExplodeLayerTransform,
     config,
   }: LayerComponentProps<MiCapaConfig>) {
     // Implementar renderizado de la capa

     return (
       <div
         className={cn(
           'absolute inset-0',
           isExploded ? 'exploded-layer layer-mi-capa' : ''
         )}
         style={{
           // Estilos específicos
           ...(isExploded ? getExplodeLayerTransform(config.layerIndex) : {})
         }}
         data-layer-active={activeLayer === 'mi-capa' || null}
       />
     );
   }
   ```

4. **Implementar el componente de configuración**:

   ```typescript
   // mi-capa-settings.tsx
   'use client';

   import { Button, Input, Slider } from '@/components/ui';
   import { FormGroup } from '@/components/features/entity-cards/settings/panels/shared';
   import type { LayerSettingsProps } from '../layer-plugin-system';
   import type { MiCapaConfig } from './actions/mi-capa-config.action';

   export function MiCapaSettings({
   	entityType,
   	entityId,
   	className,
   	onConfigUpdate,
   }: LayerSettingsProps<MiCapaConfig>) {
   	// Implementar formulario de configuración
   }
   ```

5. **Exportar la capa en el índice**:

   ```typescript
   // index.ts
   import type { LayerComponent } from '../layer-plugin-system';
   import { getMiCapaConfig, updateMiCapaConfig, deleteMiCapaConfig } from './actions';
   import { MiCapaEffectLayer } from './mi-capa-effect-layer';
   import { MiCapaSettings } from './mi-capa-settings';

   export const miCapaLayer: LayerComponent<MiCapaConfig> = {
   	type: 'mi-capa',
   	Component: MiCapaEffectLayer,
   	SettingsComponent: MiCapaSettings,
   	defaultConfig: {
   		enabled: true,
   		layerIndex: 5,
   		color: '#ffffff',
   		intensity: 0.5,
   	},
   	getServerActions: () => ({
   		getConfig: getMiCapaConfig,
   		updateConfig: updateMiCapaConfig,
   		deleteConfig: deleteMiCapaConfig,
   	}),
   };
   ```

6. **Registrar la capa**:

   ```typescript
   // Añadir en register-layers.tsx
   import { miCapaLayer } from './mi-capa';

   export function RegisterLayers() {
   	const { registerLayer } = useLayerPlugin();

   	useEffect(() => {
   		// ... otras capas
   		registerLayer(miCapaLayer);
   	}, [registerLayer]);

   	return null;
   }
   ```

## Consejos para implementar capas eficientes

1. **Minimiza las operaciones costosas**: Evita cálculos intensivos en el renderizado.
2. **Optimiza las animaciones**: Usa `transform` y `opacity` para mejor rendimiento.
3. **Separa la lógica de renderizado de la lógica de configuración**.
4. **Utiliza el sistema de capas existente** para basarte en patrones probados.
5. **Maneja adecuadamente los estados de hover y activo** para interactividad.
6. **Respeta el índice de capa** para mantener el orden de renderizado correcto.

## Integración con el sistema de presets

Las capas pueden guardarse como parte de presets visuales. Asegúrate de que tu capa:

1. Serialice correctamente su configuración
2. Maneje valores por defecto adecuadamente
3. Deserialice adecuadamente las configuraciones almacenadas

## Depuración

Para depurar tu capa, utiliza la vista "explode" que muestra cada capa separada espacialmente.
Esto te ayudará a identificar problemas de renderizado y z-index.
