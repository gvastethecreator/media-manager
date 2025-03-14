'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardFooterProps {
	options: CardOptions;
	children: React.ReactNode;
	className?: string;
}

export function CardFooter({ options, children, className }: CardFooterProps) {
	const { designSystem, visualEffects } = options;

	const { preset, variant, cornerStyle, cornerRadius } = designSystem;

	const { enableHolographic, enableGlow, enableGrain } = visualEffects;

	return (
		<motion.div
			className={cn(
				'relative w-full',
				'overflow-hidden',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				enableHolographic && 'holographic-footer',
				enableGlow && 'glow-footer',
				enableGrain && 'grain-footer',
				className
			)}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
		>
			{/* Fondo con gradiente */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-t from-card/80 to-transparent', 'opacity-50')} />

			{/* Contenido del pie de página */}
			<div className="relative z-10 p-4">
				<div className="flex items-center justify-between">{children}</div>
			</div>

			{/* Efecto de brillo */}
			{enableGlow && (
				<div
					className={cn(
						'absolute inset-0',
						'bg-gradient-to-r from-white/5 via-transparent to-white/5',
						'opacity-0 transition-opacity duration-300',
						'group-hover:opacity-100'
					)}
				/>
			)}

			{/* Efecto de grano */}
			{enableGrain && (
				<div className={cn('absolute inset-0', 'bg-[url("/noise.png")]', 'opacity-5', 'mix-blend-overlay')} />
			)}

			{/* Efecto de holográfico */}
			{enableHolographic && (
				<div
					className={cn(
						'absolute inset-0',
						'bg-gradient-to-br from-white/10 via-transparent to-white/10',
						'opacity-0 transition-opacity duration-300',
						'group-hover:opacity-100'
					)}
				/>
			)}

			{/* Línea separadora */}
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
		</motion.div>
	);
}
