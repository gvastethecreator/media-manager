'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardContainerProps {
	children: ReactNode;
	primaryColor: string;
	secondaryColor: string;
	className?: string;
}

/**
 * Componente contenedor para tarjetas de entidades
 * Proporciona un estilo base común para todas las tarjetas de tipo Magic
 */
export function CardContainer({
	children,
	primaryColor,
	secondaryColor,
	className,
}: CardContainerProps) {
	return (
		<div
			className={cn(
				'flex flex-col overflow-hidden h-full border rounded-md',
				'bg-card text-card-foreground',
				'transition-all duration-300',
				className
			)}
			style={{
				borderColor: `${primaryColor}90`,
				boxShadow: `0 4px 6px -1px ${primaryColor}20, 0 2px 4px -2px ${primaryColor}20`,
				background: `linear-gradient(135deg, ${primaryColor}05, ${secondaryColor}10)`,
			}}
		>
			{children}
		</div>
	);
}