'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CardOptions } from '../types/unified-card-types';

interface CardContainerProps {
	options: CardOptions;
	isHovered: boolean;
	onHoverChange: (isHovered: boolean) => void;
	onClick?: () => void;
	children: React.ReactNode;
	className?: string;
}

export function CardContainer({ options, isHovered, onHoverChange, onClick, children, className }: CardContainerProps) {
	const { designSystem, states, performance } = options;

	const { preset, variant, aspectRatio, cornerStyle, cornerRadius, elevation, shadowStyle } = designSystem || {};

	const { hover, active, disabled, selected } = states || {};

	const { enableHardwareAcceleration, useRAF, batchUpdates, throttleMs } = performance || {};

	// Calcular las transformaciones basadas en el estado
	const transform = {
		scale: isHovered ? hover.scale : 1,
		rotate: isHovered && hover.rotate ? hover.maxRotation : 0,
		y: isHovered && hover.lift ? -hover.liftHeight : 0,
	};

	// Calcular las transiciones
	const transition = {
		duration: hover.duration,
		ease: hover.easing,
	};

	// Calcular los estilos base
	const baseStyles = {
		aspectRatio,
		borderRadius: cornerStyle === 'rounded' ? cornerRadius : 0,
		boxShadow: shadowStyle === 'soft' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
		transform: `translateZ(0)`,
		willChange: enableHardwareAcceleration ? 'transform' : 'auto',
	};

	return (
		<motion.div
			className={cn('relative overflow-hidden bg-card text-card-foreground', className)}
			style={baseStyles}
			animate={transform}
			transition={transition}
			onHoverStart={() => onHoverChange(true)}
			onHoverEnd={() => onHoverChange(false)}
			onClick={onClick}
			whileTap={active}
			initial={false}
			layout
		>
			{children}
		</motion.div>
	);
}
