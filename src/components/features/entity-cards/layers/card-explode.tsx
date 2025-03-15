'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardExplodeProps {
	options: CardOptions;
	isExploded: boolean;
	layers: {
		id: string;
		label: string;
		icon?: React.ReactNode;
		content: React.ReactNode;
	}[];
	onLayerClick?: (layerId: string) => void;
	className?: string;
}

export function CardExplode({ options, isExploded, layers, onLayerClick, className }: CardExplodeProps) {
	const { designSystem, visualEffects } = options;

	const { preset, variant, cornerStyle, cornerRadius } = designSystem || {};

	const { enableHolographic, enableGlow, enableGrain } = visualEffects;

	// Función para calcular la transformación de cada capa
	const getLayerTransform = (index: number) => {
		const baseDistance = 20;
		const angle = (index * 360) / layers.length;
		const radian = (angle * Math.PI) / 180;

		return {
			x: Math.cos(radian) * baseDistance,
			y: Math.sin(radian) * baseDistance,
			rotate: angle,
			z: index * 10,
		};
	};

	return (
		<AnimatePresence>
			{isExploded && (
				<motion.div
					className={cn(
						'absolute inset-0',
						'pointer-events-none',
						'overflow-hidden',
						cornerStyle === 'rounded' && `rounded-${cornerRadius}`,
						enableHolographic && 'holographic-explode',
						enableGlow && 'glow-explode',
						enableGrain && 'grain-explode',
						className
					)}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3, ease: 'easeOut' }}
				>
					{/* Capas de la tarjeta */}
					{layers.map((layer, index) => {
						const transform = getLayerTransform(index);

						return (
							<motion.div
								key={layer.id}
								className={cn(
									'absolute inset-0',
									'cursor-pointer',
									'pointer-events-auto',
									'bg-card/90',
									'backdrop-blur-sm',
									cornerStyle === 'rounded' && `rounded-${cornerRadius}`
								)}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{
									opacity: 1,
									scale: 1,
									x: transform.x,
									y: transform.y,
									rotate: transform.rotate,
									z: transform.z,
								}}
								exit={{
									opacity: 0,
									scale: 0.8,
									x: 0,
									y: 0,
									rotate: 0,
									z: 0,
								}}
								transition={{
									duration: 0.5,
									delay: index * 0.1,
									ease: 'easeOut',
								}}
								onClick={() => onLayerClick?.(layer.id)}
							>
								{/* Encabezado de la capa */}
								<div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between bg-card/50">
									<div className="flex items-center space-x-2">
										{layer.icon && <span className="text-xs">{layer.icon}</span>}
										<span className="text-xs font-medium">{layer.label}</span>
									</div>
								</div>

								{/* Contenido de la capa */}
								<div className="absolute inset-0 pt-8 p-4">{layer.content}</div>

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
					})}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
