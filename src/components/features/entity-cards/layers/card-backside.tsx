'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardBacksideProps {
	options: CardOptions;
	isFlipped: boolean;
	className?: string;
}

export function CardBackside({ options, isFlipped, className }: CardBacksideProps) {
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
			initial={{ opacity: 0, rotateY: 180 }}
			animate={{
				opacity: isFlipped ? 1 : 0,
				rotateY: isFlipped ? 0 : 180,
			}}
			transition={{
				duration: 0.5,
				ease: 'easeInOut',
			}}
		>
			{/* Fondo base */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-br', 'from-card/90 to-card/80', 'backdrop-blur-sm')} />

			{/* Patrón de fondo */}
			<div
				className={cn('absolute inset-0', 'bg-[url("/pattern.png")]', 'bg-repeat', 'opacity-10', 'mix-blend-overlay')}
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

			{/* Líneas decorativas */}
			<div className="absolute inset-0">
				{Array.from({ length: 3 }).map((_, index) => (
					<motion.div
						key={index}
						className={cn(
							'absolute inset-0',
							'bg-gradient-to-r',
							holographicColor || 'from-white/20 via-transparent to-white/20',
							'blur-sm'
						)}
						style={{
							top: `${(index + 1) * 25}%`,
						}}
						animate={{
							opacity: [0, 0.5, 0],
							x: ['-100%', '100%', '-100%'],
						}}
						transition={{
							duration: 2,
							delay: index * 0.2,
							repeat: Infinity,
							ease: 'linear',
						}}
					/>
				))}
			</div>

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
					scale: [1, 1.1, 1],
				}}
				transition={{
					duration: 3,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
			/>

			{/* Contenido del reverso */}
			<div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
				{/* Logo o icono */}
				<div className="w-16 h-16 mb-4">
					<img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
				</div>

				{/* Texto */}
				<div className="text-center">
					<h3 className="text-lg font-semibold text-white/90">Image Manager</h3>
					<p className="text-sm text-white/70">Tu gestor de imágenes</p>
				</div>
			</div>
		</motion.div>
	);
}
