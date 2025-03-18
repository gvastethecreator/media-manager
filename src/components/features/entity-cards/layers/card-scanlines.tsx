'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardScanlinesProps {
	options: CardOptions;
	isHovered?: boolean;
	className?: string;
}

export function CardScanlines({ options, isHovered, className }: CardScanlinesProps) {
	const { designSystem } = options;

	const { preset, variant, cornerStyle, cornerRadius } = designSystem || {};

	// Obtenemos las propiedades directamente de options o de holographicOptions
	const holographicIntensity = options.holographicOptions?.intensity || 1;
	const holographicColor = options.holographicOptions?.primaryColor;

	return (
		<motion.div
			className={cn(
				'absolute inset-0',
				'pointer-events-none',
				'overflow-hidden',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				className
			)}
			initial={{ opacity: 0 }}
			animate={{ opacity: isHovered ? 0.5 : 0.2 }}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Patrón de líneas de escaneo */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `repeating-linear-gradient(
						0deg,
						rgba(255, 255, 255, 0.05) 0px,
						rgba(255, 255, 255, 0.05) 1px,
						transparent 1px,
						transparent 2px
					)`,
					backgroundSize: '100% 2px',
				}}
			/>

			{/* Efecto de movimiento */}
			<motion.div
				className="absolute inset-0"
				style={{
					backgroundImage: `repeating-linear-gradient(
						0deg,
						rgba(255, 255, 255, 0.1) 0px,
						rgba(255, 255, 255, 0.1) 1px,
						transparent 1px,
						transparent 4px
					)`,
					backgroundSize: '100% 4px',
				}}
				animate={{
					y: [0, 4, 0],
				}}
				transition={{
					duration: 2,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'linear',
				}}
			/>

			{/* Efecto de brillo */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					holographicColor || 'from-white/10 via-transparent to-white/10',
					'blur-xl'
				)}
			/>

			{/* Efecto de resplandor */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					holographicColor || 'from-white/5 via-transparent to-white/5',
					'blur-2xl'
				)}
			/>

			{/* Efecto de pulso */}
			<motion.div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					holographicColor || 'from-white/30 via-transparent to-white/30',
					'blur-lg'
				)}
				animate={{
					opacity: [0.3, 0.6, 0.3],
					scale: [1, 1.05, 1],
				}}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'easeInOut',
				}}
			/>

			{/* Efecto de destello */}
			<motion.div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-r',
					holographicColor || 'from-white/30 via-transparent to-white/30',
					'blur-sm'
				)}
				animate={{
					opacity: [0, 0.5, 0],
					x: ['-100%', '100%', '-100%'],
				}}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'linear',
				}}
			/>

			{/* Línea separadora */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
		</motion.div>
	);
}
