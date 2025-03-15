'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardBorderProps {
	options: CardOptions;
	isHovered: boolean;
	className?: string;
}

export function CardBorder({ options, isHovered, className }: CardBorderProps) {
	const { designSystem, visualEffects } = options;

	const { preset, variant, cornerStyle, cornerRadius, borderStyle, borderWidth } = designSystem || {};

	const { holographicIntensity = 1, holographicColor } = visualEffects;

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
			animate={{
				opacity: isHovered ? 1 : 0.8,
				scale: isHovered ? 1.02 : 1,
			}}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Borde base */}
			<div
				className={cn(
					'absolute inset-0',
					'border',
					borderStyle === 'solid' && 'border-solid',
					borderStyle === 'dashed' && 'border-dashed',
					borderStyle === 'dotted' && 'border-dotted',
					`border-${borderWidth}`,
					'border-white/20'
				)}
			/>

			{/* Borde exterior */}
			<div
				className={cn(
					'absolute inset-0',
					'border',
					borderStyle === 'solid' && 'border-solid',
					borderStyle === 'dashed' && 'border-dashed',
					borderStyle === 'dotted' && 'border-dotted',
					`border-${borderWidth}`,
					'border-white/10',
					'blur-sm'
				)}
			/>

			{/* Borde interior */}
			<div
				className={cn(
					'absolute inset-0',
					'border',
					borderStyle === 'solid' && 'border-solid',
					borderStyle === 'dashed' && 'border-dashed',
					borderStyle === 'dotted' && 'border-dotted',
					`border-${borderWidth}`,
					'border-white/30',
					'blur-sm'
				)}
			/>

			{/* Efecto de brillo de borde */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					holographicColor || 'from-white/20 via-transparent to-white/20',
					'blur-sm'
				)}
			/>

			{/* Efecto de pulso de borde */}
			<motion.div
				className={cn(
					'absolute inset-0',
					'border',
					borderStyle === 'solid' && 'border-solid',
					borderStyle === 'dashed' && 'border-dashed',
					borderStyle === 'dotted' && 'border-dotted',
					`border-${borderWidth}`,
					'border-white/40',
					'blur-sm'
				)}
				animate={{
					opacity: [0.3, 0.6, 0.3],
					scale: [1, 1.05, 1],
				}}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
			/>

			{/* Efecto de destello de borde */}
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
		</motion.div>
	);
}
