'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardContentProps {
	options: CardOptions;
	children: React.ReactNode;
	className?: string;
}

export function CardContent({ options, children, className }: CardContentProps) {
	const { designSystem, visualEffects } = options;

	const {
		preset,
		variant,
		cornerStyle,
		cornerRadius,
		contentLayout,
		contentPadding,
		contentSpacing,
		contentAlignment,
	} = designSystem;

	const { enableHolographic, enableGlow, enableGrain } = visualEffects;

	// Función para obtener las clases de layout
	const getLayoutClasses = () => {
		switch (contentLayout) {
			case 'grid':
				return 'grid grid-cols-2 gap-4';
			case 'masonry':
				return 'columns-2 gap-4';
			case 'carousel':
				return 'flex overflow-x-auto gap-4';
			default:
				return 'flex flex-col gap-4';
		}
	};

	// Función para obtener las clases de alineación
	const getAlignmentClasses = () => {
		switch (contentAlignment) {
			case 'center':
				return 'items-center justify-center';
			case 'end':
				return 'items-end justify-end';
			default:
				return 'items-start justify-start';
		}
	};

	return (
		<motion.div
			className={cn(
				'relative w-full h-full',
				'overflow-hidden',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				enableHolographic && 'holographic-content',
				enableGlow && 'glow-content',
				enableGrain && 'grain-content',
				className
			)}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
		>
			{/* Fondo con gradiente */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-b from-transparent to-card/20', 'opacity-50')} />

			{/* Contenedor principal */}
			<div
				className={cn(
					'relative z-10 w-full h-full',
					getLayoutClasses(),
					getAlignmentClasses(),
					`p-${contentPadding}`,
					`gap-${contentSpacing}`
				)}
			>
				{children}
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
		</motion.div>
	);
}
