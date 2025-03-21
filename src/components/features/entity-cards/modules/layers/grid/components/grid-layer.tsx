'use client';

import { motion } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { CommonLayerProps } from '../../types';
import type { GridConfig } from '../actions/grid-config.action';
import { useGrid } from '../hooks/use-grid';

interface GridLayerProps extends CommonLayerProps {
    config: GridConfig;
}

/**
 * 📏 Componente interno de grid
 */
const GridLayerComponent = ({
    processedConfig,
    style,
    isVisible,
}: {
    processedConfig: GridConfig;
    style: React.CSSProperties;
    isVisible: boolean;
}) => {
    // 🎨 Usar el hook de grid
    const { canvasRef, error, initializeCanvas, renderGrid } = useGrid({
        config: processedConfig,
        shouldRender: isVisible,
    });

    // 🔄 Inicializar el canvas cuando el componente se monta
    useEffect(() => {
        if (isVisible) {
            initializeCanvas();
        }
    }, [isVisible, initializeCanvas]);

    // ❌ Si hay un error, no renderizar nada
    if (error) {
        console.error('Error en GridLayer:', error);
        return null;
    }

    // 🎨 Calcular los estilos del canvas
    const canvasStyle = useMemo(() => ({
        ...style,
        mixBlendMode: processedConfig.blendMode as React.CSSProperties['mixBlendMode'],
    }), [processedConfig.blendMode, style]);

    return (
        <motion.canvas
            ref={canvasRef}
            style={canvasStyle}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        />
    );
};

/**
 * 📏 Capa de grid con funcionalidad base
 */
export const GridLayer = withBaseLayer<GridConfig>(GridLayerComponent);