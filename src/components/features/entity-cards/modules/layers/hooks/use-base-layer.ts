/**
 * 🎨 Hook base para manejar la funcionalidad común de las capas
 * @module useBaseLayer
 */

import * as React from 'react';
import type { BaseLayerConfig } from '../layer-config-base';

interface UseBaseLayerProps<T extends BaseLayerConfig> {
    config: T;
    defaultConfig: T;
    isHovered?: boolean;
    isExploded?: boolean;
    mousePosition?: { x: number; y: number };
    activeLayer: string | null;
    layerId: string;
}

interface UseBaseLayerResult<T extends BaseLayerConfig> {
    processedConfig: T;
    isVisible: boolean;
    safeMousePosition: { x: number; y: number };
    getTransform: (index: number) => React.CSSProperties;
    isActive: boolean;
}

export function useBaseLayer<T extends BaseLayerConfig>({
    config,
    defaultConfig,
    isHovered = false,
    isExploded = false,
    mousePosition,
    activeLayer,
    layerId,
}: UseBaseLayerProps<T>): UseBaseLayerResult<T> {
    // Procesar y validar configuración
    const processedConfig = React.useMemo(() => ({
        ...defaultConfig,
        ...(config || {}),
    }), [defaultConfig, config]);

    // Determinar visibilidad
    const isVisible = React.useMemo(() => {
        if (!processedConfig.enabled) return false;
        if (processedConfig.visibleOnHover && !isHovered && !isExploded) return false;
        return true;
    }, [processedConfig.enabled, processedConfig.visibleOnHover, isHovered, isExploded]);

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

    // Determinar si la capa está activa
    const isActive = activeLayer === layerId;

    return {
        processedConfig,
        isVisible,
        safeMousePosition,
        getTransform,
        isActive,
    };
}

// Tipos de efectos visuales comunes
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

// Hook para manejar blend modes
export function useBlendMode(blendMode: BlendMode = 'normal') {
    return React.useMemo(() => ({
        mixBlendMode: blendMode,
        isolation: blendMode !== 'normal' ? 'isolate' : undefined,
    }), [blendMode]);
}

// Hook para manejar animaciones
export function useLayerAnimation(
    enabled: boolean,
    type: 'follow-mouse' | 'pulse' | 'static',
    speed = 1
) {
    const [animationPhase, setAnimationPhase] = React.useState(0);

    React.useEffect(() => {
        if (!enabled || type === 'static') return;

        let animationFrame: number;
        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const delta = (currentTime - lastTime) * 0.001 * speed;
            setAnimationPhase(prev => (prev + delta) % 1);
            lastTime = currentTime;
            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [enabled, type, speed]);

    return animationPhase;
}

// Hook para manejar transformaciones
export function useLayerTransform(
    isExploded: boolean,
    layerIndex: number,
    spacing = 10
) {
    return React.useMemo(() => {
        if (!isExploded) return {};
        return {
            transform: `translateZ(${layerIndex * spacing}px)`,
            zIndex: 100 - layerIndex,
        };
    }, [isExploded, layerIndex, spacing]);
}