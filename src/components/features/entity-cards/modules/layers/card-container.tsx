'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import * as React from 'react';
import type { CardContainerProps } from '../types/card-layer-types';

/**
 * Contenedor principal para las tarjetas de entidades
 * Gestiona aspectos básicos como bordes, sombras, y comportamientos de hover
 */
export function CardContainer({
	children,
	isHovered,
	isExploded,
	transformStyle = {},
	rarityBorderStyle = {},
	filterId,
	enable3DEffect = true,
	onHoverStart,
	onHoverEnd,
	onMouseMove,
	onClick,
	id,
	// Nuevas propiedades
	disabled = false,
	rounded = 'md',
	borderSize = 'sm',
}: CardContainerProps) {
	// Mapa de tamaños de redondeo
	const roundedSizeClasses = {
		none: 'rounded-none',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		xl: 'rounded-xl',
		'2xl': 'rounded-2xl',
		full: 'rounded-full',
	};

	// Mapa de tamaños de borde
	const borderSizeClasses = {
		none: 'border-0',
		sm: 'border',
		md: 'border-2',
		lg: 'border-4',
	};

	// Aplicar clases según las propiedades
	const containerClasses = cn(
		'relative overflow-hidden transition-all duration-200 card-base',
		// Clases condicionales
		isExploded ? 'exploded-container shadow-none' : '',
		isHovered ? 'card-hovered z-10' : 'z-0',
		disabled ? 'opacity-50 pointer-events-none' : 'opacity-100',
		// Clases de estilo
		roundedSizeClasses[rounded as keyof typeof roundedSizeClasses],
		borderSizeClasses[borderSize as keyof typeof borderSizeClasses],
		'bg-card border-border',
		enable3DEffect ? 'preserve-3d' : ''
	);

	// Manejadores de eventos
	const handleMouseEnter = React.useCallback(() => {
		onHoverStart?.();
	}, [onHoverStart]);

	const handleMouseLeave = React.useCallback(() => {
		onHoverEnd?.();
	}, [onHoverEnd]);

	const handleMouseMove = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			onMouseMove?.(e);
		},
		[onMouseMove]
	);

	const handleClick = React.useCallback(
		(e?: React.MouseEvent<HTMLDivElement>) => {
			if (e) {
				onClick?.(e);
			}
		},
		[onClick]
	);

	return (
		<motion.div
			id={id}
			className={containerClasses}
			onHoverStart={handleMouseEnter}
			onHoverEnd={handleMouseLeave}
			onMouseMove={handleMouseMove}
			onClick={handleClick}
			style={{
				...transformStyle,
				...rarityBorderStyle,
				filter: filterId ? `url(#${filterId})` : 'none',
			}}
		>
			{children}
		</motion.div>
	);
}
