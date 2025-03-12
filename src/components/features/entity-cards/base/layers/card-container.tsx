"use client";

import { cn } from "@/lib/utils/utils";
import { motion } from "motion/react";
import * as React from "react";

export interface CardContainerProps {
	id?: string;
	children: React.ReactNode;
	isHovered: boolean;
	isExploded: boolean;
	transformStyle?: React.CSSProperties;
	rarityBorderStyle?: React.CSSProperties;
	filterId?: string;
	enable3DEffect?: boolean;
	className?: string;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
	onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * CardContainer - El contenedor principal de la tarjeta de entidad.
 * Maneja la estructura principal y las transformaciones 3D.
 */
export function CardContainer({
	id,
	children,
	isHovered,
	isExploded,
	transformStyle,
	rarityBorderStyle,
	filterId,
	enable3DEffect = true,
	className,
	onHoverStart,
	onHoverEnd,
	onMouseMove,
	onClick,
}: CardContainerProps) {
	// Manejadores de eventos
	const handleMouseEnter = React.useCallback(() => {
		if (onHoverStart && !isExploded) {
			onHoverStart();
		}
	}, [onHoverStart, isExploded]);

	const handleMouseLeave = React.useCallback(() => {
		if (onHoverEnd && !isExploded) {
			onHoverEnd();
		}
	}, [onHoverEnd, isExploded]);

	const handleClick = React.useCallback(
		(e?: React.MouseEvent<HTMLDivElement>) => {
			if (onClick && !isExploded) {
				onClick(e);
			}
		},
		[onClick, isExploded]
	);

	return (
		<motion.div
			id={id}
			className={cn(
				"relative card-container h-full w-full overflow-hidden rounded-lg border bg-card/90 shadow-sm backdrop-blur-sm transition-shadow",
				isHovered ? "shadow-lg" : "shadow-md",
				isExploded ? "exploded-layer-container" : "",
				enable3DEffect ? "preserve-3d" : "",
				className
			)}
			onHoverStart={handleMouseEnter}
			onHoverEnd={handleMouseLeave}
			onMouseMove={onMouseMove}
			onClick={handleClick}
			style={{
				...transformStyle,
				...rarityBorderStyle,
				filter: filterId ? `url(#${filterId})` : undefined,
			}}
		>
			{children}
		</motion.div>
	);
}
