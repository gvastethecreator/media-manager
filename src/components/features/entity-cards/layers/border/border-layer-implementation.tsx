'use client';

/**
 * 🔲 Implementación de la capa de borde
 *
 * Esta capa proporciona bordes personalizables con efectos visuales y animaciones.
 * Soporta múltiples estilos, gradientes, animaciones y efectos de brillo.
 */

import { motion } from 'motion/react';
import * as React from 'react';
import type { LayerImplementation, LayerRenderProps } from '../types';
import type { BorderConfig } from './border-effect-layer';
import { BorderEffectLayer } from './border-effect-layer';
import { BorderSettings } from './border-settings';

/**
 * Configuración por defecto de la capa de borde
 */
const defaultConfig: BorderConfig = {
    enabled: true,
    layerIndex: 2,
    width: 2,
    style: 'solid',
    color: '#3B82F6',
    radius: 8,
    animated: false,
    animationType: 'none',
    animationSpeed: 1,
    glowAmount: 0,
    opacity: 1,
    cornerStyle: 'round',
};

// Función auxiliar para transformar los layers en modo explotado
const getExplodeTransform = (index: number): React.CSSProperties => {
    const offset = 20 * index;
    return {
        transform: `translate3d(${offset}px, ${offset}px, 0)`,
        zIndex: 10 + index,
    };
};

// Función auxiliar para validar la configuración
const validateBorderConfig = (config: Partial<BorderConfig>): string[] => {
    const errors: string[] = [];

    // Validar valores numéricos
    if (config.width !== undefined && (config.width < 0 || config.width > 20)) {
        errors.push('El ancho del borde debe estar entre 0 y 20px');
    }
    if (config.radius !== undefined && (config.radius < 0 || config.radius > 50)) {
        errors.push('El radio de las esquinas debe estar entre 0 y 50px');
    }
    if (config.opacity !== undefined && (config.opacity < 0 || config.opacity > 1)) {
        errors.push('La opacidad debe estar entre 0 y 1');
    }
    if (config.glowAmount !== undefined && (config.glowAmount < 0 || config.glowAmount > 50)) {
        errors.push('El brillo debe estar entre 0 y 50');
    }
    if (config.animationSpeed !== undefined && (config.animationSpeed < 0.1 || config.animationSpeed > 5)) {
        errors.push('La velocidad de animación debe estar entre 0.1 y 5');
    }

    // Validar gradientes
    if (config.gradient && (!Array.isArray(config.gradient) || config.gradient.length < 2)) {
        errors.push('El gradiente debe tener al menos 2 colores');
    }

    // Validar patrón de guiones
    if (config.dashPattern && (!Array.isArray(config.dashPattern) || config.dashPattern.some(n => n <= 0))) {
        errors.push('El patrón de guiones debe ser un array de números positivos');
    }

    return errors;
};

/**
 * Implementación de la capa de borde
 */
export const borderLayerImplementation: LayerImplementation = {
    // Identificador único de la capa
    type: 'border',

    // Nombre amigable para mostrar en la UI
    name: 'Border Layer',

    // Descripción de la funcionalidad
    description: 'Añade bordes personalizables con efectos visuales y animaciones',

    // Categoría a la que pertenece
    category: 'base',

    // Configuración por defecto
    defaultConfig,

    // Icono para representar la capa en la UI
    icon: '🔲',

    // Tipos de entidad compatibles
    compatibleEntityTypes: ['image', 'video', 'audio', 'document', 'folder'],

    // Renderizado del componente
    render: React.memo((props: LayerRenderProps) => {
        const { config, isExploded, isHovered, mousePosition, isActive, entityType, entityId } = props;
        const safeConfig = config as BorderConfig;

        // Validar configuración
        const errors = validateBorderConfig(safeConfig);
        if (errors.length > 0) {
            console.warn('Errores en la configuración del borde:', errors);
            return null;
        }

        // Asegurar valores por defecto para evitar undefined
        const safeProps = React.useMemo(() => ({
            isExploded: isExploded || false,
            isHovered: isHovered || false,
            mousePosition: mousePosition || { x: 0, y: 0 },
            isActive: isActive || false,
            entityType: entityType || 'default',
            entityId: entityId,
        }), [isExploded, isHovered, mousePosition, isActive, entityType, entityId]);

        // Optimización de rendimiento con motion.div
        return (
            <motion.div
                initial={false}
                animate={{
                    scale: safeProps.isHovered ? 1.02 : 1,
                }}
                transition={{
                    duration: 0.2,
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                }}
            >
                <BorderEffectLayer
                    config={safeConfig}
                    isExploded={safeProps.isExploded}
                    isHovered={safeProps.isHovered}
                    mousePosition={safeProps.mousePosition}
                    isActive={safeProps.isActive}
                    entityType={safeProps.entityType}
                    entityId={safeProps.entityId}
                />
            </motion.div>
        );
    }),

    // Componente de configuración
    Settings: BorderSettings,
};