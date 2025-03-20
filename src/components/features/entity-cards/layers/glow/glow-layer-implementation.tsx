/**
 * ✨ Implementación de capa para efectos de brillo usando la nueva interfaz
 * @module GlowLayerImplementation
 */

'use client';

import { Sparkles } from 'lucide-react';
import * as React from 'react';
import type { GlowEffectOptions } from '../../types/base-card-types';
import type { LayerImplementation } from '../types';
import { deleteGlowConfig, getGlowConfig, updateGlowConfig } from './actions';
import { GlowEffectLayer } from './glow-effect-layer';
import { GlowSettings } from './glow-settings';

/**
 * Tipos de animación disponibles para el efecto de brillo
 */
export type GlowAnimationType = 'follow-mouse' | 'pulse' | 'static';

/**
 * Configuración por defecto de la capa de brillo
 */
const defaultConfig: GlowEffectOptions = {
    enabled: true,
    layerIndex: 4,
    intensity: 0.5,
    color: 'rgba(0, 153, 255, 0.35)',
    size: 100,
    blurAmount: 30,
    animationType: 'follow-mouse' as GlowAnimationType,
    pulseSpeed: 1.5,
    visibleOnHover: true,
};

/**
 * Implementación de la capa de brillo
 * @type {LayerImplementation}
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
    render: React.memo(({ config, isHovered, mousePosition, isActive, isExploded, entityType }) => {
        // Validar y procesar la configuración
        const processedConfig = React.useMemo(() => ({
            ...defaultConfig,
            ...(config || {}),
        }), [config]);

        // Calcular posición del mouse con valores por defecto
        const safeMousePosition = React.useMemo(() => ({
            x: mousePosition?.x ?? 50,
            y: mousePosition?.y ?? 50,
        }), [mousePosition?.x, mousePosition?.y]);

        // Función memoizada para transformación
        const getTransform = React.useCallback((index: number) => ({
            transform: `translateZ(${index * 10}px)`,
            zIndex: 100 - index,
        }), []);

        return (
            <GlowEffectLayer
                isExploded={isExploded || false}
                isHovered={isHovered || false}
                mousePosition={safeMousePosition}
                activeLayer={isActive ? 'glow' : null}
                getExplodeLayerTransform={getTransform}
                options={processedConfig}
            />
        );
    }),

    // Componente para configurar la capa
    Settings: React.memo(({ config, onChange, entityType, entityId }) => {
        // Manejar cambios de configuración de forma optimizada
        const handleConfigChange = React.useCallback((newConfig: GlowEffectOptions) => {
            onChange(newConfig as unknown as Record<string, unknown>);
        }, [onChange]);

        return (
            <GlowSettings
                entityType={entityType}
                entityId={entityId}
                className="w-full"
                onConfigChange={handleConfigChange}
            />
        );
    }),
};

// Funciones de servidor asociadas a la capa
export const glowServerActions = {
    getConfig: getGlowConfig,
    updateConfig: updateGlowConfig,
    deleteConfig: deleteGlowConfig
};

// Exportar tipos y configuración por defecto
export { defaultConfig as defaultGlowConfig };
export type { GlowEffectOptions };
