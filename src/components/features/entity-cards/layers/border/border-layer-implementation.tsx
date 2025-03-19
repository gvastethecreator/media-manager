'use client';

/**
 * 🔲 Implementación de capa para bordes usando la nueva interfaz
 *
 * Este archivo define la implementación de la capa de borde siguiendo
 * la interfaz LayerImplementation definida en el sistema de capas.
 */

import { Square } from 'lucide-react';
import type { LayerImplementation, LayerRenderProps, LayerSettingsProps } from '../types';
import BorderEffectLayerWithStyles, { type BorderConfig } from './border-effect-layer';
import { BorderSettings } from './border-settings';

/**
 * Configuración por defecto de la capa de borde
 */
const defaultConfig: BorderConfig = {
    enabled: true,
    layerIndex: 1,
    width: 2,
    style: 'solid',
    color: '#ffffff',
    radius: 8,
    animated: false,
    animationType: 'none',
    animationSpeed: 1,
    glowAmount: 0,
    opacity: 1,
    cornerStyle: 'round'
};

// Función auxiliar para transformar los layers en modo explotado
const getExplodeTransform = (index: number): React.CSSProperties => {
    const offset = 20 * index;
    return {
        transform: `translate3d(${offset}px, ${offset}px, 0)`,
        zIndex: 10 + index,
    };
};

/**
 * Implementación de la capa de borde
 */
export const borderLayerImplementation: LayerImplementation = {
    // Identificador único de la capa
    type: 'border',

    // Nombre amigable para mostrar en la UI
    name: 'Borde',

    // Descripción de la funcionalidad
    description: 'Añade bordes personalizables a la tarjeta',

    // Categoría a la que pertenece
    category: 'structure',

    // Configuración por defecto
    defaultConfig,

    // Icono para representar la capa en la UI
    icon: <Square size={16} />,

    // Tipos de entidad compatibles
    compatibleEntityTypes: ['image', 'folder', 'album', 'tag', 'collection'],

    // Función para renderizar la capa
    render: (props: LayerRenderProps) => {
        const { config, isHovered, isActive, isExploded, entityType, entityId, mousePosition } = props;

        // Asegurarse de que los props sean válidos y proporcionar valores por defecto
        const safeConfig: BorderConfig = {
            ...defaultConfig,
            ...(config as Record<string, unknown> || {})
        };

        const safeMousePosition = mousePosition || { x: 0, y: 0 };

        // Pasar la configuración al componente de efecto
        return (
            <BorderEffectLayerWithStyles
                config={safeConfig}
                isHovered={!!isHovered}
                isExploded={!!isExploded}
                activeLayer={isActive ? 'border' : null}
                entityType={entityType || 'default'}
                mousePosition={safeMousePosition}
                getExplodeLayerTransform={getExplodeTransform}
                entityId={entityId}
            />
        );
    },

    // Componente para configurar la capa
    Settings: (props: LayerSettingsProps) => {
        const { config, onChange, entityType, entityId } = props;

        // Asegurarse de que los props sean válidos
        const safeConfig: BorderConfig = {
            ...defaultConfig,
            ...(config as Record<string, unknown> || {})
        };

        return (
            <BorderSettings
                entityType={entityType || 'default'}
                entityId={entityId}
                initialConfig={safeConfig}
                onConfigUpdate={(newConfig) => {
                    if (onChange) {
                        onChange(newConfig as unknown as Record<string, unknown>);
                    }
                }}
            />
        );
    }
};