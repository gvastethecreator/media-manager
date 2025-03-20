/**
 * ✨ Implementación de la capa de brillo
 * @module GlowLayer
 */

'use client';

import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { withBaseLayer } from '../components/base-layer';
import type { BaseLayerConfig, LayerImplementation } from '../types';
import { generateGlowStyles } from '../utils/visual-effects';
import { deleteGlowConfig, getGlowConfig, updateGlowConfig } from './actions';
import { GlowEffectLayer } from './glow-effect-layer';
import { GlowSettings } from './glow-settings';

/**
 * Tipos de animación disponibles para el efecto de brillo
 */
export type GlowAnimationType = 'follow-mouse' | 'pulse' | 'static';

export interface GlowConfig extends BaseLayerConfig {
    color: string;
    intensity: number;
    spread: number;
    followMouse: boolean;
    animationType: 'none' | 'pulse' | 'follow-mouse';
    animationSpeed: number;
}

export const defaultGlowConfig: GlowConfig = {
    enabled: true,
    layerIndex: 2,
    visibleOnHover: true,
    color: '#00ff00',
    intensity: 1,
    spread: 20,
    followMouse: true,
    animationType: 'follow-mouse',
    animationSpeed: 1,
};

/**
 * ✨ Componente de capa de brillo
 */
const GlowLayerComponent = React.memo(function GlowLayerComponent({
    processedConfig,
    style,
    safeMousePosition,
}: {
    processedConfig: GlowConfig;
    style: React.CSSProperties;
    safeMousePosition: { x: number; y: number };
}) {
    // Calcular posición del brillo
    const glowPosition = React.useMemo(() => {
        if (!processedConfig.followMouse) return { x: 50, y: 50 };
        return {
            x: safeMousePosition.x,
            y: safeMousePosition.y,
        };
    }, [processedConfig.followMouse, safeMousePosition]);

    // Generar estilos de brillo
    const glowStyle = React.useMemo(() => ({
        ...style,
        ...generateGlowStyles(
            processedConfig.color,
            processedConfig.intensity,
            processedConfig.spread
        ),
        transform: `translate(${glowPosition.x}%, ${glowPosition.y}%)`,
        transition: processedConfig.followMouse ? 'transform 0.2s ease-out' : undefined,
    }), [
        processedConfig.color,
        processedConfig.intensity,
        processedConfig.spread,
        glowPosition,
        processedConfig.followMouse,
        style,
    ]);

    return <div style={glowStyle} />;
});

/**
 * ✨ Capa de brillo con funcionalidad base
 */
export const GlowLayer = withBaseLayer<GlowConfig>(GlowLayerComponent);

/**
 * 🎛️ Componente de configuración de brillo
 */
export function GlowSettings({
    config,
    onConfigChange,
}: {
    config: GlowConfig;
    onConfigChange: (config: Partial<GlowConfig>) => void;
}) {
    const handleChange = React.useCallback((key: keyof GlowConfig) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.type === 'color'
                ? event.target.value
                : Number(event.target.value);
        onConfigChange({ [key]: value });
    }, [onConfigChange]);

    return (
        <div className="space-y-4">
            <div className="grid gap-4">
                <label className="flex flex-col gap-2">
                    <span>Color</span>
                    <input
                        type="color"
                        value={config.color}
                        onChange={handleChange('color')}
                    />
                </label>

                <label className="flex flex-col gap-2">
                    <span>Intensidad</span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.intensity}
                        onChange={handleChange('intensity')}
                    />
                </label>

                <label className="flex flex-col gap-2">
                    <span>Dispersión</span>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={config.spread}
                        onChange={handleChange('spread')}
                    />
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={config.followMouse}
                        onChange={handleChange('followMouse')}
                    />
                    <span>Seguir el cursor</span>
                </label>

                <label className="flex flex-col gap-2">
                    <span>Tipo de Animación</span>
                    <select
                        value={config.animationType}
                        onChange={(e) => onConfigChange({ animationType: e.target.value as GlowConfig['animationType'] })}
                    >
                        <option value="none">Ninguna</option>
                        <option value="pulse">Pulso</option>
                        <option value="follow-mouse">Seguir Cursor</option>
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span>Velocidad de Animación</span>
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={config.animationSpeed}
                        onChange={handleChange('animationSpeed')}
                    />
                </label>
            </div>
        </div>
    );
}

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
    defaultConfig: defaultGlowConfig,

    // Icono para representar la capa en la UI
    icon: <Sparkles size={16} />,

    // Tipos de entidad compatibles
    compatibleEntityTypes: ['image', 'album', 'folder'],

    // Función para renderizar la capa
    render: React.memo(({ config, isHovered, mousePosition, isActive, isExploded, entityType }) => {
        // Validar y procesar la configuración
        const processedConfig = React.useMemo(() => ({
            ...defaultGlowConfig,
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
        const handleConfigChange = React.useCallback((newConfig: GlowConfig) => {
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
export { defaultGlowConfig };
export type { GlowConfig };

