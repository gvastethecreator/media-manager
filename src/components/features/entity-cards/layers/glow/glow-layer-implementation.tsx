'use client';

/**
 * ✨ Implementación de capa para efectos de brillo usando la nueva interfaz
 *
 * Este archivo define la implementación de la capa de brillo siguiendo
 * la interfaz LayerImplementation definida en el sistema de capas.
 */

import { Sparkles } from 'lucide-react';
import type { GlowEffectOptions } from '../../types/base-card-types';
import type { LayerImplementation } from '../types';
import { deleteGlowConfig, getGlowConfig, updateGlowConfig } from './actions';
import { GlowEffectLayer } from './glow-effect-layer';
import { GlowSettings } from './glow-settings';

/**
 * Configuración por defecto de la capa de brillo
 */
const defaultConfig = {
    enabled: true,
    layerIndex: 4,
    intensity: 0.5,
    color: 'rgba(0, 153, 255, 0.35)',
    size: 100,
    blurAmount: 30,
    animationType: 'follow-mouse',
    pulseSpeed: 1.5,
    visibleOnHover: true,
};

/**
 * Implementación de la capa de brillo
 */
export const glowLayerImplementation: LayerImplementation = {
    // Identificador único de la capa
    type: 'glow',

    // Nombre amigable para mostrar en la UI
    name: 'Brillo',

    // Descripción de la funcionalidad
    description: 'Añade efectos de brillo y resplandor a la tarjeta',

    // Categoría a la que pertenece
    category: 'effects',

    // Configuración por defecto
    defaultConfig,

    // Icono para representar la capa en la UI
    icon: <Sparkles size={16} />,

    // Tipos de entidad compatibles
    compatibleEntityTypes: ['image', 'album', 'folder'],

    // Función para renderizar la capa
    render: ({ config, isHovered, mousePosition, isActive, isExploded, entityType }) => {
        return (
            <GlowEffectLayer
                isExploded={isExploded || false}
                isHovered={isHovered || false}
                mousePosition={mousePosition || { x: 50, y: 50 }}
                activeLayer={isActive ? 'glow' : null}
                getExplodeLayerTransform={(index) => ({
                    transform: `translateZ(${index * 10}px)`,
                    zIndex: 100 - index,
                })}
                options={config as GlowEffectOptions}
            />
        );
    },

    // Componente para configurar la capa
    Settings: ({ config, onChange, entityType, entityId }) => {
        return (
            <GlowSettings
                entityType={entityType}
                entityId={entityId}
                className="w-full"
                onConfigChange={(newConfig: GlowEffectOptions) => onChange(newConfig as unknown as Record<string, unknown>)}
            />
        );
    }
};

// Funciones de servidor asociadas a la capa
export const glowServerActions = {
    getConfig: getGlowConfig,
    updateConfig: updateGlowConfig,
    deleteConfig: deleteGlowConfig
};