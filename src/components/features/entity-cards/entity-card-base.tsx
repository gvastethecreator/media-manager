'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { CardOptions } from './types/card-settings-types';

interface BaseCardProps {
	title: string;
	description: string;
	onClick?: () => void;
	showVisualConfig?: boolean;
	visualOptions?: CardOptions;
}

export function BaseCard({
	title,
	description,
	onClick,
	showVisualConfig = false,
	visualOptions = {},
}: BaseCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const [isHovered, setIsHovered] = useState(false);
	const [rotation, setRotation] = useState({ x: 0, y: 0 });

	// Aplicar configuración visual
	const {
		enable3DEffect = true,
		designSystem = {
			preset: 'modern',
			cornerStyle: 'rounded',
			elevation: 2,
		},
		enableHolographicEffect = true,
		enableGlowEffect = true,
		enableAnimatedBorder = true,
		enableLightHalo = true,
		layerSystem = {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'screen',
			layerSpacing: 2,
		},
		effects = {
			shadow: {
				enabled: true,
				color: 'rgba(0, 0, 0, 0.2)',
				blur: 10,
				spread: 5,
			},
			reflection: {
				enabled: true,
				opacity: 0.1,
				blur: 2,
			},
			parallax: {
				enabled: true,
				intensity: 0.1,
				perspective: 1000,
			},
		},
		performance = {
			enableHardwareAcceleration: true,
			useRAF: true,
			batchUpdates: true,
			throttleMs: 16,
		},
		states = {
			hover: {
				scale: 1.02,
				rotate: true,
				lift: true,
				duration: 200,
				easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
			},
			active: {
				scale: 0.98,
				brightness: 0.95,
			},
			disabled: {
				opacity: 0.5,
				grayscale: true,
			},
		},
	} = visualOptions;

	useEffect(() => {
		if (!cardRef.current || !enable3DEffect || !showVisualConfig) {
			return;
		}

		const handleMouseMove = (e: MouseEvent) => {
			if (!cardRef.current) {
				return;
			}

			const rect = cardRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const centerX = rect.width / 2;
			const centerY = rect.height / 2;

			const rotateX = ((y - centerY) / centerY) * 10;
			const rotateY = ((x - centerX) / centerX) * 10;

			if (performance.useRAF) {
				requestAnimationFrame(() => {
					setRotation({ x: rotateX, y: rotateY });
				});
			} else {
				setRotation({ x: rotateX, y: rotateY });
			}
		};

		const handleMouseLeave = () => {
			setRotation({ x: 0, y: 0 });
		};

		cardRef.current.addEventListener('mousemove', handleMouseMove);
		cardRef.current.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			if (cardRef.current) {
				cardRef.current.removeEventListener('mousemove', handleMouseMove);
				cardRef.current.removeEventListener('mouseleave', handleMouseLeave);
			}
		};
	}, [enable3DEffect, showVisualConfig, performance.useRAF]);

	const cardStyle = {
		transform: enable3DEffect
			? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
			: undefined,
		transition: 'transform 0.1s ease-out',
		willChange: performance.enableHardwareAcceleration ? 'transform' : undefined,
	};

	const cardClasses = cn(
		'relative overflow-hidden cursor-pointer transition-all duration-200',
		{
			'rounded-lg': designSystem.cornerStyle === 'rounded',
			'shadow-lg': effects.shadow.enabled,
			'hover:scale-105': states.hover.scale !== undefined,
			'active:scale-95': states.active.scale !== undefined,
		},
	);

	const contentStyle = {
		mixBlendMode: layerSystem.layerBlending as React.CSSProperties['mixBlendMode'],
		filter: enableHolographicEffect
			? 'brightness(1.2) contrast(1.1) saturate(1.2)'
			: undefined,
	};

	return (
		<motion.div
			ref={cardRef}
			style={cardStyle}
			className={cardClasses}
			onClick={onClick}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			whileHover={
				states.hover.lift
					? {
							y: -5,
							transition: {
								duration: states.hover.duration ? states.hover.duration / 1000 : 0.2,
								ease: states.hover.easing || 'easeOut',
							},
					  }
					: undefined
			}
		>
			{/* Capa de fondo */}
			<div
				className={cn('absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20', {
					'animate-gradient': enableAnimatedBorder,
				})}
				style={{ zIndex: 0 }}
			/>

			{/* Capa de contenido */}
			<Card className="relative z-10 h-full border-none bg-transparent" style={contentStyle}>
				<div className="p-4">
					<h3 className="text-lg font-semibold mb-2">{title}</h3>
					<p className="text-sm text-gray-500">{description}</p>
				</div>
			</Card>

			{/* Efectos adicionales */}
			{enableGlowEffect && isHovered && (
				<div className="absolute inset-0 bg-blue-500/20 blur-xl" style={{ zIndex: 5 }} />
			)}

			{enableLightHalo && isHovered && (
				<div
					className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
					style={{
						zIndex: 6,
						transform: 'translateX(-100%)',
						animation: 'light-sweep 2s ease-in-out infinite',
					}}
				/>
			)}

			{/* Estilos globales necesarios */}
			<style jsx global>{`
				@keyframes light-sweep {
					0% {
						transform: translateX(-100%);
					}
					100% {
						transform: translateX(100%);
					}
				}

				@keyframes gradient {
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

				.animate-gradient {
					background-size: 200% 200%;
					animation: gradient 3s ease infinite;
				}
			`}</style>
		</motion.div>
	);
}