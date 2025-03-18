'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardHolographicProps {
	options: CardOptions;
	isHovered: boolean;
	className?: string;
}

export function CardHolographic({ options, isHovered, className }: CardHolographicProps) {
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
			animate={{
				opacity: isHovered ? holographicIntensity : 0,
				scale: isHovered ? 1.05 : 1,
			}}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Efecto de iridiscencia */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					holographicColor || 'from-white/10 via-transparent to-white/10',
					'blur-xl'
				)}
			/>

			{/* Efecto de resplandor holográfico */}
			<div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					holographicColor || 'from-white/5 via-transparent to-white/5',
					'blur-2xl'
				)}
			/>

			{/* Líneas holográficas */}
			<div className="absolute inset-0">
				{Array.from({ length: 5 }).map((_, index) => (
					<motion.div
						key={index}
						className={cn(
							'absolute inset-0',
							'bg-gradient-to-r',
							holographicColor || 'from-white/20 via-transparent to-white/20',
							'blur-sm'
						)}
						style={{
							top: `${(index + 1) * 20}%`,
						}}
						animate={{
							opacity: [0, 0.5, 0],
							x: ['-100%', '100%', '-100%'],
						}}
						transition={{
							duration: 2,
							delay: index * 0.2,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</div>

			{/* Efecto de borde holográfico */}
			<div className={cn('absolute inset-0', 'border', holographicColor || 'border-white/20', 'blur-sm')} />

			{/* Efecto de pulso holográfico */}
			<motion.div
				className={cn(
					'absolute inset-0',
					'bg-gradient-to-br',
					holographicColor || 'from-white/30 via-transparent to-white/30',
					'blur-lg'
				)}
				animate={{
					opacity: [0.3, 0.6, 0.3],
					scale: [1, 1.1, 1],
				}}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'easeInOut',
				}}
			/>
		</motion.div>
	);
}
