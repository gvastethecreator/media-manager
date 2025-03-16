'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useState } from 'react';
import type { CardOptions } from '../types/unified-card-types';

interface CardImageProps {
	options: CardOptions;
	src: string;
	alt: string;
	width?: number;
	height?: number;
	className?: string;
}

export function CardImage({ options, src, alt, width, height, className }: CardImageProps) {
	const { designSystem } = options;

	const { preset, variant, cornerStyle, cornerRadius } = designSystem || {};

	// Obtenemos las propiedades directamente de options o de holographicOptions
	const holographicIntensity = options.holographicOptions?.intensity || 1;
	const holographicColor = options.holographicOptions?.primaryColor;

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(false);

	return (
		<motion.div
			className={cn(
				'relative w-full',
				'overflow-hidden',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				className
			)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Fondo base */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-br', 'from-card/80 to-card/60', 'backdrop-blur-sm')} />

			{/* Contenedor de imagen */}
			<div className="relative z-10 w-full h-full">
				<Image
					src={src}
					alt={alt}
					width={width || 400}
					height={height || 300}
					className={cn(
						'w-full h-full',
						'object-cover',
						'transition-opacity duration-300',
						isLoading ? 'opacity-0' : 'opacity-100'
					)}
					onLoadingComplete={() => setIsLoading(false)}
					onError={() => setError(true)}
					priority
				/>

				{/* Estado de carga */}
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
					</div>
				)}

				{/* Estado de error */}
				{error && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="text-center">
							<div className="w-12 h-12 mx-auto mb-2 text-white/40">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<p className="text-sm text-white/60">Error al cargar la imagen</p>
						</div>
					</div>
				)}
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
		</motion.div>
	);
}
