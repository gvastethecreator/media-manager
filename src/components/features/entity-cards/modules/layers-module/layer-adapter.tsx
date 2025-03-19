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

/**
 * 🔄 Adaptador para convertir implementaciones de capas al formato de plugin
 *
 * Este componente adapta las implementaciones de capa (LayerImplementation)
 * al formato esperado por el sistema de plugins (LayerComponent).
 */

import React from 'react';
import type { LayerComponentProps } from '../../layers/layer-plugin-system';

/**
 * Función para adaptar una implementación de capa al formato de componente de plugin
 */
export function adaptLayerImplementationToComponent(implementation: LayerImplementation): LayerComponent {
  // Verificar que la implementación es válida
  if (!implementation || !implementation.type || typeof implementation.render !== 'function') {
    console.error('Implementación de capa inválida:', implementation);
    throw new Error('La implementación de capa proporcionada no es válida o no tiene función render');
  }

  // Crear un componente React a partir de la función render
  const AdaptedComponent: React.ComponentType<LayerComponentProps> = (props: LayerComponentProps) => {
    try {
      // Convertir props del sistema de plugins a props esperadas por la implementación
      const adaptedProps: LayerRenderProps = {
        isHovered: props.isHovered,
        isExploded: props.isExploded,
        isActive: props.activeLayer === implementation.type,
        mousePosition: props.mousePosition,
        config: props.config as LayerConfig,
        entityType: props.entityType,
        entityId: props.entityId
      };

      // Llamar a la función de renderizado de la implementación con las props adaptadas
      const renderedContent = implementation.render(adaptedProps);

      // Devolver el contenido renderizado o null si es undefined
      return renderedContent || null;
    } catch (error) {
      console.error(`Error al renderizar la capa ${implementation.type}:`, error);
      return null;
    }
  };

  // Definir el nombre del componente para que aparezca correctamente en DevTools
  Object.defineProperty(AdaptedComponent, 'name', {
    value: `${implementation.type.charAt(0).toUpperCase() + implementation.type.slice(1)}Layer`,
    writable: false
  });

  // Definimos un componente de configuración adaptado si existe
  const AdaptedSettingsComponent = implementation.Settings
    ? (settingsProps: LayerSettingsProps) => {
      try {
        // El componente Settings recibe diferentes props que debemos adaptar
        return implementation.Settings
          ? React.createElement(implementation.Settings, {
            config: settingsProps.config,
            onChange: settingsProps.onConfigUpdate,
            entityType: settingsProps.entityType,
            entityId: settingsProps.entityId
          })
          : null;
      } catch (error) {
        console.error(`Error al renderizar configuración de capa ${implementation.type}:`, error);
        return null;
      }
    }
    : undefined;

  // Verificar que haya al menos una configuración por defecto
  const defaultConfig = implementation.defaultConfig || {
    enabled: true,
    layerIndex: 0,
    type: implementation.type
  };

  // Crear acciones de servidor si están disponibles
  const serverActions = implementation.serverActions;

  // Construir el componente resultante
  const adaptedComponent: LayerComponent = {
    type: implementation.type,
    Component: AdaptedComponent,
    defaultConfig: defaultConfig,
    SettingsComponent: AdaptedSettingsComponent,
    getServerActions: serverActions ? () => serverActions as Record<string, (...args: unknown[]) => unknown> : undefined
  };

  // Verificar que el componente resultante sea válido
  if (!adaptedComponent.Component) {
    console.error(`Error crítico: El componente adaptado para ${implementation.type} no es válido`);
    throw new Error(`Adaptación de componente fallida para la capa "${implementation.type}"`);
  }

  return adaptedComponent;
}

/**
 * Hook para adaptar una lista de implementaciones de capa a componentes de plugin
 */
export function useAdaptedLayers(implementations: LayerImplementation[]): LayerComponent[] {
  return React.useMemo(() => {
    return implementations.map(adaptLayerImplementationToComponent);
  }, [implementations]);
}

/**
 * Componente para registrar implementaciones de capa adaptadas al sistema de plugins
 */
export function RegisterAdaptedLayers({
  layerImplementations,
  registerLayer
}: {
  layerImplementations: LayerImplementation[];
  registerLayer: (layer: LayerComponent) => void;
}) {
  React.useEffect(() => {
    // Adaptar y registrar cada implementación
    for (const implementation of layerImplementations) {
      try {
        const adaptedComponent = adaptLayerImplementationToComponent(implementation);
        registerLayer(adaptedComponent);
        console.log(`✅ Capa adaptada y registrada: ${implementation.type}`);
      } catch (error) {
        console.error(`❌ Error adaptando capa ${implementation.type}:`, error);
      }
    }

    // No es necesario limpiar porque las capas deben persistir
  }, [layerImplementations, registerLayer]);

  // Este componente no renderiza nada
  return null;
}