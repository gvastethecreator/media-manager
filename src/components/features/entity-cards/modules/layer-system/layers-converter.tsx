'use client';

/**
 * 🔄 Utilidades para convertir entre diferentes formatos de capas
 *
 * Este archivo proporciona funciones para facilitar la transición entre el sistema
 * antiguo de capas (LayerComponent) y el nuevo (LayerImplementation).
 */

import * as React from 'react';
import type { LayerConfig, LayerImplementation } from '../layers/types';
import type { LayerComponent } from './layers/layer-plugin-system';

/**
 * Convierte un LayerComponent (formato antiguo) a LayerImplementation (formato nuevo)
 * con soporte para tipo genérico que preserva el tipo de configuración original
 */
export function convertLayerComponentToImplementation<T extends LayerConfig>(
    component: LayerComponent<T>,
    additionalData?: Partial<LayerImplementation>
): LayerImplementation {
    // Generar un nombre a partir del tipo si no se proporciona uno
    const displayName = additionalData?.name ||
        component.type.charAt(0).toUpperCase() + component.type.slice(1);

    // Crear un adaptador que convierta el componente antiguo a la nueva interfaz
    return {
        // Propiedades base
        type: component.type,
        name: displayName,
        description: additionalData?.description || `Capa de ${displayName}`,
        category: additionalData?.category || 'legacy',
        compatibleEntityTypes: additionalData?.compatibleEntityTypes || ['image', 'folder', 'album', 'tag'],

        // Usar la configuración por defecto del componente existente
        defaultConfig: component.defaultConfig,

        // Icono (opcional)
        icon: additionalData?.icon,

        // Función para renderizar la capa
        render: (props) => {
            const Component = component.Component;
            // Adaptar las propiedades al formato esperado por el componente antiguo
            const adaptedProps = {
                config: props.config as T,
                isExploded: props.isExploded || false,
                isHovered: props.isHovered || false,
                mousePosition: props.mousePosition || { x: 50, y: 50 },
                activeLayer: props.isActive ? component.type : null,
                getExplodeLayerTransform: (index: number) => ({
                    transform: `translateZ(${index * 10}px)`,
                    zIndex: 100 - index
                }),
                entityType: props.entityType,
                entityId: props.entityId,
                context: props.context || {},
                [`${component.type}Config`]: props.config, // Compatibilidad con formato antiguo
            };

            // Como no podemos usar JSX aquí, devolvemos una función de renderizado
            return React.createElement(Component, adaptedProps);
        },

        // Componente de configuración si existe
        Settings: component.SettingsComponent ?
            ({ config, onChange, entityType, entityId }) => {
                const SettingsComponent = component.SettingsComponent;
                if (!SettingsComponent) return null;

                // Como no podemos usar JSX aquí, usamos createElement
                return React.createElement(
                    SettingsComponent,
                    {
                        entityType,
                        entityId,
                        onConfigUpdate: (newConfig: T) => onChange(newConfig),
                        className: "w-full"
                    }
                );
            } : undefined,

        // Acciones de servidor si están disponibles
        getServerActions: component.getServerActions,
    };
}

/**
 * Verifica si un objeto es una implementación de capa válida
 */
export function isValidLayerImplementation(layer: unknown): layer is LayerImplementation {
    return (
        layer &&
        typeof layer === 'object' &&
        layer !== null &&
        typeof (layer as LayerImplementation).type === 'string' &&
        typeof (layer as LayerImplementation).name === 'string' &&
        typeof (layer as LayerImplementation).render === 'function'
    );
}

/**
 * Verifica si una capa es compatible con un tipo de entidad específico
 */
export function isLayerCompatibleWithEntityType(
    layer: LayerImplementation,
    entityType: string
): boolean {
    // Si no se especifican tipos compatibles, asumimos que es compatible con todos
    if (!layer.compatibleEntityTypes || layer.compatibleEntityTypes.length === 0) {
        return true;
    }

    // Si incluye "all" o el tipo específico, es compatible
    return (
        layer.compatibleEntityTypes.includes('all') ||
        layer.compatibleEntityTypes.includes(entityType)
    );
}

/**
 * Obtiene la configuración inicial para una capa, combinando los valores por defecto
 * con la configuración existente si está disponible
 */
export function getInitialLayerConfig(
    layer: LayerImplementation,
    existingConfig?: Partial<LayerConfig>
): LayerConfig {
    // Configuración por defecto básica
    const baseConfig: LayerConfig = {
        enabled: true,
        layerIndex: layer.defaultConfig?.layerIndex || 0,
        ...layer.defaultConfig
    };

    // Combinar con la configuración existente si está disponible
    if (existingConfig) {
        return {
            ...baseConfig,
            ...existingConfig,
        };
    }

    return baseConfig;
}

/**
 * Ordena un array de capas por su índice
 */
export function sortLayersByIndex(layers: LayerImplementation[]): LayerImplementation[] {
    return [...layers].sort((a, b) => {
        const indexA = a.defaultConfig?.layerIndex || 0;
        const indexB = b.defaultConfig?.layerIndex || 0;
        return indexA - indexB;
    });
}

/**
 * Extrae la definición de capas de diferentes orígenes
 */
export function getLayersFromSource(source: unknown): LayerImplementation[] {
    // Si es un array, asumimos que ya es un array de capas
    if (Array.isArray(source)) {
        return source.filter(isValidLayerImplementation);
    }

    // Si es un objeto, buscamos propiedades que puedan ser capas
    if (typeof source === 'object' && source !== null) {
        const layers: LayerImplementation[] = [];

        for (const key in source) {
            const value = (source as Record<string, unknown>)[key];
            if (isValidLayerImplementation(value)) {
                layers.push(value);
            }
        }

        return layers;
    }

    return [];
}