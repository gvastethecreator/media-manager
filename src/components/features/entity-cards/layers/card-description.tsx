'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardDescriptionProps {
	options: CardOptions;
	description: string;
	maxLength?: number;
	className?: string;
}

export function CardDescription({ options, description, maxLength = 150, className }: CardDescriptionProps) {
	const { designSystem, visualEffects } = options;

	const { preset, variant, cornerStyle, cornerRadius, textStyle } = designSystem;

	const { holographicIntensity = 1, holographicColor } = visualEffects;

	// Formatear la descripción si excede el máximo
	const formattedDescription = description.length > maxLength ? `${description.slice(0, maxLength)}...` : description;

	return (
		<motion.div
			className={cn(
				'relative w-full',
				'overflow-hidden',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				className
			)}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Fondo con gradiente */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-br', 'from-card/80 to-transparent', 'opacity-50')} />

			{/* Contenido de la descripción */}
			<div className="relative z-10 p-4">
				<p className={cn('text-sm text-muted-foreground', 'leading-relaxed', textStyle)}>{formattedDescription}</p>
			</div>

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
					repeat: Infinity,
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
					repeat: Infinity,
					ease: 'linear',
				}}
			/>

			{/* Línea separadora */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
		</motion.div>
	);
}
