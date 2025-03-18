'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardMetadataProps {
	options: CardOptions;
	metadata: {
		level?: number;
		type?: string;
		rarity?: string;
		class?: string;
		race?: string;
		alignment?: string;
		[key: string]: any;
	};
	className?: string;
}

export function CardMetadata({ options, metadata, className }: CardMetadataProps) {
	const { designSystem } = options;

	const { preset, variant, cornerStyle, cornerRadius, textStyle } = designSystem || {};

	// Obtenemos las propiedades directamente de options o de holographicOptions
	const holographicIntensity = options.holographicOptions?.intensity || 1;
	const holographicColor = options.holographicOptions?.primaryColor;

	return (
		<motion.div
			className={cn(
				'relative w-full',
				'overflow-hidden',
				cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
				className
			)}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.3,
				ease: 'easeOut',
			}}
		>
			{/* Fondo con gradiente */}
			<div className={cn('absolute inset-0', 'bg-gradient-to-br', 'from-card/80 to-transparent', 'opacity-50')} />

			{/* Contenido de metadatos */}
			<div className="relative z-10 p-4">
				<div className="grid grid-cols-2 gap-4">
					{/* Nivel */}
					{metadata.level && (
						<div className="flex items-center space-x-2">
							<span className="w-4 h-4 text-white/40">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</span>
							<span className={cn('text-sm text-white/80', textStyle)}>Nivel {metadata.level}</span>
						</div>
					)}

					{/* Tipo */}
					{metadata.type && (
						<div className="flex items-center space-x-2">
							<span className="w-4 h-4 text-white/40">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
									/>
								</svg>
							</span>
							<span className={cn('text-sm text-white/80', textStyle)}>{metadata.type}</span>
						</div>
					)}

					{/* Rareza */}
					{metadata.rarity && (
						<div className="flex items-center space-x-2">
							<span className="w-4 h-4 text-white/40">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
									/>
								</svg>
							</span>
							<span className={cn('text-sm text-white/80', textStyle)}>{metadata.rarity}</span>
						</div>
					)}

					{/* Clase */}
					{metadata.class && (
						<div className="flex items-center space-x-2">
							<span className="w-4 h-4 text-white/40">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
									/>
								</svg>
							</span>
							<span className={cn('text-sm text-white/80', textStyle)}>{metadata.class}</span>
						</div>
					)}

					{/* Raza */}
					{metadata.race && (
						<div className="flex items-center space-x-2">
							<span className="w-4 h-4 text-white/40">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</span>
							<span className={cn('text-sm text-white/80', textStyle)}>{metadata.race}</span>
						</div>
					)}

					{/* Alineación */}
					{metadata.alignment && (
						<div className="flex items-center space-x-2">
							<span className="w-4 h-4 text-white/40">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</span>
							<span className={cn('text-sm text-white/80', textStyle)}>{metadata.alignment}</span>
						</div>
					)}
				</div>
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
					repeat: Number.POSITIVE_INFINITY,
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
					repeat: Number.POSITIVE_INFINITY,
					ease: 'linear',
				}}
			/>

			{/* Línea separadora */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
		</motion.div>
	);
}
