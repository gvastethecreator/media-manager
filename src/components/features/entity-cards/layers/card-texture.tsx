'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardTextureProps {
	options: CardOptions;
	isHovered: boolean;
	className?: string;
}

export function CardTexture({ options, isHovered, className }: CardTextureProps) {
	const { designSystem } = options;

	const { preset, variant, cornerStyle, cornerRadius } = designSystem || {};

	// Usar las propiedades correctas de CardOptions en lugar de visualEffects
	const enableHolographic = options.enableHolographicEffect || false;
	const enableGlow = options.enableGlowEffect || false;
	const enableGrain = options.enableGrainEffect || false;

	// Valores por defecto para propiedades que no existen directamente
	const textureIntensity = options.holographicOptions?.intensity || 0.5;
	const textureColor = options.holographicOptions?.primaryColor || options.primaryColor || '#3b82f6';

	// Calcular el color de la textura basado en la rareza
	const textureColorClass = options.rarity ? `texture-${options.rarity.toLowerCase()}` : 'texture-default';

	return (
		<motion.div
			className={cn(
				'absolute inset-0',
				'pointer-events-none',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				textureColorClass,
				className
			)}
			animate={{
				opacity: isHovered ? textureIntensity : 0,
			}}
			transition={{
				duration: 0.2,
				ease: 'easeInOut',
			}}
		>
			{/* Patrón de textura */}
			<svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
				<filter id="texture">
					<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
				</filter>
				<rect width="100" height="100" filter="url(#texture)" opacity="0.1" />
			</svg>

			{/* Capa de color de la textura */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-br from-white/5 to-transparent', 'mix-blend-overlay')} />

			{/* Efecto de profundidad */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-br from-black/5 to-transparent', 'mix-blend-multiply')} />

			{/* Efecto de relieve */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)]',
					'bg-[length:20px_20px]',
					'opacity-50'
				)}
			/>
		</motion.div>
	);
}
