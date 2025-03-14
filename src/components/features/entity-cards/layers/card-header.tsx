'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardHeaderProps {
	options: CardOptions;
	title: string;
	subtitle?: string;
	badges?: Array<{
		label: string;
		color?: string;
		icon?: React.ReactNode;
	}>;
	className?: string;
}

export function CardHeader({ options, title, subtitle, badges, className }: CardHeaderProps) {
	const { designSystem, visualEffects } = options;

	const { preset, variant, cornerStyle, cornerRadius, textStyle } = designSystem;

	const { enableHolographic, enableGlow, enableGrain } = visualEffects;

	return (
		<motion.div
			className={cn(
				'relative w-full',
				'overflow-hidden',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				enableHolographic && 'holographic-header',
				enableGlow && 'glow-header',
				enableGrain && 'grain-header',
				className
			)}
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
		>
			{/* Fondo con gradiente */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-b from-card/80 to-transparent', 'opacity-50')} />

			{/* Contenido del encabezado */}
			<div className="relative z-10 p-4">
				<div className="flex flex-col space-y-2">
					{/* Título y subtítulo */}
					<div className="flex flex-col space-y-1">
						<h3 className={cn('text-lg font-semibold', textStyle)}>{title}</h3>
						{subtitle && <p className={cn('text-sm text-muted-foreground', textStyle)}>{subtitle}</p>}
					</div>

					{/* Badges */}
					{badges && badges.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{badges.map((badge, index) => (
								<motion.div
									key={index}
									className={cn(
										'px-2 py-1 rounded-full text-xs font-medium',
										'flex items-center space-x-1',
										badge.color || 'bg-primary/10 text-primary'
									)}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: index * 0.1 }}
								>
									{badge.icon && <span className="w-3 h-3">{badge.icon}</span>}
									<span>{badge.label}</span>
								</motion.div>
							))}
						</div>
					)}
				</div>
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
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
		</motion.div>
	);
}
