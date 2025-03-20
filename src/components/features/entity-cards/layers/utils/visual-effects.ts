/**
 * 🎨 Utilidades para efectos visuales comunes en las capas
 * @module visualEffects
 */

import type { CSSProperties } from 'react';
import type { BlendMode } from '../hooks/use-base-layer';

interface FilterStyles {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hueRotate?: number;
    blur?: number;
    opacity?: number;
}

/**
 * 🔧 Genera estilos CSS para filtros visuales
 */
export function generateFilterStyles(filters: FilterStyles): CSSProperties {
    const filterParts: string[] = [];

    if (filters.brightness !== undefined) filterParts.push(`brightness(${filters.brightness})`);
    if (filters.contrast !== undefined) filterParts.push(`contrast(${filters.contrast}%)`);
    if (filters.saturation !== undefined) filterParts.push(`saturate(${filters.saturation}%)`);
    if (filters.hueRotate !== undefined) filterParts.push(`hue-rotate(${filters.hueRotate}deg)`);
    if (filters.blur !== undefined) filterParts.push(`blur(${filters.blur}px)`);
    if (filters.opacity !== undefined) filterParts.push(`opacity(${filters.opacity}%)`);

    return filterParts.length > 0 ? { filter: filterParts.join(' ') } : {};
}

/**
 * 🎭 Genera estilos CSS para blend modes
 */
export function generateBlendModeStyles(blendMode: BlendMode): CSSProperties {
    return {
        mixBlendMode: blendMode,
        isolation: blendMode !== 'normal' ? 'isolate' : undefined,
    };
}

/**
 * 🌟 Genera estilos CSS para efectos de brillo
 */
export function generateGlowStyles(
    color: string,
    intensity = 1,
    spread = 20
): CSSProperties {
    return {
        boxShadow: `0 0 ${spread}px ${Math.round(spread/2)}px ${color}`,
        filter: `brightness(${100 + intensity * 50}%)`,
    };
}

/**
 * 🎯 Calcula la posición relativa del mouse
 */
export function calculateMousePosition(
    event: React.MouseEvent,
    element: HTMLElement
): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return { x, y };
}

/**
 * 🔄 Genera estilos de transformación 3D
 */
export function generate3DTransform(
    x: number,
    y: number,
    z = 0,
    scale = 1
): CSSProperties {
    return {
        transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
    };
}

/**
 * 🌈 Genera gradientes dinámicos
 */
export function generateGradient(
    colors: string[],
    angle = 0,
    type: 'linear' | 'radial' = 'linear'
): CSSProperties {
    const colorStops = colors.map((color, index) =>
        `${color} ${(index * 100) / (colors.length - 1)}%`
    ).join(', ');

    return {
        background: type === 'linear'
            ? `linear-gradient(${angle}deg, ${colorStops})`
            : `radial-gradient(circle, ${colorStops})`,
    };
}

/**
 * 🎪 Genera estilos para animaciones
 */
export function generateAnimationStyles(
    keyframes: string,
    duration: number,
    timing = 'ease',
    iterations: number | 'infinite' = 'infinite'
): CSSProperties {
    return {
        animation: `${keyframes} ${duration}s ${timing} ${iterations}`,
    };
}

/**
 * 📏 Normaliza valores numéricos dentro de un rango
 */
export function normalizeValue(
    value: number,
    min: number,
    max: number,
    targetMin = 0,
    targetMax = 1
): number {
    const normalized = (value - min) / (max - min);
    return normalized * (targetMax - targetMin) + targetMin;
}