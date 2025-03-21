/**
 * ✨ Implementación de la capa de brillo
 * @module GlowLayer
 */

'use client';

import { Sparkles } from 'lucide-react';
import React from 'react';
import type { BaseLayerConfig } from '../layer-config-base';
import type { LayerImplementation } from '../types';
import { GlowEffectLayer } from './glow-effect-layer';
import { generateGlowStyles } from './glow-utils';

/**
 * Tipos de animación disponibles para el efecto de brillo
 */
export type GlowAnimationType =
    | 'none'
    | 'pulse'
    | 'follow-mouse'
    | 'radial-pulse'
    | 'static';

/**
 * Interfaz de configuración para la capa de brillo
 */
export interface GlowConfig extends BaseLayerConfig {
    color: string;
    intensity: number;
    size?: number;
    blurAmount: number;
    animationType: GlowAnimationType;
    pulseSpeed: number;
    visibleOnHover: boolean;
    spread?: number;
    followMouse?: boolean;
    animationSpeed?: number;
    blendMode?: string;
}

/**
 * Configuración predeterminada para la capa de brillo
 */
export const defaultGlowConfig: GlowConfig = {
    enabled: true,
    color: 'rgba(0, 153, 255, 0.35)',
    intensity: 0.5,
    size: 100,
    blurAmount: 30,
    animationType: 'follow-mouse',
    pulseSpeed: 1.5,
    visibleOnHover: true,
    layerIndex: 4,
    opacity: 1,
    blendMode: 'normal'
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
            processedConfig.spread as number
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
export const GlowLayer = React.memo(GlowLayerComponent);

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
                        value={config.spread || 0}
                        onChange={handleChange('spread')}
                    />
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={config.followMouse || false}
                        onChange={handleChange('followMouse')}
                    />
                    <span>Seguir el cursor</span>
                </label>

                <label className="flex flex-col gap-2">
                    <span>Tipo de Animación</span>
                    <select
                        value={config.animationType}
                        onChange={(e) => onConfigChange({ animationType: e.target.value as GlowAnimationType })}
                    >
                        <option value="none">Ninguna</option>
                        <option value="pulse">Pulso</option>
                        <option value="follow-mouse">Seguir Cursor</option>
                        <option value="static">Estático</option>
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span>Velocidad de Animación</span>
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={config.animationSpeed || 1}
                        onChange={handleChange('animationSpeed')}
                    />
                </label>
            </div>
        </div>
    );
}

/**
 * Implementación de la capa de brillo
 */
export const glowLayerImplementation: LayerImplementation<GlowConfig> = {
    type: 'glow',
    name: 'Glow',
    description: 'Add a glowing effect to your card',
    category: 'effects',
    icon: Sparkles,
    defaultConfig: defaultGlowConfig,

    presets: [
        {
            name: 'Subtle Blue',
            description: 'A subtle blue glow effect',
            config: {
                ...defaultGlowConfig,
                color: 'rgba(0, 123, 255, 0.25)',
                intensity: 0.3,
                blurAmount: 20
            }
        },
        {
            name: 'Intense Purple',
            description: 'A vibrant purple glow effect',
            config: {
                ...defaultGlowConfig,
                color: 'rgba(123, 31, 162, 0.5)',
                intensity: 0.7,
                blurAmount: 40
            }
        },
        {
            name: 'Hover Only',
            description: 'Glow appears only on hover',
            config: {
                ...defaultGlowConfig,
                visibleOnHover: true,
                animationType: 'pulse'
            }
        }
    ],

    render: (props) => {
        const { config, children, isHovered, mousePosition } = props;

        if (!config.enabled) {
            return children;
        }

        // Solo mostrar en hover si está configurado así
        const visible = config.visibleOnHover ? isHovered : true;

        // Prepara las opciones para el componente GlowEffectLayer
        const options = {
            color: config.color,
            intensity: config.intensity,
            size: config.size,
            blurAmount: config.blurAmount,
            animationType: config.animationType,
            pulseSpeed: config.pulseSpeed,
            visibleOnHover: config.visibleOnHover,
            layerIndex: config.layerIndex,
            opacity: config.opacity || 1,
            blendMode: config.blendMode || 'normal'
        };

        return (
            <GlowEffectLayer
                {...options}
                isHovered={isHovered}
                mousePosition={mousePosition}
                visible={visible}
            >
                {children}
            </GlowEffectLayer>
        );
    },

    settings: (props) => {
        const { config, onConfigChange } = props;
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium">
                        Enabled
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => onConfigChange({ enabled: e.target.checked })}
                            className="ml-2"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Color</label>
                    <input
                        type="color"
                        value={config.color.startsWith('rgba')
                            ? '#' + config.color.replace(/rgba\((\d+), (\d+), (\d+).*/, (_, r, g, b) =>
                                ((1 << 24) + (Number.parseInt(r) << 16) + (Number.parseInt(g) << 8) + Number.parseInt(b)).toString(16).slice(1))
                            : config.color
                        }
                        onChange={(e) => onConfigChange({ color: e.target.value })}
                        className="w-full h-8"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Intensity</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={config.intensity}
                        onChange={(e) => onConfigChange({ intensity: Number.parseFloat(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Size</label>
                    <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={config.size}
                        onChange={(e) => onConfigChange({ size: Number.parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Blur Amount</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={config.blurAmount}
                        onChange={(e) => onConfigChange({ blurAmount: Number.parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Animation Type</label>
                    <select
                        value={config.animationType}
                        onChange={(e) => onConfigChange({ animationType: e.target.value as GlowAnimationType })}
                        className="w-full p-2 border rounded"
                    >
                        <option value="none">None</option>
                        <option value="pulse">Pulse</option>
                        <option value="follow-mouse">Follow Mouse</option>
                        <option value="radial-pulse">Radial Pulse</option>
                        <option value="static">Static</option>
                    </select>
                </div>

                {config.animationType === 'pulse' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Pulse Speed</label>
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={config.pulseSpeed}
                            onChange={(e) => onConfigChange({ pulseSpeed: Number.parseFloat(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-medium">
                        Visible on Hover Only
                        <input
                            type="checkbox"
                            checked={config.visibleOnHover}
                            onChange={(e) => onConfigChange({ visibleOnHover: e.target.checked })}
                            className="ml-2"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Blend Mode</label>
                    <select
                        value={config.blendMode || 'normal'}
                        onChange={(e) => onConfigChange({ blendMode: e.target.value })}
                        className="w-full p-2 border rounded"
                    >
                        <option value="normal">Normal</option>
                        <option value="screen">Screen</option>
                        <option value="multiply">Multiply</option>
                        <option value="overlay">Overlay</option>
                        <option value="darken">Darken</option>
                        <option value="lighten">Lighten</option>
                    </select>
                </div>
            </div>
        );
    }
};

