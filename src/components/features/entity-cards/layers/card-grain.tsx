'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardGrainProps {
	options: CardOptions;
	isHovered: boolean;
	className?: string;
}

export function CardGrain({ options, isHovered, className }: CardGrainProps) {
	const { designSystem, visualEffects } = options;

	const { preset, variant, cornerStyle, cornerRadius } = designSystem;

	const { grainIntensity = 1, grainColor } = visualEffects;

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
				opacity: isHovered ? grainIntensity : 0,
				scale: isHovered ? 1.02 : 1,
			}}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Efecto de grano base */}
			<div
				className={cn('absolute inset-0', 'bg-[url("/noise.png")]', 'bg-repeat', 'opacity-5', 'mix-blend-overlay')}
			/>

			{/* Efecto de textura */}
			<div
				className={cn('absolute inset-0', 'bg-[url("/texture.png")]', 'bg-repeat', 'opacity-10', 'mix-blend-overlay')}
			/>

			{/* Efecto de ruido */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-[url("/noise.png")]',
					'bg-repeat',
					'opacity-3',
					'mix-blend-overlay',
					'blur-sm'
				)}
			/>

			{/* Efecto de color */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					grainColor || 'from-white/5 via-transparent to-white/5',
					'mix-blend-overlay'
				)}
			/>

			{/* Efecto de movimiento */}
			<motion.div
				className={cn('absolute inset-0', 'bg-[url("/noise.png")]', 'bg-repeat', 'opacity-2', 'mix-blend-overlay')}
				animate={{
					x: [0, 1, 0],
					y: [0, 1, 0],
				}}
				transition={{
					duration: 20,
					repeat: Infinity,
					ease: 'linear',
				}}
			/>
		</motion.div>
	);
}
