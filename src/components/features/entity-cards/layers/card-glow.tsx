'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardGlowProps {
	options: CardOptions;
	isHovered: boolean;
	className?: string;
}

export function CardGlow({ options, isHovered, className }: CardGlowProps) {
	const { designSystem, visualEffects } = options;

	const { preset, variant, cornerStyle, cornerRadius } = designSystem || {};

	const { glowIntensity = 1, glowColor } = visualEffects;

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
				opacity: isHovered ? glowIntensity : 0,
				scale: isHovered ? 1.05 : 1,
			}}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Efecto de brillo base */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					glowColor || 'from-white/20 via-transparent to-white/20',
					'blur-xl'
				)}
			/>

			{/* Efecto de resplandor */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					glowColor || 'from-white/10 via-transparent to-white/10',
					'blur-2xl'
				)}
			/>

			{/* Efecto de aura */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					glowColor || 'from-white/5 via-transparent to-white/5',
					'blur-3xl'
				)}
			/>

			{/* Efecto de pulso */}
			<motion.div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					glowColor || 'from-white/30 via-transparent to-white/30',
					'blur-lg'
				)}
				animate={{
					opacity: [0.5, 0.8, 0.5],
					scale: [1, 1.1, 1],
				}}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
			/>

			{/* Efecto de destello */}
			<motion.div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					glowColor || 'from-white/40 via-transparent to-white/40',
					'blur-md'
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
