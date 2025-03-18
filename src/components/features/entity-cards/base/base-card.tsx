'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import * as React from 'react';
import { CardOptions, RarityConfig, TextureConfig } from '../types/shared-card-types';

export interface BaseCardProps {
	children: React.ReactNode;
	className?: string;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig;
	texture?: TextureConfig;
	onClick?: () => void;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
}

export function BaseCard({
	children,
	className,
	options = {},
	rarity,
	texture,
	onClick,
	onHoverStart,
	onHoverEnd,
}: BaseCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);

	const handleHoverStart = () => {
		setIsHovered(true);
		onHoverStart?.();
	};

	const handleHoverEnd = () => {
		setIsHovered(false);
		onHoverEnd?.();
	};

	return (
		<motion.div
			className={cn('base-card relative', className)}
			whileHover={{
				scale: options.enable3DEffect ? 1.02 : 1,
				y: -5,
				transition: {
					type: 'spring',
					stiffness: 500,
					damping: 30,
				},
			}}
			onClick={onClick}
			onHoverStart={handleHoverStart}
			onHoverEnd={handleHoverEnd}
		>
			{/* Efecto de brillo si está habilitado */}
			{options.enableGlowEffect && (
				<div
					className={cn(
						'absolute -inset-2 bg-gradient-to-r opacity-0 transition-opacity blur-xl',
						isHovered ? 'opacity-70' : 'opacity-0'
					)}
					style={{
						backgroundImage: `linear-gradient(to right,
                            rgb(${options.primaryColor || '59, 130, 246'}),
                            rgb(${options.secondaryColor || '96, 165, 250'})
                        )`,
						zIndex: -1,
					}}
				/>
			)}

			{/* Borde con efecto si está habilitado */}
			{options.enableBorderEffect && (
				<div
					className="absolute inset-0 rounded-lg overflow-hidden"
					style={{
						background: rarity
							? `linear-gradient(135deg, ${rarity.borderColor} 0%, ${rarity.glowColor} 50%, ${rarity.borderColor} 100%)`
							: 'none',
						opacity: isHovered ? 0.8 : 0.4,
						backgroundSize: '200% 200%',
						animation: isHovered ? 'gradient-shift 3s ease infinite' : 'none',
					}}
				>
					<style jsx global>{`
						@keyframes gradient-shift {
							0% {
								background-position: 0% 50%;
							}
							50% {
								background-position: 100% 50%;
							}
							100% {
								background-position: 0% 50%;
							}
						}
					`}</style>
				</div>
			)}

			{/* Efecto holográfico si está habilitado */}
			{options.enableHolographicEffect && isHovered && (
				<div
					className="absolute inset-0 overflow-hidden rounded-lg"
					style={{
						background:
							texture === 'holographic'
								? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3) 100%)'
								: 'none',
						backgroundSize: '200% 200%',
						animation: 'holographic-shift 1.5s ease infinite',
						opacity: 0.6,
					}}
				>
					<style jsx global>{`
						@keyframes holographic-shift {
							0% {
								background-position: 0% 0%;
							}
							50% {
								background-position: 100% 100%;
							}
							100% {
								background-position: 0% 0%;
							}
						}
					`}</style>
				</div>
			)}

			{/* Escanlines si están habilitadas */}
			{options.enableScanlinesEffect && (
				<div
					className="absolute inset-0 opacity-10 overflow-hidden rounded-lg pointer-events-none"
					style={{
						background: `repeating-linear-gradient(
                            to bottom,
                            transparent,
                            transparent 1px,
                            rgba(0, 0, 0, 0.5) 2px,
                            rgba(0, 0, 0, 0.5) 2px
                        )`,
						backgroundSize: '100% 4px',
					}}
				/>
			)}

			{/* Efecto de grano si está habilitado */}
			{options.enableGrainEffect && (
				<div
					className="absolute inset-0 opacity-20 overflow-hidden rounded-lg mix-blend-overlay pointer-events-none"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
					}}
				/>
			)}

			{/* Contenido principal */}
			<div className="relative z-10 h-full">{children}</div>
		</motion.div>
	);
}
