'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';
import type { AnimatedBorderConfig } from './actions/animated-border-config.action';

/**
 * AnimatedBorderEffectLayer - Componente que añade un borde animado a la tarjeta.
 * Soporta diferentes configuraciones de animación, patrones y efectos luminosos.
 */
export function AnimatedBorderEffectLayer({
	isExploded,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: LayerComponentProps<AnimatedBorderConfig>) {
	// Valores por defecto
	const defaultConfig: AnimatedBorderConfig = {
		enabled: true,
		width: 2,
		color: '#ffffff',
		secondaryColor: '#00ffff',
		animationSpeed: 1,
		animationType: 'flow',
		glowAmount: 5,
		opacity: 0.8,
		glowColor: 'rgba(255, 255, 255, 0.5)',
		borderRadius: 4,
	};

	// Combinar configuración
	const mergedConfig = { ...defaultConfig, ...config };

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Generar estilos para el borde
	const getBorderStyle = () => {
		const styles: React.CSSProperties = {
			borderWidth: `${mergedConfig.width}px`,
			borderStyle: 'solid',
			borderColor: mergedConfig.color,
			borderRadius: `${mergedConfig.borderRadius}px`,
			opacity: mergedConfig.opacity,
		};

		// Aplicar patrones específicos si están configurados
		if (mergedConfig.dashArray) {
			styles.borderStyle = 'dashed';
			styles.backgroundSize = mergedConfig.dashArray;
		}

		return styles;
	};

	// Obtener clase de animación
	const getAnimationClass = () => {
		switch (mergedConfig.animationType) {
			case 'flow':
				return 'animate-border-flow';
			case 'pulse':
				return 'animate-border-pulse';
			case 'rainbow':
				return 'animate-border-rainbow';
			case 'sparkle':
				return 'animate-border-sparkle';
			default:
				return '';
		}
	};

	// Generar estilos para el efecto de brillo
	const getGlowStyle = () => {
		if (mergedConfig.glowAmount <= 0) {
			return {};
		}

		return {
			boxShadow: `0 0 ${mergedConfig.glowAmount}px 0 ${mergedConfig.glowColor}`,
		};
	};

	return (
		<div
			className={cn(
				'absolute inset-0 z-30 pointer-events-none',
				getAnimationClass(),
				isExploded ? 'exploded-layer layer-animated-border' : ''
			)}
			style={{
				...getBorderStyle(),
				...getGlowStyle(),
				...(isExploded ? getExplodeLayerTransform(10) : {}),
				animationDuration: `${6 / (mergedConfig.animationSpeed || 1)}s`,
			}}
			data-layer-active={activeLayer === 'animated-border' || null}
		/>
	);
}

// Estilos globales necesarios para las animaciones
const GlobalStyles = () => (
	<style jsx global>{`
    @keyframes border-flow {
      0%, 100% {
        border-color: ${globalThis.currentColor || '#ffffff'};
      }
      50% {
        border-color: transparent;
      }
    }

    @keyframes border-pulse {
      0%, 100% {
        box-shadow: 0 0 5px 0 ${globalThis.currentGlowColor || 'rgba(255, 255, 255, 0.5)'};
      }
      50% {
        box-shadow: 0 0 15px 0 ${globalThis.currentGlowColor || 'rgba(255, 255, 255, 0.5)'};
      }
    }

    @keyframes border-rainbow {
      0% { border-color: #ff0000; }
      16.6% { border-color: #ff8000; }
      33.3% { border-color: #ffff00; }
      50% { border-color: #00ff00; }
      66.6% { border-color: #0000ff; }
      83.3% { border-color: #8000ff; }
      100% { border-color: #ff0000; }
    }

    @keyframes border-sparkle {
      0%, 100% {
        border-color: ${globalThis.currentColor || '#ffffff'};
        box-shadow: 0 0 5px 0 ${globalThis.currentGlowColor || 'rgba(255, 255, 255, 0.5)'};
      }
      25% {
        border-color: transparent;
        box-shadow: 0 0 15px 0 ${globalThis.currentGlowColor || 'rgba(255, 255, 255, 0.5)'};
      }
      50% {
        border-color: ${globalThis.currentSecondaryColor || '#00ffff'};
        box-shadow: 0 0 10px 0 ${globalThis.currentGlowColor || 'rgba(255, 255, 255, 0.5)'};
      }
      75% {
        border-color: transparent;
        box-shadow: 0 0 15px 0 ${globalThis.currentGlowColor || 'rgba(255, 255, 255, 0.5)'};
      }
    }

    .animate-border-flow {
      animation: border-flow 4s infinite ease-in-out;
    }

    .animate-border-pulse {
      animation: border-pulse 2s infinite ease-in-out;
    }

    .animate-border-rainbow {
      animation: border-rainbow 6s infinite linear;
    }

    .animate-border-sparkle {
      animation: border-sparkle 3s infinite ease-in-out;
    }
  `}</style>
);

// Exportar el componente con los estilos globales
export default function AnimatedBorderEffectLayerWithStyles(props: LayerComponentProps<AnimatedBorderConfig>) {
	// Establecer variables globales para que sean accesibles desde los keyframes
	if (typeof window !== 'undefined') {
		globalThis.currentColor = props.config?.color || '#ffffff';
		globalThis.currentSecondaryColor = props.config?.secondaryColor || '#00ffff';
		globalThis.currentGlowColor = props.config?.glowColor || 'rgba(255, 255, 255, 0.5)';
	}

	return (
		<>
			<GlobalStyles />
			<AnimatedBorderEffectLayer {...props} />
		</>
	);
}
