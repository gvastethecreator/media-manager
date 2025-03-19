'use client';

/**
 * 🔄 Adaptador para convertir entre diferentes formatos de capas
 *
 * Este archivo proporciona funciones para adaptar objetos LayerComponent
 * al formato LayerImplementation requerido por el sistema de módulos de capas.
 */

import type { LayerComponent } from '../../layers/layer-plugin-system';
import type { LayerConfig, LayerImplementation, LayerRenderProps, LayerSettingsProps } from '../../layers/types';

/**
 * Adapta un componente de capa al formato requerido por el sistema de módulos
 *
 * @param layerComponent - El componente de capa a adaptar
 * @returns Una implementación de capa compatible con el sistema de módulos
 */
export function adaptLayerComponentToImplementation(
  layerComponent: LayerComponent
): LayerImplementation {
  return {
    // Propiedades obligatorias
    type: layerComponent.type,
    name: layerComponent.type, // Usar el tipo como nombre si no se proporciona uno específico

    // Función de renderizado adaptada desde el componente original
    render: (props: LayerRenderProps) => {
      if (!layerComponent.Component) {
        return null;
      }

      // Adaptar las props de LayerRenderProps a las esperadas por el componente
      const adaptedProps = {
        config: props.config,
        isExploded: props.isExploded,
        isHovered: props.isHovered,
        mousePosition: props.mousePosition,
        isActive: props.isActive,
        activeLayer: props.isActive ? props.config.type : null,
        entityType: props.entityType,
        entityId: props.entityId,
        getExplodeLayerTransform: () => ({}), // Función básica si no se proporciona
        context: props.context,
      };

      // Renderizar el componente original con las props adaptadas
      return <layerComponent.Component {...adaptedProps} />;
    },

    // Componente de configuración adaptado
    Settings: layerComponent.SettingsComponent ?
      (props: LayerSettingsProps) => {
        const SettingsComponent = layerComponent.SettingsComponent as NonNullable<typeof layerComponent.SettingsComponent>;
        return <SettingsComponent {...props} />;
      } : undefined,

    // Propiedades opcionales
    defaultConfig: layerComponent.defaultConfig as LayerConfig,
    compatibleEntityTypes: ['image', 'folder', 'album', 'tag'], // Por defecto, compatible con todos
  };
}

/**
 * Registra un componente de capa en el sistema de módulos
 *
 * @param layerComponent - El componente de capa a registrar
 * @param registerFn - La función de registro del módulo de capas
 */
export function registerLayerComponent(
  layerComponent: LayerComponent,
  registerFn: (layer: LayerImplementation) => void
): void {
  const implementation = adaptLayerComponentToImplementation(layerComponent);
  registerFn(implementation);
}

/**
 * Registra múltiples componentes de capa en el sistema de módulos
 *
 * @param layerComponents - Los componentes de capa a registrar
 * @param registerFn - La función de registro del módulo de capas
 */
export function registerLayerComponents(
  layerComponents: LayerComponent[],
  registerFn: (layer: LayerImplementation) => void
): void {
  for (const component of layerComponents) {
    registerLayerComponent(component, registerFn);
  }
}