'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { GlowAnimationType } from './glow-layer-implementation';
import { generateGlowStyles } from './glow-utils';

interface GlowEffectLayerProps {
	children: React.ReactNode;
	color: string;
	intensity: number;
	size?: number;
	blurAmount: number;
	animationType: GlowAnimationType;
	pulseSpeed?: number;
	isHovered?: boolean;
	mousePosition?: { x: number; y: number };
	visible?: boolean;
	layerIndex?: number;
	opacity?: number;
	blendMode?: string;
}

/**
 * Componente que crea un efecto de brillo alrededor de su contenido
 */
export const GlowEffectLayer: React.FC<GlowEffectLayerProps> = ({
	children,
	color,
	intensity,
	size = 100,
	blurAmount,
	animationType,
	pulseSpeed = 1.5,
	isHovered = false,
	mousePosition = { x: 50, y: 50 },
	visible = true,
	layerIndex = 10,
	opacity = 1,
	blendMode = 'normal'
}) => {
	const [time, setTime] = useState(0);

	// Animar el tiempo cuando sea necesario
	useEffect(() => {
		if (animationType === 'none' || animationType === 'static') return;

		let frameId: number;
		let lastTime = 0;

		const animate = (timestamp: number) => {
			if (lastTime === 0) lastTime = timestamp;
			const delta = (timestamp - lastTime) / 1000;
			lastTime = timestamp;

			setTime(prevTime => prevTime + delta * pulseSpeed);
			frameId = requestAnimationFrame(animate);
		};

		frameId = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, [animationType, pulseSpeed]);

	// Calcular las propiedades CSS para el efecto de brillo
	const glowStyles = useMemo(() => {
		// Calcular la posición en función del tipo de animación
		let x = 50;
		let y = 50;
		let scale = 1;

		switch (animationType) {
			case 'follow-mouse':
				x = mousePosition.x;
				y = mousePosition.y;
				break;
			case 'pulse':
				// Escala que varía con el tiempo para crear pulso
				scale = 0.8 + Math.sin(time * Math.PI) * 0.2;
				break;
			case 'radial-pulse':
				// Cambiar la posición en un patrón circular
				x = 50 + Math.sin(time * 2) * 25;
				y = 50 + Math.cos(time * 2) * 25;
				break;
			default:
				break;
		}

		// Obtener el color ajustado por la intensidad para el brillo
		const currentIntensity = intensity * (animationType === 'pulse' ? scale : 1);

		// Generar los estilos base
		const baseStyles = generateGlowStyles(color, currentIntensity, size);

		// Combinar con estilos de posicionamiento
		return {
			...baseStyles,
			'--glow-x': `${x}%`,
			'--glow-y': `${y}%`,
			'--glow-opacity': visible ? opacity : 0,
			'--glow-blur': `${blurAmount}px`,
			'--glow-blend-mode': blendMode,

			// Ajustar el z-index según la posición en el stack de capas
			zIndex: layerIndex,

			// Transición para cuando cambie la visibilidad
			transition: 'opacity 0.3s ease-in-out',
		};
	}, [
		animationType,
		color,
		intensity,
		size,
		mousePosition,
		time,
		visible,
		opacity,
		blurAmount,
		blendMode,
		layerIndex
	]);

	// Renderizar el efecto de brillo
	return (
		<div className="glow-effect-container relative w-full h-full">
			{/* Capa de brillo */}
			<div
				className="glow-effect absolute inset-0 rounded-inherit pointer-events-none overflow-hidden"
				style={{
					opacity: visible ? 1 : 0,
					...glowStyles as any
				}}
			>
				<div className="glow-radial-gradient absolute inset-0" />
			</div>

			{/* Contenido que recibe el brillo */}
			<div className="glow-content relative z-10">
				{children}
			</div>

			<style jsx>{`
				.glow-effect-container {
					isolation: isolate;
				}

				.glow-effect {
					mix-blend-mode: var(--glow-blend-mode, normal);
					opacity: var(--glow-opacity, 1);
				}

				.glow-radial-gradient {
					background: radial-gradient(
						circle at var(--glow-x) var(--glow-y),
						var(--glow-color-bright) 0%,
						var(--glow-color-mid) 40%,
						var(--glow-color-dim) 70%,
						transparent 100%
					);
					filter: blur(var(--glow-blur, 20px));
					transform: scale(1.2);
				}
			`}</style>
		</div>
	);
};
